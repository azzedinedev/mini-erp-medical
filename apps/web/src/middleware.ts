import { NextRequest, NextResponse } from 'next/server';

const accessCookie = 'mediflow.accessToken';

function authEndpoint(): string {
  const apiBase = (process.env.API_PROXY_URL ?? 'http://localhost:4000/api').replace(/\/$/, '');
  return `${apiBase}/auth/me`;
}

async function hasAuthenticatedSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const response = await fetch(authEndpoint(), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(accessCookie)?.value;
  if (await hasAuthenticatedSession(token)) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(accessCookie);
  response.cookies.delete('mediflow.refreshToken');
  return response;
}

export const config = {
  matcher: ['/((?!login|api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|sw.js).*)'],
};
