import type { ApiError, LoginResponse, Page } from '@clearpath/shared-types';
import { API_BASE } from './constants';
import { readTokens, writeTokens } from './auth-storage';
import { toQueryString, type QueryValue } from './query';

export class ApiRequestError extends Error {
  constructor(public status: number, public body: ApiError | null) {
    super(Array.isArray(body?.message) ? body!.message.join('; ') : body?.message ?? `Request failed (${status})`);
  }
}

let refreshing: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  const tokens = readTokens();
  if (!tokens) return false;
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  });
  if (!res.ok) {
    writeTokens(null);
    return false;
  }
  const next = (await res.json()) as { accessToken: string; refreshToken: string };
  writeTokens({ accessToken: next.accessToken, refreshToken: next.refreshToken });
  return true;
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const tokens = readTokens();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(tokens ? { authorization: `Bearer ${tokens.accessToken}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && retry && tokens) {
    refreshing ??= refreshSession().finally(() => (refreshing = null));
    if (await refreshing) return request<T>(path, init, false);
    if (typeof window !== 'undefined') window.location.assign('/login');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(res.status, body);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const api = {
  get: <T>(path: string, params: Record<string, QueryValue> = {}) => request<T>(`${path}${toQueryString(params)}`),
  list: <T>(path: string, params: Record<string, QueryValue> = {}) => request<Page<T>>(`${path}${toQueryString(params)}`),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: (path: string) => request<void>(path, { method: 'DELETE' }),
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, false);
    writeTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    return res;
  },
  async logout() {
    const tokens = readTokens();
    if (tokens) await request<void>('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: tokens.refreshToken }) }, false).catch(() => undefined);
    writeTokens(null);
  },
};
