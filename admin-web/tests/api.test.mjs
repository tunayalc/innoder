import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

// Compile only the client, using the same TypeScript already required by the app.
const source = await readFile(
  new URL('../src/api.ts', import.meta.url),
  'utf8',
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
let moduleId = 0;
const json = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
const unauthorized = () =>
  json({ message: 'Oturum geçersiz veya süresi dolmuş.' }, 401);
const session = (suffix = 'new', role = 'admin') => ({
  user: { id: suffix, role, name: 'Admin' },
  accessToken: `access-${suffix}`,
  refreshToken: `refresh-${suffix}`,
});
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};

const setup = async (
  t,
  { access = 'access-old', refresh = 'refresh-old', navigator = {}, pathname = '/' } = {},
) => {
  const storage = new Map();
  const persistent = new Map();
  if (access) storage.set('inno_access_token', access);
  if (refresh) storage.set('inno_refresh_token', refresh);
  const anchors = [];
  const blobs = [];
  const revoked = [];
  const timers = [];
  const target = new EventTarget();
  target.location = { pathname };
  const globals = {
    sessionStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key),
    },
    localStorage: {
      getItem: key => persistent.get(key) ?? null,
      setItem: (key, value) => persistent.set(key, value),
      removeItem: key => persistent.delete(key),
    },
    window: target,
    navigator,
    document: {
      createElement: tag => {
        assert.equal(tag, 'a');
        const anchor = {
          href: '',
          download: '',
          attached: false,
          clicked: false,
          removed: false,
          click() {
            assert.equal(this.attached, true);
            this.clicked = true;
          },
          remove() {
            this.removed = true;
          },
        };
        anchors.push(anchor);
        return anchor;
      },
      body: {
        appendChild: anchor => {
          anchor.attached = true;
        },
      },
    },
  };
  for (const [key, value] of Object.entries(globals)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, key, original);
      else delete globalThis[key];
    });
  }
  const fetch = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('Unexpected fetch');
  });
  t.mock.method(URL, 'createObjectURL', blob => {
    blobs.push(blob);
    return `blob:file-${blobs.length}`;
  });
  t.mock.method(URL, 'revokeObjectURL', url => revoked.push(url));
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => {
    timers.push({ callback, delay });
    return timers.length;
  });
  const { api, SESSION_EXPIRED_EVENT } = await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString(
      'base64',
    )}#${moduleId++}`
  );
  const expired = [];
  target.addEventListener(SESSION_EXPIRED_EVENT, () =>
    expired.push({ hasSession: api.hasSession(), storage: new Map(storage) }),
  );
  return {
    api,
    SESSION_EXPIRED_EVENT,
    storage,
    persistent,
    fetch,
    anchors,
    blobs,
    revoked,
    timers,
    expired,
  };
};

test('concurrent JSON, download and preview 401s share a single rotating refresh', async t => {
  const h = await setup(t);
  const refreshStarted = deferred();
  const refreshResponse = deferred();
  let refreshCalls = 0;
  const requests = [];
  h.fetch.mock.mockImplementation(async (url, init) => {
    if (url === '/api/auth/refresh') {
      refreshCalls += 1;
      assert.equal(JSON.parse(init.body).refreshToken, 'refresh-old');
      refreshStarted.resolve();
      return refreshResponse.promise;
    }
    requests.push([url, init.headers.get('Authorization')]);
    if (init.headers.get('Authorization') === 'Bearer access-old')
      return unauthorized();
    if (url === '/api/applications') return json([]);
    return new Response('file', {
      headers: {
        'Content-Type': url.endsWith('csv') ? 'text/csv' : 'application/pdf',
      },
    });
  });
  const work = Promise.all([
    h.api.applications(),
    h.api.downloadCsv(),
    h.api.previewDocument('document-id', 'sample.pdf'),
  ]);
  await refreshStarted.promise;
  refreshResponse.resolve(json(session()));
  const [applications, download, preview] = await work;
  assert.deepEqual(applications, []);
  assert.equal(download, undefined);
  assert.match(preview.url, /^blob:/);
  assert.equal(refreshCalls, 1);
  assert.equal(requests.length, 6);
  assert.equal(
    requests.filter(([, token]) => token === 'Bearer access-new').length,
    3,
  );
  assert.equal(h.storage.get('inno_refresh_token'), 'refresh-new');
  assert.equal(h.expired.length, 0);
});

