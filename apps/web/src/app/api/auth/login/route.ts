import { NextResponse } from 'next/server';
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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ statusCode: 400, message: 'Corps de connexion invalide' }, { status: 400 });
  }

  try {
    const upstream = await fetch(apiAuthUrl('/auth/login'), {
      method: 'POST',
      headers: upstreamHeaders(request),
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const payload = await readUpstreamBody(upstream) as { accessToken?: string; refreshToken?: string } | unknown;
    const response = NextResponse.json(payload ?? {}, { status: upstream.status });

    if (upstream.ok && payload && typeof payload === 'object' && 'accessToken' in payload && typeof payload.accessToken === 'string') {
      response.cookies.set(accessCookie, payload.accessToken, cookieOptions(60 * 60 * 24 * 30));
      if ('refreshToken' in payload && typeof payload.refreshToken === 'string') {
        response.cookies.set(refreshCookie, payload.refreshToken, cookieOptions(60 * 60 * 24 * 30));
      }
    } else if (!upstream.ok) {
      response.cookies.delete(accessCookie);
      response.cookies.delete(refreshCookie);
    }

    return response;
  } catch {
    return NextResponse.json({ statusCode: 502, message: 'API de connexion indisponible' }, { status: 502 });
  }
}
