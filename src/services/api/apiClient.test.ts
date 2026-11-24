import { ApiClient, requireData } from './apiClient';

const response = (status: number, data: unknown = {}): Response =>
  ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => data,
    clone: () => response(status, data),
  } as Response);
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
};
const tokens = {
  accessToken: 'old',
  refreshToken: 'refresh-token',
  rememberMe: true,
};
afterEach(() => jest.restoreAllMocks());

test('simultaneous 401 responses share one refresh and retry with the new token', async () => {
  const client = new ApiClient('https://api.example.org/api');
  await client.setSession(tokens);
  const refresh = deferred<Response>();
  const fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (url, init) => {
      if (String(url).endsWith('/auth/refresh')) return refresh.promise;
      return response(
        (init?.headers as Record<string, string>).Authorization === 'Bearer old'
          ? 401
          : 200,
        { saved: true },
      );
    });
  const first = client.get('/one'),
    second = client.get('/two');
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  expect(
    fetchMock.mock.calls.filter(([url]) =>
      String(url).endsWith('/auth/refresh'),
    ),
  ).toHaveLength(1);
  refresh.resolve(
    response(200, { accessToken: 'new', refreshToken: 'new-refresh' }),
  );
  expect(requireData(await first)).toEqual({ saved: true });
  expect(requireData(await second)).toEqual({ saved: true });
});
test('a late response cannot restore data after logout or a different login', async () => {
  const client = new ApiClient('https://api.example.org/api');
  await client.setSession(tokens);
  const pending = deferred<Response>();
  jest.spyOn(globalThis, 'fetch').mockReturnValue(pending.promise);
  const request = client.get('/profile');
  await client.clearSession();
  await client.setSession({ ...tokens, accessToken: 'other-account' });
  pending.resolve(response(200, { name: 'old account' }));
  expect((await request).code).toBe('SESSION_CHANGED');
  expect(client.getAuthToken()).toBe('other-account');
});
test('a failed refresh preserves the session for an explicit retry', async () => {
  const client = new ApiClient('https://api.example.org/api');
  await client.setSession(tokens);
  jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async url =>
      response(String(url).endsWith('/auth/refresh') ? 500 : 401),
    );
  expect((await client.get('/applications')).status).toBe(500);
  expect(client.hasSession()).toBe(true);
});
test('remember me controls secure persistence, never profile data', async () => {
  const client = new ApiClient('https://api.example.org/api'),
    persist = jest.fn(async () => undefined);
  client.setPersistence(persist);
  await client.setSession({ ...tokens, rememberMe: false });
  expect(persist).toHaveBeenLastCalledWith(null);
  await client.setSession(tokens);
  expect(persist).toHaveBeenLastCalledWith(tokens);
  await client.clearSession();
  expect(persist).toHaveBeenLastCalledWith(null);
});
test('untrusted download URLs never receive credentials', async () => {
  const client = new ApiClient('https://api.example.org/api'),
    send = jest.fn();
  await client.setSession(tokens);
  await expect(
    client.authorized('https://api.example.org.attacker.com/file', send),
  ).rejects.toThrow('güvenilir');
  expect(send).not.toHaveBeenCalled();
});
