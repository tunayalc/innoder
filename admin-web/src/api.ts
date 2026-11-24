import type {
  Application,
  AuditLog,
  User,
  Page,
  Program,
  Message,
  ThreadSummary,
  DeletionRequest,
  Document,
} from './types';

const API_URL = import.meta.env?.VITE_API_URL || '';
export const SESSION_EXPIRED_EVENT = 'inno:session-expired';
export class RequestError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

const SESSION_EXPIRED_MESSAGE =
  'Oturumunuzun süresi doldu. Lütfen yeniden giriş yapın.';
const NETWORK_ERROR_MESSAGE =
  'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.';
const INVALID_RESPONSE_MESSAGE =
  'Sunucudan geçersiz bir yanıt alındı. Lütfen tekrar deneyin.';
export const memberPortal = /^\/uye\/?$/.test(window.location?.pathname ?? '/');
const tokenKey = (name: string) =>
  `inno_${memberPortal ? 'member_' : ''}${name}_token`;
/**
 * "Remember me" is offered only in the member portal. Admin sessions stay in
 * sessionStorage so they end when the browser tab closes.
 */
const persistentStore = (): Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
> | null => {
  if (!memberPortal) return null;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};
const readToken = (name: string) => {
  const key = tokenKey(name);
  const fromSession = sessionStorage.getItem(key);
  if (fromSession) return fromSession;
  try {
    return persistentStore()?.getItem(key) ?? null;
  } catch {
    return null;
  }
};
let rememberSession = Boolean(
  !sessionStorage.getItem(tokenKey('refresh')) && readToken('refresh'),
);
let accessToken = readToken('access');
let refreshToken = readToken('refresh');
let sessionVersion = 0;
let pendingRefresh: { version: number; promise: Promise<void> } | undefined;

const writeToken = (name: string, value: string | null) => {
  const key = tokenKey(name);
  const persistent = persistentStore();
  const target = rememberSession && persistent ? persistent : sessionStorage;
  try {
    if (value) target.setItem(key, value);
    else target.removeItem(key);
    // Never leave a copy in the storage that is not in use.
    if (target !== sessionStorage) sessionStorage.removeItem(key);
    else persistent?.removeItem(key);
  } catch {
    // Storage may be unavailable (private mode); the in-memory token still works.
  }
};
const saveTokens = (access: string | null, refresh: string | null) => {
  accessToken = access;
  refreshToken = refresh;
  writeToken('access', access);
  writeToken('refresh', refresh);
};

const clearSession = () => {
  sessionVersion += 1;
  pendingRefresh = undefined;
  saveTokens(null, null);
};

const assertSession = (version: number) => {
  if (version !== sessionVersion) throw new Error(SESSION_EXPIRED_MESSAGE);
};

const expireSession = (version: number): never => {
  assertSession(version);
  const hadSession = Boolean(accessToken || refreshToken);
  clearSession();
  if (hadSession) window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  throw new Error(SESSION_EXPIRED_MESSAGE);
};