test('late 401 reuses the already refreshed token without rotating again', async t => {
  const h = await setup(t);
  const lateResponse = deferred();
  let refreshCalls = 0;
  h.fetch.mock.mockImplementation(async (url, init) => {
    if (url === '/api/auth/refresh') {
      refreshCalls += 1;
      return json(session());
    }
    if (init.headers.get('Authorization') === 'Bearer access-new')
      return json([]);
    if (url === '/api/admin/candidates') return lateResponse.promise;
    return unauthorized();
  });
  const late = h.api.candidates();
  await h.api.applications();
  lateResponse.resolve(unauthorized());
  assert.deepEqual(await late, []);
  assert.equal(refreshCalls, 1);
});

test('requests started during refresh wait for the shared result', async t => {
  const h = await setup(t);
  const refreshStarted = deferred();
  const refreshResponse = deferred();
  h.fetch.mock.mockImplementation(async (url, init) => {
    if (url === '/api/auth/refresh') {
      refreshStarted.resolve();
      return refreshResponse.promise;
    }
    return init.headers.get('Authorization') === 'Bearer access-old'
      ? unauthorized()
      : json([]);
  });
  const first = h.api.applications();
  await refreshStarted.promise;
  const second = h.api.candidates();
  assert.equal(h.fetch.mock.callCount(), 2);
  refreshResponse.resolve(json(session()));
  await Promise.all([first, second]);
  assert.equal(h.fetch.mock.callCount(), 4);
});

for (const refreshStatus of [400, 401, 403]) {
  test(`refresh rejection ${refreshStatus} clears tokens and emits one event across concurrent requests`, async t => {
    const h = await setup(t);
    h.fetch.mock.mockImplementation(async url =>
      url === '/api/auth/refresh'
        ? json({ message: 'Oturum yenilenemedi.' }, refreshStatus)
        : unauthorized(),
    );
    await Promise.all([
      assert.rejects(h.api.applications(), /Oturumunuzun süresi doldu/),
      assert.rejects(h.api.downloadCsv(), /Oturumunuzun süresi doldu/),
    ]);
    assert.equal(h.SESSION_EXPIRED_EVENT, 'inno:session-expired');
    assert.equal(h.api.hasSession(), false);
    assert.equal(h.storage.size, 0);
    assert.deepEqual(h.expired, [{ hasSession: false, storage: new Map() }]);
    assert.equal(h.anchors.length, 0);
  });
}

for (const operation of ['me', 'downloadCsv', 'previewDocument']) {
  test(`${operation} expires an access-only session on 401`, async t => {
    const h = await setup(t, { refresh: null });
    h.fetch.mock.mockImplementation(async () => unauthorized());
    await assert.rejects(
      h.api[operation]('document-id'),
      /Oturumunuzun süresi doldu/,
    );
    assert.equal(h.api.hasSession(), false);
    assert.equal(h.fetch.mock.callCount(), 1);
    assert.equal(h.expired.length, 1);
  });
}

test('a refresh-only stored session can recover', async t => {
  const h = await setup(t, { access: null });
  h.fetch.mock.mockImplementation(async (url, init) => {
    if (url === '/api/auth/refresh') return json(session());
    return init.headers.has('Authorization')
      ? json(session().user)
      : unauthorized();
  });
  assert.equal(h.api.hasSession(), true);
  assert.deepEqual(await h.api.me(), session().user);
});

test('a second 401 expires the refreshed session without a retry loop', async t => {
  const h = await setup(t);
  h.fetch.mock.mockImplementation(async url =>
    url === '/api/auth/refresh' ? json(session()) : unauthorized(),
  );
  await assert.rejects(
    h.api.downloadZip(['application-id']),
    /Oturumunuzun süresi doldu/,
  );
  assert.equal(h.fetch.mock.callCount(), 3);
  assert.equal(h.storage.size, 0);
  assert.equal(h.expired.length, 1);
});

