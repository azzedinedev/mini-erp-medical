const apiBase = (process.env.API_PROXY_URL ?? 'http://localhost:4000/api').replace(/\/$/, '');

export function apiAuthUrl(path: string): string {
  return `${apiBase}/${path.replace(/^\//, '')}`;
}

export async function readUpstreamBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export function upstreamHeaders(request: Request): HeadersInit {
  const contentType = request.headers.get('content-type');
  return contentType ? { 'content-type': contentType } : { 'content-type': 'application/json' };
}
