const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://api.innoder.org/api';
const EXPIRED = 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.';
const NETWORK =
  'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.';

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
}
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
  code?: string;
  issues?: unknown;
}
export interface RequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
  onProgress?: (percent: number) => void;
}
type HttpResult = { status: number; credentialError?: boolean };
type RequestConfig = RequestOptions & {
  method?: string;
  body?: unknown;
  formData?: FormData;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
    public code?: string,
    public issues?: unknown,
  ) {
    super(message);
  }
}
export const requireData = <T>(response: ApiResponse<T>): T => {
  if (response.error || response.data === undefined)
    throw new ApiError(
      response.error || 'Sunucudan geçersiz yanıt alındı.',
      response.status,
      response.code,
      response.issues,
    );
  return response.data;
};
const validTokens = (value: unknown): value is SessionTokens =>
  Boolean(
    value &&
      typeof value === 'object' &&
      'accessToken' in value &&
      typeof value.accessToken === 'string' &&
      value.accessToken &&
      'refreshToken' in value &&
      typeof value.refreshToken === 'string' &&
      value.refreshToken,
  );

export class ApiClient {
  private revisionProvider?: (path: string) => number | undefined;
  setRevisionProvider(provider: (path: string) => number | undefined) {
    this.revisionProvider = provider;
  }
  private tokens: SessionTokens | null = null;
  private version = 0;
  private refreshing?: { version: number; promise: Promise<void> };
  private persist?: (session: SessionTokens | null) => Promise<void>;
  private persistence = Promise.resolve();
  private expiredListeners = new Set<() => void>();
  constructor(private baseUrl: string) {}
  getAuthToken() {
    return this.tokens?.accessToken || null;
  }
  getRefreshToken() {
    return this.tokens?.refreshToken || null;
  }
  getVersion() {
    return this.version;
  }
  hasSession() {
    return Boolean(this.tokens);
  }
  assertSession(version: number) {
    if (version !== this.version)
      throw new ApiError(EXPIRED, 401, 'SESSION_CHANGED');
  }
  setPersistence(persist: (session: SessionTokens | null) => Promise<void>) {
    this.persist = persist;
  }
  onExpired(listener: () => void) {
    this.expiredListeners.add(listener);
    return () => {
      this.expiredListeners.delete(listener);
    };
  }
  private save() {
    const version = this.version;
    const session = this.tokens?.rememberMe ? { ...this.tokens } : null;
    this.persistence = this.persistence
      .catch(() => undefined)
      .then(async () => {
        if (version === this.version) await this.persist?.(session);
      });
    return this.persistence;
  }
  async setSession(session: SessionTokens) {
    this.version += 1;
    this.refreshing = undefined;
    this.tokens = session;
    await this.save();
  }
  async clearSession() {
    this.version += 1;
    this.refreshing = undefined;
    this.tokens = null;
    await this.save();
  }
  private async expire(version: number): Promise<never> {
    this.assertSession(version);
    await this.clearSession();
    if (this.version === version + 1)
      this.expiredListeners.forEach(listener => listener());
    throw new ApiError(EXPIRED, 401, 'SESSION_EXPIRED');
  }
  resolveUrl(path: string) {
    const base = this.baseUrl.replace(/\/api\/?$/, '');
    if (/^https?:\/\//i.test(path)) {
      if (path !== base && !path.startsWith(`${base}/`))
        throw new ApiError(
          'Dosya adresi güvenilir API adresine ait değil.',
          400,
        );
      return path;
    }
    return path.startsWith('/api/')
      ? `${base}${path}`
      : `${this.baseUrl}${path}`;
  }
  private async fetchResponse(
    path: string,
    config: RequestConfig,
    token?: string,
  ): Promise<Response> {
    if (config.formData && config.onProgress)
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const abort = () => xhr.abort();
        const cleanup = () =>
          config.signal?.removeEventListener('abort', abort);
        xhr.open(config.method || 'POST', this.resolveUrl(path));
        xhr.timeout = 180000;
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        Object.entries(config.headers || {}).forEach(([name, value]) =>
          xhr.setRequestHeader(name, value),
        );
        xhr.upload.onprogress = event => {
          if (event.lengthComputable)
            config.onProgress?.(
              Math.min(100, Math.round((event.loaded / event.total) * 100)),
            );
        };
        xhr.onload = () => {
          cleanup();
          resolve(new Response(xhr.responseText, { status: xhr.status }));
        };
        xhr.onerror = () => {
          cleanup();
          reject(new ApiError(NETWORK));
        };
        xhr.ontimeout = () => {
          cleanup();
          reject(new ApiError('Yükleme zaman aşımına uğradı. Tekrar deneyin.'));
        };
        xhr.onabort = () => {
          cleanup();
          reject(new ApiError('İşlem iptal edildi.', 0, 'ABORTED'));
        };
        config.signal?.addEventListener('abort', abort, { once: true });
        if (config.signal?.aborted) {
          cleanup();
          reject(new ApiError('İşlem iptal edildi.', 0, 'ABORTED'));
          return;
        }
        xhr.send(config.formData);
      });
    const controller = new AbortController();
    const abort = () => controller.abort();
    config.signal?.addEventListener('abort', abort, { once: true });
    if (config.signal?.aborted) controller.abort();
    const timeout = setTimeout(abort, config.formData ? 180000 : 30000);
    const headers: Record<string, string> = { ...config.headers };
    if (!config.formData) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      return await fetch(this.resolveUrl(path), {
        method: config.method || 'GET',
        headers,
        body:
          config.formData ||
          (config.body !== undefined ? JSON.stringify(config.body) : undefined),
        signal: controller.signal,
      });
    } catch {
      if (controller.signal.aborted)
        throw new ApiError(
          config.signal?.aborted
            ? 'İşlem iptal edildi.'
            : 'İstek zaman aşımına uğradı. Tekrar deneyin.',
          0,
          'ABORTED',
        );
      throw new ApiError(NETWORK);
    } finally {
      clearTimeout(timeout);
      config.signal?.removeEventListener('abort', abort);
    }
  }
  private async refresh(version: number) {
    this.assertSession(version);
    if (this.refreshing?.version === version) return this.refreshing.promise;
    if (!this.tokens?.refreshToken) return this.expire(version);
    const refreshToken = this.tokens.refreshToken;
    const promise = (async () => {
      const response = await this.fetchResponse('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
      });
      this.assertSession(version);
      if ([400, 401, 403].includes(response.status))
        return this.expire(version);
      if (!response.ok)
        throw new ApiError(
          'Oturum yenilenemedi. Lütfen tekrar deneyin.',
          response.status,
        );
      const data = await response.json();
      this.assertSession(version);
      if (!validTokens(data))
        throw new ApiError('Sunucudan geçersiz oturum yanıtı alındı.');
      this.tokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        rememberMe: Boolean(this.tokens?.rememberMe),
      };
      await this.save();
      this.assertSession(version);
    })().finally(() => {
      if (this.refreshing?.promise === promise) this.refreshing = undefined;
    });
    this.refreshing = { version, promise };
    return promise;
  }
  async authorized<T extends HttpResult>(
    path: string,
    send: (url: string, headers: Record<string, string>) => Promise<T>,
  ): Promise<T> {
    const version = this.version;
    if (this.refreshing?.version === version) await this.refreshing.promise;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      this.assertSession(version);
      const token = this.getAuthToken();
      const response = await send(
        this.resolveUrl(path),
        token ? { Authorization: `Bearer ${token}` } : {},
      );
      this.assertSession(version);
      if (response.status !== 401 || response.credentialError) return response;
      if (attempt) return this.expire(version);
      if (token === this.getAuthToken()) await this.refresh(version);
    }
    throw new ApiError(EXPIRED, 401);
  }
  private async request<T>(
    path: string,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    if (config.method === 'PATCH' || path.endsWith('/submit')) {
      const revision = this.revisionProvider?.(path);
      if (revision !== undefined)
        config = {
          ...config,
          headers: { 'If-Match': String(revision), ...config.headers },
        };
    }
    const publicRequest =
      /^\/auth\/(login|register|refresh|forgot-password|reset-password|confirm-email-change)$/.test(
        path,
      );
    const version = this.version;
    try {
      const send = async (_url: string, headers: Record<string, string>) => {
        const response = await this.fetchResponse(
          path,
          config,
          headers.Authorization?.replace(/^Bearer /, ''),
        );
        const credentialError =
          path === '/auth/change-password' &&
          response.status === 401 &&
          (
            await response
              .clone()
              .json()
              .catch(() => null)
          )?.message === 'Mevcut şifre yanlış.';
        return { status: response.status, response, credentialError };
      };
      const { response } = publicRequest
        ? await send(this.resolveUrl(path), {})
        : await this.authorized(path, send);
      const data =
        response.status === 204
          ? undefined
          : await response.json().catch(() => null);
      if (!publicRequest) this.assertSession(version);
      if (!response.ok)
        return {
          status: response.status,
          error: data?.message || 'İşlem tamamlanamadı.',
          code: data?.code,
          issues: data?.issues || data?.missingDocumentTypes,
        };
      if (response.status !== 204 && data === null)
        throw new ApiError('Sunucudan geçersiz yanıt alındı.', response.status);
      return { data, status: response.status };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : NETWORK,
        status: error instanceof ApiError ? error.status : 0,
        code: error instanceof ApiError ? error.code : undefined,
      };
    }
  }
  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>(path, options);
  }
  post<T>(path: string, body: unknown, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }
  put<T>(path: string, body: unknown, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }
  patch<T>(path: string, body: unknown, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }
  delete<T>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
  postForm<T>(path: string, formData: FormData, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'POST', formData });
  }
}
export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