for (const status of [429, 500, 503]) {
  test(`temporary refresh failure ${status} preserves the session and allows a later retry`, async t => {
    const h = await setup(t);
    let refreshCalls = 0;
    h.fetch.mock.mockImplementation(async (url, init) => {
      if (url === '/api/auth/refresh') {
        refreshCalls += 1;
        return refreshCalls === 1
          ? json({ message: 'Lütfen daha sonra tekrar deneyin.' }, status)
          : json(session());
      }
      return init.headers.get('Authorization') === 'Bearer access-old'
        ? unauthorized()
        : json([]);
    });
    await assert.rejects(
      h.api.applications(),
      /Lütfen daha sonra tekrar deneyin/,
    );
    assert.equal(h.api.hasSession(), true);
    assert.equal(h.storage.get('inno_refresh_token'), 'refresh-old');
    assert.equal(h.expired.length, 0);
    assert.deepEqual(await h.api.applications(), []);
    assert.equal(refreshCalls, 2);
  });
}

test('offline refresh is actionable, preserves tokens and can be retried', async t => {
  const h = await setup(t);
  let online = false;
  h.fetch.mock.mockImplementation(async (url, init) => {
    if (url === '/api/auth/refresh') {
      if (!online) throw new TypeError('Failed to fetch');
      return json(session());
    }
    return init.headers.get('Authorization') === 'Bearer access-old'
      ? unauthorized()
      : json([]);
  });
  await assert.rejects(h.api.applications(), /Bağlantınızı kontrol/);
  assert.equal(h.api.hasSession(), true);
  assert.equal(h.expired.length, 0);
  online = true;
  assert.deepEqual(await h.api.applications(), []);
});

test('clearing a session while refresh is pending prevents resurrection and retries', async t => {
  const h = await setup(t);
  const refreshStarted = deferred();
  const refreshResponse = deferred();
  h.fetch.mock.mockImplementation(async url => {
    if (url === '/api/auth/refresh') {
      refreshStarted.resolve();
      return refreshResponse.promise;
    }
    return unauthorized();
  });
  const work = assert.rejects(h.api.me(), /Oturumunuzun süresi doldu/);
  await refreshStarted.promise;
  h.api.clearSession();
  refreshResponse.resolve(json(session()));
  await work;
  assert.equal(h.storage.size, 0);
  assert.equal(h.api.hasSession(), false);
  assert.equal(h.fetch.mock.callCount(), 2);
  assert.equal(h.expired.length, 0);
});

for (const responseStatus of [200, 401]) {
  test(`old request with status ${responseStatus} cannot affect a newly logged-in session`, async t => {
    const h = await setup(t);
    const oldResponse = deferred();
    h.fetch.mock.mockImplementation(async url =>
      url === '/api/auth/login' ? json(session('other')) : oldResponse.promise,
    );
    const old = assert.rejects(
      h.api.applications(),
      /Oturumunuzun süresi doldu/,
    );
    assert.deepEqual(
      await h.api.login('admin', 'password'),
      session('other').user,
    );
    oldResponse.resolve(responseStatus === 401 ? unauthorized() : json([]));
    await old;
    assert.equal(h.storage.get('inno_access_token'), 'access-other');
    assert.equal(h.expired.length, 0);
  });
}

test('login completion after clearSession cannot restore tokens', async t => {
  const h = await setup(t);
  const loginResponse = deferred();
  h.fetch.mock.mockImplementation(async () => loginResponse.promise);
  const work = assert.rejects(
    h.api.login('admin', 'password'),
    /Oturumunuzun süresi doldu/,
  );
  h.api.clearSession();
  loginResponse.resolve(json(session()));
  await work;
  assert.equal(h.storage.size, 0);
});

