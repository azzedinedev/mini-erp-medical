import type { PermissionAction, ModuleKey } from '@mediflow/shared';

export const ACCESS_TOKEN_KEY = 'mediflow.accessToken';
export const REFRESH_TOKEN_KEY = 'mediflow.refreshToken';
export const SESSION_EVENT = 'mediflow-auth-changed';

type SessionPermission = string | { module?: string; action?: string };
type SessionRole = { id?: string; name?: string; permissions?: SessionPermission[] };

export type StoredSession = {
  accessToken: string;
  refreshToken?: string;
  user?: {
    sub?: string;
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    locale?: string;
    theme?: string;
    roles?: SessionRole[];
  };
};

export function readSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!accessToken) return null;
  const rawUser = window.localStorage.getItem('mediflow.user');
  let user: StoredSession['user'];
  if (rawUser) {
    try { user = JSON.parse(rawUser) as StoredSession['user']; } catch { user = undefined; }
  }
  return { accessToken, refreshToken: window.localStorage.getItem(REFRESH_TOKEN_KEY) ?? undefined, user };
}

export function storeSession(session: StoredSession) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  if (session.refreshToken) window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  if (session.user) window.localStorage.setItem('mediflow.user', JSON.stringify(session.user));
  window.dispatchEvent(new CustomEvent(SESSION_EVENT));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem('mediflow.user');
  // The access cookie is HttpOnly; clear it through the same-origin route as
  // soon as a session is rejected or explicitly removed.
  void window.fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
  window.dispatchEvent(new CustomEvent(SESSION_EVENT));
}

export function hasPermission(module: ModuleKey, action: PermissionAction, session = readSession()): boolean {
  if (!session?.user?.roles?.length) return false;
  const permission = `${module}:${action}`;
  return session.user.roles.some((role) => (role.permissions ?? []).some((value) => {
    if (typeof value === 'string') return value === permission;
    return value.module === module && value.action === action;
  }));
}

export function userDisplayName(session = readSession()): string {
  const user = session?.user;
  if (!user) return 'Utilisateur';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return name || user.email || 'Utilisateur';
}
