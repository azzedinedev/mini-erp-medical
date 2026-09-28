import type { ApiError, Paginated } from '@mediflow/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export class ApiClientError extends Error {
  constructor(public readonly status: number, public readonly payload: ApiError) { super(typeof payload.message === 'string' ? payload.message : payload.message.join(', ')); }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  if (!response.ok) { const payload = await response.json().catch(() => ({ message: 'Erreur réseau', statusCode: response.status })); throw new ApiClientError(response.status, payload); }
  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};

export type { Paginated };