test('wrong login credentials are public and never refresh an old session', async t => {
  const h = await setup(t);
  h.fetch.mock.mockImplementation(async (url, init) => {
    assert.equal(url, '/api/auth/login');
    assert.equal(init.headers.has('Authorization'), false);
    assert.deepEqual(JSON.parse(init.body), {
      email: 'admin',
      password: 'wrong',
    });
    return json({ message: 'Kullanıcı adı/e-posta veya şifre yanlış.' }, 401);
  });
  await assert.rejects(h.api.login('admin', 'wrong'), /şifre yanlış/);
  assert.equal(h.fetch.mock.callCount(), 1);
  assert.equal(h.storage.size, 0);
  assert.equal(h.expired.length, 0);
});

test('candidate login never saves its session', async t => {
  const h = await setup(t);
  h.fetch.mock.mockImplementation(async () =>
    json(session('candidate', 'candidate')),
  );
  await assert.rejects(
    h.api.login('candidate', 'password'),
    /yalnızca adminler/,
  );
  assert.equal(h.storage.size, 0);
});

test('member entry accepts candidates and isolates member tokens from admin tokens', async t => {
  const h=await setup(t,{pathname:'/uye/'});
  assert.equal(h.api.hasSession(),false);
  h.fetch.mock.mockImplementationOnce(async()=>json(session('member','candidate')));
  assert.equal((await h.api.login('member','pw')).role,'candidate');
  assert.equal(h.storage.get('inno_member_access_token'),'access-member');
  assert.equal(h.storage.get('inno_access_token'),'access-old');
  h.api.clearSession();
  assert.equal(h.storage.has('inno_member_refresh_token'),false);
  assert.equal(h.storage.get('inno_refresh_token'),'refresh-old');
});
test('remember me keeps member tokens in localStorage only and clears them on logout', async t => {
  const h=await setup(t,{pathname:'/uye',access:null,refresh:null});
  assert.equal(h.api.canRemember(),true);
  h.fetch.mock.mockImplementationOnce(async()=>json(session('member','candidate')));
  await h.api.login('member','pw',true);
  assert.equal(h.persistent.get('inno_member_refresh_token'),'refresh-member');
  assert.equal(h.storage.has('inno_member_refresh_token'),false);
  h.api.clearSession();
  assert.equal(h.persistent.size,0);
  assert.equal(h.storage.size,0);
});
test('member login without remember me uses sessionStorage only', async t => {
  const h=await setup(t,{pathname:'/uye',access:null,refresh:null});
  h.fetch.mock.mockImplementationOnce(async()=>json(session('member','candidate')));
  await h.api.login('member','pw',false);
  assert.equal(h.storage.get('inno_member_refresh_token'),'refresh-member');
  assert.equal(h.persistent.size,0);
});
test('admin sessions are never persisted even if remember is requested', async t => {
  const h=await setup(t,{access:null,refresh:null});
  assert.equal(h.api.canRemember(),false);
  h.fetch.mock.mockImplementationOnce(async()=>json(session('admin','admin')));
  await h.api.login('admin','pw',true);
  assert.equal(h.storage.get('inno_refresh_token'),'refresh-admin');
  assert.equal(h.persistent.size,0);
});
test('member entry rejects a management account', async t => {
  const h=await setup(t,{pathname:'/uye'});
  h.fetch.mock.mockImplementationOnce(async()=>json(session('manager','super_admin')));
  await assert.rejects(h.api.login('manager','pw'),/aday hesabıyla/);
  assert.equal(h.api.hasSession(),false);
});
test('candidate saves use the current application revision and health consent has its own endpoint',async t=>{
  const h=await setup(t);
  const calls=[];
  h.fetch.mock.mockImplementation(async(url,init)=>{calls.push([url,init.method,init.body&&JSON.parse(init.body)]);return json({});});
  await h.api.saveDraft('a',{motivationLetter:{subject:'Test'}},4);
  await h.api.submitApplication('a',5);
  await h.api.saveBloodGroup('a','A+','esc-blood-group-v1');
  await h.api.revokeBloodGroup('a');
  assert.deepEqual(calls,[
    ['/api/applications/a/personal-info','PATCH',{motivationLetter:{subject:'Test'},revision:4}],
    ['/api/applications/a/submit','POST',{revision:5}],
    ['/api/applications/a/blood-group','PUT',{bloodGroup:'A+',consentVersion:'esc-blood-group-v1',consentAccepted:true}],
    ['/api/applications/a/blood-group','DELETE',undefined],
  ]);
});

