import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

const load = async path => {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  let { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  if(outputText.includes("from './locale'")){
    const locale=ts.transpileModule(await readFile(new URL('../src/locale.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
    outputText=outputText.replace("from './locale'","from 'data:text/javascript;base64,"+Buffer.from(locale).toString('base64')+"'");
  }
  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
  );
};
const domain = await load('../src/domain.ts');
const { lockBodyScroll } = await load('../src/scrollLock.ts');

test('calendar filters include the full local day in the admin timezone', t => {
  const previous = process.env.TZ;
  t.after(() => {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  });
  process.env.TZ = 'Europe/Istanbul';
  assert.equal(
    domain.dateBoundaryISO('2026-10-19'),
    '2026-10-18T21:00:00.000Z',
  );
  assert.equal(
    domain.dateBoundaryISO('2026-10-19', true),
    '2026-10-19T20:59:59.999Z',
  );
});

test('untrusted personal-info values cannot crash filtering or render object children', () => {
  const item = domain.normalizeApplication({
    id: 'test',
    personalInfo: {
      fullName: {},
      nationality: ['TR'],
      bloodGroup: 42,
      birthDate: '2000-01-01',
    },
  });
  assert.deepEqual(item.personalInfo, { birthDate: '2000-01-01' });
  assert.equal(domain.applicantName(item), 'İsimsiz aday');
  assert.equal(domain.matches('', {}, [], null, undefined), false);
});
test('null personal info is displayed as an unnamed candidate', () => {
  assert.equal(
    domain.applicantName(domain.normalizeApplication({ personalInfo: null })),
    'İsimsiz aday',
  );
});
test('Turkish search matches dotted and dotless case correctly', () => {
  assert.equal(domain.matches('İPEK', 'İpek Yılmaz'), true);
  assert.equal(domain.matches('yılmaz', 'YILMAZ'), true);
  assert.equal(
    domain.matches('  TEST@EXAMPLE.TEST ', 'test@example.test'),
    true,
  );
});
test('invalid dates do not throw during table rendering', () => {
  assert.equal(domain.formatDate('invalid'), '—');
  assert.equal(domain.formatDate(undefined), '—');
});
test('password rules match the server policy', () => {
  assert.equal(domain.validPassword('abcdefghijkl'), false);
  assert.equal(domain.validPassword('ABCDEF123456'), false);
  assert.equal(domain.validPassword('Ab123'), false);
  assert.equal(domain.validPassword('ValidTest12345'), true);
});
for (const order of [
  [0, 1],
  [1, 0],
]) {
  test(`nested modal scroll locks release safely in order ${order}`, () => {
    globalThis.document = { body: { style: { overflow: 'auto' } } };
    const unlocks = [lockBodyScroll(), lockBodyScroll()];
    assert.equal(document.body.style.overflow, 'hidden');
    unlocks[order[0]]();
    assert.equal(document.body.style.overflow, 'hidden');
    unlocks[order[1]]();
    assert.equal(document.body.style.overflow, 'auto');
    unlocks[0]();
    assert.equal(document.body.style.overflow, 'auto');
    delete globalThis.document;
  });
}

test('event links render as anchors only for http(s) URLs', () => {
  assert.equal(
    domain.safeHttpUrl('https://example.org/event?id=1'),
    'https://example.org/event?id=1',
  );
  assert.equal(domain.safeHttpUrl('http://example.org'), 'http://example.org/');
  for (const value of [
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    'data:text/html,<b>x</b>',
    'not a url',
    '',
    undefined,
  ])
    assert.equal(domain.safeHttpUrl(value), undefined);
});

test('contact links point to the association email and Instagram', () => {
  assert.deepEqual(
    domain.CONTACT_LINKS.map(([, url]) => url),
    ['mailto:innodernegi@gmail.com', 'https://www.instagram.com/innodernegi/'],
  );
});
