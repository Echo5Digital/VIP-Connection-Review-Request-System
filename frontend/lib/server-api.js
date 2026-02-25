import { cookies } from 'next/headers';

const normalizeBase = (value) => (value ? value.replace(/\/$/, '') : '');
const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value || '');

const internalApiBase = normalizeBase(process.env.INTERNAL_API_URL);
const publicApiBase = normalizeBase(process.env.NEXT_PUBLIC_API_URL);
const apiBase =
  (isAbsoluteUrl(internalApiBase) ? internalApiBase : '') ||
  (isAbsoluteUrl(publicApiBase) ? publicApiBase : '') ||
  'http://localhost:4000';

function buildQuery(params) {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, value]) => value != null);
  if (entries.length === 0) return '';
  return `?${new URLSearchParams(entries)}`;
}

export async function serverRequest(path, options = {}) {
  const { params, body, ...init } = options;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${apiBase}${normalizedPath}${buildQuery(params)}`;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const headers = { ...init.headers };
  if (cookieHeader) {
    headers.cookie = cookieHeader;
  }

  let payload = body;
  if (body != null && typeof body !== 'string') {
    payload = JSON.stringify(body);
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const res = await fetch(url, {
    ...init,
    body: payload,
    headers,
    cache: init.cache || 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}

export const serverApi = {
  get: (path, options) => serverRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => serverRequest(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => serverRequest(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => serverRequest(path, { ...options, method: 'DELETE' }),
};