test('forgotPassword uses the existing public endpoint and returns its privacy-preserving message', async t => {
  const h = await setup(t);
  const result = {
    message: 'Hesap bulunuyorsa şifre sıfırlama talimatları gönderilecektir.',
  };
  h.fetch.mock.mockImplementation(async (url, init) => {
    assert.equal(url, '/api/auth/forgot-password');
    assert.equal(init.method, 'POST');
    assert.equal(init.headers.get('Content-Type'), 'application/json');
    assert.equal(init.headers.has('Authorization'), false);
    assert.deepEqual(JSON.parse(init.body), { email: 'admin@example.com' });
    return json(result);
  });
  assert.deepEqual(await h.api.forgotPassword('admin@example.com'), result);
  assert.equal(h.storage.get('inno_access_token'), 'access-old');
});

for (const afterRefresh of [false, true]) {
  test(`wrong current password does not expire the session (refresh first: ${afterRefresh})`, async t => {
    const h = await setup(t);
    let passwordRequests = 0;
    h.fetch.mock.mockImplementation(async (url, init) => {
      if (url === '/api/auth/refresh') return json(session());
      assert.equal(url, '/api/auth/change-password');
      assert.deepEqual(JSON.parse(init.body), {
        currentPassword: 'wrong',
        newPassword: 'NewPassword123',
      });
      passwordRequests += 1;
      if (afterRefresh && passwordRequests === 1) return unauthorized();
      return json({ message: 'Mevcut şifre yanlış.' }, 401);
    });
    await assert.rejects(
      h.api.changePassword('wrong', 'NewPassword123'),
      /^Error: Mevcut şifre yanlış\.$/,
    );
    assert.equal(h.api.hasSession(), true);
    assert.equal(h.expired.length, 0);
    assert.equal(h.fetch.mock.callCount(), afterRefresh ? 3 : 1);
  });
}

test('successful password change returns the result and clears the revoked session', async t => {
  const h = await setup(t);
  const result = { user: session().user, requiresLogin: true };
  h.fetch.mock.mockImplementation(async () => json(result));
  assert.deepEqual(await h.api.changePassword('old', 'NewPassword123'), result);
  assert.equal(h.storage.size, 0);
  assert.equal(h.expired.length, 0);
});

for (const failure of ['offline', 'server']) {
  test(`logout clears stored credentials even on ${failure} failure`, async t => {
    const h = await setup(t);
    h.fetch.mock.mockImplementation(async () => {
      if (failure === 'offline') throw new TypeError('Failed to fetch');
      return json({ message: 'Sunucu hatası.' }, 503);
    });
    await assert.rejects(
      h.api.logout(),
      failure === 'offline' ? /Bağlantınızı kontrol/ : /Sunucu hatası/,
    );
    assert.equal(h.storage.size, 0);
    assert.equal(h.api.hasSession(), false);
    assert.equal(h.expired.length, 0);
  });
}

test('logout retries with the rotated refresh token so the active server session is revoked', async t => {
  const h = await setup(t);
  const logoutBodies = [];
  h.fetch.mock.mockImplementation(async (url, init) => {
    if (url === '/api/auth/refresh') return json(session());
    assert.equal(url, '/api/auth/logout');
    logoutBodies.push(JSON.parse(init.body));
    return logoutBodies.length === 1
      ? unauthorized()
      : new Response(null, { status: 204 });
  });
  await h.api.logout();
  assert.deepEqual(logoutBodies, [
    { refreshToken: 'refresh-old' },
    { refreshToken: 'refresh-new' },
  ]);
  assert.equal(h.storage.size, 0);
});

test('a late logout cannot clear a new login', async t => {
  const h = await setup(t);
  const logoutResponse = deferred();
  h.fetch.mock.mockImplementation(async url =>
    url === '/api/auth/login' ? json(session('other')) : logoutResponse.promise,
  );
  const old = assert.rejects(h.api.logout(), /Oturumunuzun süresi doldu/);
  await h.api.login('admin', 'password');
  logoutResponse.resolve(new Response(null, { status: 204 }));
  await old;
  assert.equal(h.storage.get('inno_access_token'), 'access-other');
});