const fetchSafely = async (
  path: string,
  init: RequestInit,
  onProgress?: (percent: number) => void,
): Promise<Response> => {
  try {
    if (onProgress && init.body instanceof FormData) {
      const body = init.body;
      return await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest(),
          abort = () => xhr.abort();
        const canceled = () =>
          reject(new DOMException('Upload cancelled', 'AbortError'));
        if (init.signal?.aborted) {
          canceled();
          return;
        }
        xhr.open(init.method || 'POST', API_URL + path);
        xhr.timeout = 180000;
        new Headers(init.headers).forEach((value, key) =>
          xhr.setRequestHeader(key, value),
        );
        xhr.upload.onprogress = e => {
          if (e.lengthComputable && e.total)
            onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
        };
        xhr.onload = () =>
          resolve(
            new Response(xhr.responseText, {
              status: xhr.status,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
        xhr.onerror = xhr.ontimeout = () =>
          reject(new Error(NETWORK_ERROR_MESSAGE));
        xhr.onabort = canceled;
        xhr.onloadend = () => init.signal?.removeEventListener('abort', abort);
        init.signal?.addEventListener('abort', abort, { once: true });
        xhr.send(body);
      });
    }
    return await fetch(`${API_URL}${path}`, init);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
};

const errorMessage = async (
  response: Response,
  fallback = 'İşlem tamamlanamadı.',
) => {
  const error: unknown = await response.json().catch(() => null);
  return error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim()
    ? error.message
    : fallback;
};

const readJson = async <T>(response: Response): Promise<T> => {
  try {
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error(
      error instanceof SyntaxError
        ? INVALID_RESPONSE_MESSAGE
        : NETWORK_ERROR_MESSAGE,
    );
  }
};

const validTokens = (
  value: unknown,
): value is { accessToken: string; refreshToken: string } =>
  Boolean(value) &&
  typeof value === 'object' &&
  value !== null &&
  'accessToken' in value &&
  typeof value.accessToken === 'string' &&
  value.accessToken.length > 0 &&
  'refreshToken' in value &&
  typeof value.refreshToken === 'string' &&
  value.refreshToken.length > 0;

const refreshSession = (version: number): Promise<void> => {
  assertSession(version);
  if (pendingRefresh?.version === version) return pendingRefresh.promise;
  if (!refreshToken) return expireSession(version);
  const token = refreshToken;
  const promise = (async () => {
    const response = await fetchSafely('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token }),
    });
    assertSession(version);
    if (!response.ok) {
      if ([400, 401, 403].includes(response.status)) expireSession(version);
      throw new Error(
        await errorMessage(
          response,
          'Oturum yenilenemedi. Lütfen tekrar deneyin.',
        ),
      );
    }
    const session = await readJson<unknown>(response);
    assertSession(version);
    if (!validTokens(session)) throw new Error(INVALID_RESPONSE_MESSAGE);
    saveTokens(session.accessToken, session.refreshToken);
  })().finally(() => {
    if (pendingRefresh?.promise === promise) pendingRefresh = undefined;
  });
  pendingRefresh = { version, promise };
  return promise;
};

type RequestOptions = {
  public?: boolean;
  credentialError?: string;
  onProgress?: (percent: number) => void;
};
type RequestInitSource = RequestInit | (() => RequestInit);

const requestResponse = async (
  path: string,
  init: RequestInitSource = {},
  options: RequestOptions = {},
): Promise<Response> => {
  const version = sessionVersion;
  if (!options.public && pendingRefresh?.version === version)
    await pendingRefresh.promise;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (!options.public) assertSession(version);
    const token = accessToken;
    const config = typeof init === 'function' ? init() : init;
    const headers = new Headers(config.headers);
    if (
      config.body &&
      !(config.body instanceof FormData) &&
      !headers.has('Content-Type')
    )
      headers.set('Content-Type', 'application/json');
    if (!options.public && token)
      headers.set('Authorization', `Bearer ${token}`);
    const response = await fetchSafely(
      path,
      { ...config, headers },
      options.onProgress,
    );
    if (!options.public) assertSession(version);
    if (options.public || response.status !== 401) return response;
    // The password route uses 401 for both expired tokens and a wrong current password.
    if (
      options.credentialError &&
      (await errorMessage(response.clone())) === options.credentialError
    )
      return response;
    if (attempt > 0) return expireSession(version);
    // A late 401 may belong to a token another request has already refreshed.
    if (token === accessToken) await refreshSession(version);
  }
  throw new Error(SESSION_EXPIRED_MESSAGE);
};

const request = async <T>(
  path: string,
  init: RequestInitSource = {},
  options: RequestOptions = {},
): Promise<T> => {
  const version = sessionVersion;
  const response = await requestResponse(path, init, options);
  if (!response.ok)
    throw new RequestError(await errorMessage(response), response.status);
  const result =
    response.status === 204 ? (undefined as T) : await readJson<T>(response);
  if (!options.public) assertSession(version);
  return result;
};

