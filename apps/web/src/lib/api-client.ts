import type { ApiError, Paginated } from '@mediflow/shared';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, clearSession } from './auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export class ApiClientError extends Error {
  constructor(public readonly status: number, public readonly payload: ApiError) {
    const message = payload && typeof payload.message === 'string' ? payload.message : Array.isArray(payload?.message) ? payload.message.join(', ') : 'Erreur API';
    super(message);
    this.name = 'ApiClientError';
  }
}

function getAccessToken() {
  return typeof window === 'undefined' ? null : window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  try { return JSON.parse(text) as T; } catch { return text as T; }
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body !== undefined && !(typeof FormData !== 'undefined' && init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' });
  if (response.status === 401 && retry && typeof window !== 'undefined') {
    const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken && path !== '/auth/refresh') {
      try {
        const refreshed = await request<{ accessToken: string }>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }, false);
        window.localStorage.setItem(ACCESS_TOKEN_KEY, refreshed.accessToken);
        return request<T>(path, init, false);
      } catch {
        clearSession();
      }
    }
  }
  if (response.status === 401 && typeof window !== 'undefined' && path !== '/auth/login' && path !== '/auth/refresh') clearSession();
  if (!response.ok) {
    const payload = await parseResponse<ApiError>(response).catch(() => ({ statusCode: response.status, message: 'Erreur réseau' }));
    throw new ApiClientError(response.status, payload);
  }
  return parseResponse<T>(response);
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export type { Paginated };