test('logout without a session is a no-op', async t => {
  const h = await setup(t, { access: null, refresh: null });
  await h.api.logout();
  assert.equal(h.fetch.mock.callCount(), 0);
  assert.equal(h.expired.length, 0);
});

for (const operation of ['applications', 'downloadCsv', 'previewDocument']) {
  test(`${operation} exposes readable network errors without expiring the session`, async t => {
    const h = await setup(t);
    h.fetch.mock.mockImplementation(async () => {
      throw new TypeError('Failed to fetch');
    });
    await assert.rejects(
      h.api[operation]('document-id'),
      /Bağlantınızı kontrol/,
    );
    assert.equal(h.api.hasSession(), true);
    assert.equal(h.expired.length, 0);
  });
}

test('abort errors retain their identity', async t => {
  const h = await setup(t);
  const aborted = new DOMException('Cancelled', 'AbortError');
  h.fetch.mock.mockImplementation(async () => {
    throw aborted;
  });
  await assert.rejects(h.api.me(), error => error === aborted);
  assert.equal(h.api.hasSession(), true);
});

test('JSON and file HTTP errors retain server messages, including authorization failures', async t => {
  const h = await setup(t);
  h.fetch.mock.mockImplementation(async url =>
    url.includes('/documents/')
      ? json({ message: 'Belge bulunamadı.' }, 404)
      : json({ message: 'Bu işlem için yetkiniz bulunmuyor.' }, 403),
  );
  await assert.rejects(h.api.applications(), /yetkiniz bulunmuyor/);
  await assert.rejects(
    h.api.downloadDocument('missing', 'file.pdf'),
    /Belge bulunamadı/,
  );
  assert.equal(h.api.hasSession(), true);
  assert.equal(h.expired.length, 0);
  assert.equal(h.blobs.length, 0);
});

test('non-JSON and malformed error payloads have useful fallback messages', async t => {
  const h = await setup(t);
  h.fetch.mock.mockImplementation(
    async () => new Response('<html>Bad gateway</html>', { status: 502 }),
  );
  await assert.rejects(h.api.applications(), /İşlem tamamlanamadı/);
  await assert.rejects(h.api.downloadCsv(), /Dosya indirilemedi/);
  for (const payload of [null, { message: {} }, { message: '  ' }]) {
    h.fetch.mock.mockImplementation(async () => json(payload, 400));
    await assert.rejects(h.api.applications(), /İşlem tamamlanamadı/);
  }
});

test('malformed success and refresh responses do not surface parser errors or store invalid tokens', async t => {
  const h = await setup(t);
  h.fetch.mock.mockImplementation(
    async () => new Response('<html>Not JSON</html>'),
  );
  await assert.rejects(h.api.me(), /geçersiz bir yanıt/);
  for (const payload of [
    null,
    { accessToken: 'partial' },
    { accessToken: 1, refreshToken: 2 },
  ]) {
    h.fetch.mock.mockImplementation(async url =>
      url === '/api/auth/refresh' ? json(payload) : unauthorized(),
    );
    await assert.rejects(h.api.me(), /geçersiz bir yanıt/);
    assert.equal(h.storage.get('inno_access_token'), 'access-old');
    assert.equal(h.storage.get('inno_refresh_token'), 'refresh-old');
  }
});

test('body-stream network errors are readable for both JSON and file responses', async t => {
  const h = await setup(t);
  h.fetch.mock.mockImplementation(
    async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.error(new TypeError('terminated'));
          },
        }),
      ),
  );
  await assert.rejects(h.api.me(), /Bağlantınızı kontrol/);
  await assert.rejects(h.api.downloadCsv(), /Bağlantınızı kontrol/);
  assert.equal(h.blobs.length, 0);
});