const requestFile = async (path: string) => {
  const version = sessionVersion;
  const response = await requestResponse(path);
  if (!response.ok)
    throw new Error(await errorMessage(response, 'Dosya indirilemedi.'));
  let blob: Blob;
  try {
    blob = await response.blob();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
  assertSession(version);
  return { blob, response };
};

const downloadName = (disposition: string, fallback: string) => {
  const encoded = disposition.match(
    /filename\*\s*=\s*UTF-8'[^']*'([^;]+)/i,
  )?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded.trim());
    } catch {
      /* Fall back to the plain filename. */
    }
  }
  return (
    disposition
      .match(/filename\s*=\s*(?:"([^"]+)"|([^;]+))/i)
      ?.slice(1)
      .find(Boolean)
      ?.trim() || fallback
  );
};

const download = async (path: string, fallbackName: string) => {
  const { blob, response } = await requestFile(path);
  const disposition = response.headers.get('content-disposition') || '';
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  try {
    anchor.href = url;
    anchor.download = downloadName(disposition, fallbackName);
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
};

export const api = {
  hasSession: () => Boolean(accessToken || refreshToken),
  clearSession,
  canRemember: () => Boolean(persistentStore()),
  login: async (email: string, password: string, remember = false) => {
    clearSession();
    rememberSession = remember && Boolean(persistentStore());
    const version = sessionVersion;
    const session = await request<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      { public: true },
    );
    assertSession(version);
    if (!validTokens(session) || !session.user)
      throw new Error(INVALID_RESPONSE_MESSAGE);
    if (!memberPortal && session.user.role === 'candidate')
      throw new Error('Yönetim paneline yalnızca adminler giriş yapabilir.');
    if (memberPortal && session.user.role !== 'candidate')
      throw new Error('Üye alanına yalnızca aday hesabıyla giriş yapılabilir.');
    sessionVersion += 1;
    saveTokens(session.accessToken, session.refreshToken);
    return session.user;
  },
  forgotPassword: (email: string) =>
    request<{ message: string }>(
      '/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      },
      { public: true },
    ),
  me: () => request<User>('/api/auth/me'),
  registerCandidate: (body: {
    name: string;
    email: string;
    eventLink: string;
    noticeAccepted: boolean;
    consentAccepted: boolean;
  }) =>
    request<{ message: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({
          ...body,
          noticeVersion: '2026-01',
          consentVersion: '2026-01',
        }),
      },
      { public: true },
    ),
  saveProfile: (body: Partial<User>) =>
    request<User>('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  requestEmailChange: (email: string, currentPassword: string) =>
    request<{ message: string }>('/api/auth/request-email-change', {
      method: 'POST',
      body: JSON.stringify({ email, currentPassword }),
    }),
  requestDeletion: () =>
    request<{ message: string }>('/api/users/me', {
      method: 'DELETE',
      body: '{}',
    }),
  saveDraft: (
    id: string,
    body: Partial<Application['personalInfo']>,
    revision?: number,
  ) =>
    request<Application>(
      `/api/applications/${encodeURIComponent(id)}/personal-info`,
      { method: 'PATCH', body: JSON.stringify({ ...body, revision }) },
    ),
  submitApplication: (id: string, revision?: number) =>
    request<Application>(`/api/applications/${encodeURIComponent(id)}/submit`, {
      method: 'POST',
      body: JSON.stringify({ revision }),
    }),
  unread: () => request<{ unread: number }>('/api/messages/unread-count'),
  saveBloodGroup: (id: string, bloodGroup: string, consentVersion: string) =>
    request<{
      available: boolean;
      bloodGroup?: string;
      consentVersion: string;
    }>(`/api/applications/${encodeURIComponent(id)}/blood-group`, {
      method: 'PUT',
      body: JSON.stringify({
        bloodGroup,
        consentAccepted: true,
        consentVersion,
      }),
    }),
  revokeBloodGroup: (id: string) =>
    request<{
      available: boolean;
      bloodGroup?: string;
      consentVersion: string;
    }>(`/api/applications/${encodeURIComponent(id)}/blood-group`, {
      method: 'DELETE',
    }),
  changePassword: async (currentPassword: string, newPassword: string) => {
    const version = sessionVersion;
    const result = await request<{ user: User; requiresLogin: boolean }>(
      '/api/auth/change-password',
      {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      },
      { credentialError: 'Mevcut şifre yanlış.' },
    );
    if (result.requiresLogin && version === sessionVersion) clearSession();
    return result;
  },
  logout: async () => {
    const version = sessionVersion;
    try {
      if (accessToken || refreshToken)
        await request('/api/auth/logout', () => ({
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        }));
    } finally {
      if (version === sessionVersion) clearSession();
    }
  },
  applications: (q = '') =>
    request<Application[]>(
      `/api/applications${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    ),
  application: (id: string) => request<Application>(`/api/applications/${id}`),
  candidates: () => request<User[]>('/api/admin/candidates'),
  applicationPage: (params: URLSearchParams) =>
    request<Page<Application>>(`/api/applications?${params}`),
  candidatePage: (params: URLSearchParams) =>
    request<Page<User>>(`/api/admin/candidates?${params}`),
  programs: () => request<Program[]>('/api/programs?includeArchived=true'),
  applicationBloodGroup: (id: string, signal?: AbortSignal) =>
    request<{
      available: boolean;
      bloodGroup?: string;
      consentVersion: string;
    }>(`/api/applications/${encodeURIComponent(id)}/blood-group`, { signal }),
  saveProgram: (data: Partial<Program>, id?: string) =>
    request<Program>(id ? `/api/programs/${id}` : '/api/programs', {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(data),
    }),
  assignProgram: (programId: string, userId: string) =>
    request<Application>('/api/applications', {
      method: 'POST',
      body: JSON.stringify({ programId, userId }),
    }),
  messageSummary: () => request<ThreadSummary[]>('/api/messages/summary'),
  messageSummaryPage: (page = 1) =>
    request<Page<ThreadSummary>>(
      `/api/messages/summary?page=${page}&pageSize=25`,
    ),
  messages: (threadId: string, page = 1) =>
    request<Page<Message>>(
      `/api/messages/${encodeURIComponent(threadId)}?page=${page}&pageSize=25`,
    ),
  sendMessage: (threadId: string, content: string, relatedDocumentId?: string) =>
    request<Message>(`/api/messages/${encodeURIComponent(threadId)}`, {
      method: 'POST',
      body: JSON.stringify(
        relatedDocumentId ? { content, relatedDocumentId } : { content },
      ),
    }),
  readMessages: (threadId: string) =>
    request(`/api/messages/${encodeURIComponent(threadId)}/read`, {
      method: 'POST',
      body: '{}',
    }),
  deletionRequests: () =>
    request<DeletionRequest[]>('/api/admin/deletion-requests'),
  completeDeletion: (id: string) =>
    request<{ message: string; status: string }>(
      `/api/admin/deletion-requests/${id}/complete`,
      { method: 'POST', body: '{}' },
    ),
  documentHistory: (id: string) =>
    request<Document[]>(`/api/applications/${id}/documents/history`),
  uploadApplicationDocument: (
    id: string,
    type: string,
    file: File,
    idempotencyKey: string,
    signal: AbortSignal,
    onProgress?: (percent: number) => void,
  ) => {
    const body = new FormData();
    body.append('file', file);
    return request<Document>(
      `/api/applications/${encodeURIComponent(
        id,
      )}/documents/${encodeURIComponent(type)}`,
      {
        method: 'POST',
        body,
        signal,
        headers: { 'Idempotency-Key': idempotencyKey },
      },
      { onProgress },
    );
  },
  downloadPdf: (id: string, kind: 'cv' | 'motivation') =>
    download(`/api/applications/${id}/pdf/${kind}`, `${kind}.pdf`),
  previewPdf: async (id: string, kind: 'cv' | 'motivation') => {
    const { blob } = await requestFile(
      `/api/applications/${encodeURIComponent(id)}/pdf/${kind}`,
    );
    if (blob.type !== 'application/pdf')
      throw new Error('Dosya bir PDF belgesi değil.');
    return URL.createObjectURL(blob);
  },
  templates: (programId: string) =>
    request<Array<{ id: string; type: string; fileName: string }>>(
      `/api/programs/${programId}/templates`,
    ),
  uploadTemplate: (programId: string, type: string, file: File) => {
    const body = new FormData();
    body.append('file', file);
    return request(`/api/programs/${programId}/templates/${type}`, {
      method: 'POST',
      body,
    });
  },
  downloadTemplate: (id: string, name: string) =>
    download(`/api/program-templates/${id}/download`, name),
  admins: () => request<User[]>('/api/admin/admins'),
  audit: () => request<AuditLog[]>('/api/admin/audit?limit=200'),
  setTemporaryPassword: (
    id: string,
    password: string,
    eventLinkApproved?: boolean,
  ) =>
    request(`/api/admin/candidates/${id}/temporary-password`, {
      method: 'POST',
      body: JSON.stringify(
        eventLinkApproved === undefined
          ? { password }
          : { password, eventLinkApproved },
      ),
    }),
  setStage: (id: string, stage: string, revision?: number) =>
    request<Application>(`/api/applications/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage, revision }),
    }),
  setDecision: (
    id: string,
    status: string,
    reason?: string,
    revision?: number,
  ) =>
    request<Application>(`/api/applications/${id}/decision`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason, revision }),
    }),
  verifyDocument: (
    applicationId: string,
    documentId: string,
    status: string,
    note: string,
  ) =>
    request(
      `/api/applications/${applicationId}/documents/${documentId}/verify`,
      { method: 'PATCH', body: JSON.stringify({ status, note }) },
    ),
  setPhysicalDelivery: (
    applicationId: string,
    documentId: string,
    status: string,
  ) =>
    request(
      `/api/applications/${applicationId}/documents/${documentId}/physical-delivery`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
    ),
  createAdmin: (data: Record<string, string>) =>
    request<User>('/api/admin/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  setAdminStatus: (id: string, status: string) =>
    request<User>(`/api/admin/admins/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  resetAdminPassword: (id: string, temporaryPassword: string) =>
    request(`/api/admin/admins/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ temporaryPassword }),
    }),
  downloadCsv: () =>
    download('/api/admin/exports/applications.csv', 'basvurular.csv'),
  downloadApplications: (format: 'csv' | 'xlsx', params: URLSearchParams) =>
    download(
      `/api/admin/exports/applications.${format}?${params}`,
      `basvurular.${format}`,
    ),
  downloadZip: (ids: string[]) =>
    download(
      `/api/admin/exports/documents.zip?applicationIds=${encodeURIComponent(
        ids.join(','),
      )}`,
      'basvuru-belgeleri.zip',
    ),
  downloadDocument: (id: string, fileName: string) =>
    download(`/api/documents/${id}/download`, fileName),
  // The caller owns this URL and must revoke it when the preview closes or changes.
  previewDocument: async (id: string, fileName: string) => {
    const version = sessionVersion;
    const { blob, response } = await requestFile(
      `/api/documents/${id}/download`,
    );
    if (
      !['application/pdf', 'image/jpeg', 'image/png'].includes(
        blob.type.toLowerCase(),
      )
    ) {
      throw new Error(
        'Bu dosya türü önizlenemiyor. Belgeyi indirerek açabilirsiniz.',
      );
    }
    assertSession(version);
    const name = downloadName(
      response.headers.get('content-disposition') || '',
      fileName,
    );
    const file = new File([blob], name, { type: blob.type });
    return {
      url: URL.createObjectURL(blob),
      canShare:
        typeof navigator.share === 'function' &&
        navigator.canShare?.({ files: [file] }) === true,
      share: () => {
        assertSession(version);
        return navigator.share({ files: [file] });
      },
    };
  },
};
