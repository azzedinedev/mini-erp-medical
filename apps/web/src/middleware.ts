import { NextRequest, NextResponse } from 'next/server';

const accessCookie = 'mediflow.accessToken';

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function hasValidAccessToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split('.');
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  if (parts.length !== 3 || !encodedHeader || !encodedPayload || !encodedSignature) return false;
  const secret = process.env.JWT_ACCESS_SECRET ?? 'local-only-access-secret-change-me';

  try {
    const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedHeader))) as { alg?: string };
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedPayload))) as { sub?: string };
    if (header.alg !== 'HS256' || typeof payload.sub !== 'string' || !payload.sub) return false;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    return await crypto.subtle.verify(
      'HMAC',
      key,
      decodeBase64Url(encodedSignature) as unknown as BufferSource,
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
    );
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(accessCookie)?.value;
  if (await hasValidAccessToken(token)) return NextResponse.next();

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