for (const [disposition, expected] of [
  [
    "attachment; filename*=UTF-8''%C3%96%C4%9Frenci%20belgesi.pdf",
    'Öğrenci belgesi.pdf',
  ],
  ['attachment; filename="report; final.pdf"', 'report; final.pdf'],
  ['attachment; filename=report.pdf', 'report.pdf'],
  ["attachment; filename*=UTF-8''%invalid; filename=report.pdf", 'report.pdf'],
  ['', 'fallback.pdf'],
]) {
  test(`download handles filename ${JSON.stringify(
    disposition,
  )} and cleans up DOM and URL`, async t => {
    const h = await setup(t);
    h.fetch.mock.mockImplementation(
      async () =>
        new Response('file', {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': disposition,
          },
        }),
    );
    await h.api.downloadDocument('document-id', 'fallback.pdf');
    assert.equal(h.anchors[0].download, expected);
    assert.equal(h.anchors[0].clicked, true);
    assert.equal(h.anchors[0].removed, true);
    assert.equal(h.timers.length, 1);
    assert.equal(h.timers[0].delay, 5000);
    h.timers[0].callback();
    assert.deepEqual(h.revoked, ['blob:file-1']);
  });
}

for (const type of ['application/pdf', 'image/jpeg', 'image/png']) {
  test(`preview returns a caller-owned object URL for ${type}`, async t => {
    const h = await setup(t);
    h.fetch.mock.mockImplementation(async (url, init) => {
      assert.equal(url, '/api/documents/document-id/download');
      assert.equal(init.headers.get('Authorization'), 'Bearer access-old');
      return new Response('file', { headers: { 'Content-Type': type } });
    });
    const { url, canShare } = await h.api.previewDocument('document-id', 'test.pdf');
    assert.equal(url, 'blob:file-1');
    assert.equal(canShare, false);
    assert.equal(h.blobs[0].type, type);
    assert.equal(await h.blobs[0].text(), 'file');
    assert.equal(h.anchors.length, 0);
    assert.equal(h.timers.length, 0);
    assert.equal(h.revoked.length, 0);
    URL.revokeObjectURL(url);
    assert.deepEqual(h.revoked, [url]);
  });
}

test('preview shares the real file, not a URL, and refuses sharing after logout', async t => {
  const received = [];
  const h = await setup(t, {
    navigator: {
      canShare: ({ files }) => files[0].type === 'application/pdf',
      share: async data => { received.push(data); },
    },
  });
  h.fetch.mock.mockImplementation(async () => new Response('sample PDF', {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="original.pdf"',
    },
  }));
  const preview = await h.api.previewDocument('document-id', 'fallback.pdf');
  assert.equal(preview.canShare, true);
  await preview.share();
  assert.deepEqual(Object.keys(received[0]), ['files']);
  assert.equal(received[0].files[0].name, 'original.pdf');
  assert.equal(await received[0].files[0].text(), 'sample PDF');
  h.api.clearSession();
  assert.throws(() => preview.share(), /Oturumunuzun süresi doldu/);
  assert.equal(received.length, 1);
});

test('preview rejects unsupported or active document types without creating a URL', async t => {
  const h = await setup(t);
  for (const type of [
    'text/html',
    'image/svg+xml',
    'application/octet-stream',
  ]) {
    h.fetch.mock.mockImplementation(
      async () => new Response('file', { headers: { 'Content-Type': type } }),
    );
    await assert.rejects(
      h.api.previewDocument('document-id', 'test.pdf'),
      /Belgeyi indirerek açabilirsiniz/,
    );
  }
  assert.equal(h.blobs.length, 0);
});

test('a file body arriving after logout cannot create a preview URL', async t => {
  const h = await setup(t);
  const bodyStarted = deferred();
  const body = deferred();
  h.fetch.mock.mockImplementation(async () => {
    const response = new Response('file', {
      headers: { 'Content-Type': 'application/pdf' },
    });
    response.blob = () => {
      bodyStarted.resolve();
      return body.promise;
    };
    return response;
  });
  const work = assert.rejects(
    h.api.previewDocument('document-id', 'test.pdf'),
    /Oturumunuzun süresi doldu/,
  );
  await bodyStarted.promise;
  h.api.clearSession();
  body.resolve(new Blob(['file'], { type: 'application/pdf' }));
  await work;
  assert.equal(h.blobs.length, 0);
});

