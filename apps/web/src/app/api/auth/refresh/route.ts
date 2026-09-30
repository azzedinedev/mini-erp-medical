import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiAuthUrl, readUpstreamBody, upstreamHeaders } from '../_utils';

const accessCookie = 'mediflow.accessToken';
const refreshCookie = 'mediflow.refreshToken';

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export async function POST(request: Request) {
  let body: { refreshToken?: string } = {};
  try {
    body = await request.json() as { refreshToken?: string };
  } catch {
    // The refresh cookie is also accepted when no JSON body is sent.
  }

  const refreshToken = body.refreshToken || request.headers.get('x-mediflow-refresh-token') || cookies().get('mediflow.refreshToken')?.value;
  if (!refreshToken) return NextResponse.json({ statusCode: 401, message: 'Session expirée' }, { status: 401 });

  try {
    const upstream = await fetch(apiAuthUrl('/auth/refresh'), {
      method: 'POST',
      headers: upstreamHeaders(request),
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });
    const payload = await readUpstreamBody(upstream) as { accessToken?: string } | unknown;
    const response = NextResponse.json(payload ?? {}, { status: upstream.status });

    if (upstream.ok && payload && typeof payload === 'object' && 'accessToken' in payload && typeof payload.accessToken === 'string') {
      response.cookies.set(accessCookie, payload.accessToken, cookieOptions(60 * 60 * 24 * 30));
      response.cookies.set(refreshCookie, refreshToken, cookieOptions(60 * 60 * 24 * 30));
    } else if (upstream.status === 401) {
      response.cookies.delete(accessCookie);
      response.cookies.delete(refreshCookie);
    }

    return response;
  } catch {
    return NextResponse.json({ statusCode: 502, message: 'API d’authentification indisponible' }, { status: 502 });
  }
}