test('admin upload sends the chosen file and keeps its retry key through a session refresh', async t => {
  const h = await setup(t);
  const attempts = [];
  h.fetch.mock.mockImplementation(async (url, init) => {
    if (url === '/api/auth/refresh') return json(session());
    assert.equal(url, '/api/applications/app-1/documents/extra');
    assert.equal(init.method, 'POST');
    assert.equal(init.headers.get('Idempotency-Key'), 'upload-key-admin-1');
    assert.equal(init.headers.has('Content-Type'), false);
    const file = init.body.get('file');
    assert.equal(file.name, 'reference.pdf');
    assert.equal(file.type, 'application/pdf');
    assert.equal(await file.text(), 'sample file');
    attempts.push(init.headers.get('Authorization'));
    return attempts.length === 1 ? unauthorized() : json({ id: 'document-1' }, 201);
  });
  const file = new File(['sample file'], 'reference.pdf', { type: 'application/pdf' });
  const result = await h.api.uploadApplicationDocument('app-1', 'extra', file, 'upload-key-admin-1', new AbortController().signal);
  assert.equal(result.id, 'document-1');
  assert.deepEqual(attempts, ['Bearer access-old', 'Bearer access-new']);
});

test('existing search, CSV and ZIP endpoint semantics stay unchanged', async t => {
  const h = await setup(t);
  const paths = [];
  h.fetch.mock.mockImplementation(async url => {
    paths.push(url);
    return url.includes('/exports/') ? new Response('file') : json([]);
  });
  await h.api.applications('İsim & e-posta');
  await h.api.downloadCsv();
  await h.api.downloadZip(['one', 'two']);
  assert.deepEqual(paths, [
    `/api/applications?q=${encodeURIComponent('İsim & e-posta')}`,
    '/api/admin/exports/applications.csv',
    '/api/admin/exports/documents.zip?applicationIds=one%2Ctwo',
  ]);
  assert.deepEqual(
    h.anchors.map(anchor => anchor.download),
    ['basvurular.csv', 'basvuru-belgeleri.zip'],
  );
});

test('new workflow endpoints preserve pagination, revisions and encoded thread IDs', async t => {
  const h = await setup(t),
    calls = [];
  h.fetch.mock.mockImplementation(async (url, init) => {
    calls.push({
      url,
      method: init.method || 'GET',
      body: init.body && JSON.parse(init.body),
    });
    return json({ items: [], total: 0, page: 2, pageSize: 25 });
  });
  await h.api.applicationPage(
    new URLSearchParams({ page: '2', pageSize: '25', hasIssues: 'true' }),
  );
  await h.api.messages('general:candidate', 2);
  await h.api.messageSummaryPage(2);
  await h.api.saveProgram({ name: 'Updated', revision: 7 }, 'program');
  await h.api.setStage('application', 'erasmus_stage', 4);
  assert.equal(
    calls[0].url,
    '/api/applications?page=2&pageSize=25&hasIssues=true',
  );
  assert.equal(
    calls[1].url,
    '/api/messages/general%3Acandidate?page=2&pageSize=25',
  );
  assert.equal(calls[2].url, '/api/messages/summary?page=2&pageSize=25');
  assert.deepEqual(calls[3], {
    url: '/api/programs/program',
    method: 'PATCH',
    body: { name: 'Updated', revision: 7 },
  });
  assert.equal(calls[4].body.revision, 4);
});

test('revision conflicts retain their status and cannot be mistaken for a successful save', async t => {
  const h = await setup(t);
  h.fetch.mock.mockImplementation(async () =>
    json({ message: 'Kayıt değişti.', code: 'REVISION_CONFLICT' }, 409),
  );
  await assert.rejects(
    h.api.saveProgram({ name: 'Draft', revision: 1 }, 'program'),
    error => error.status === 409 && error.message === 'Kayıt değişti.',
  );
  assert.equal(h.expired.length, 0);
  assert.equal(h.storage.get('inno_refresh_token'), 'refresh-old');
});
