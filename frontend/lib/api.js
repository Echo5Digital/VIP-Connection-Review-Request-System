const normalizeBase = (value) => (value ? value.replace(/\/$/, '') : '');

const publicApiBase = normalizeBase(process.env.NEXT_PUBLIC_API_URL);
const serverApiBase =
  normalizeBase(process.env.INTERNAL_API_URL) ||
  publicApiBase ||
  'http://localhost:4000';
const clientApiBase = publicApiBase || '/api-backend';

function getApiBase() {
  return typeof window === 'undefined' ? serverApiBase : clientApiBase;
}

function normalizePath(base, path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (base === '/api-backend' && normalizedPath.startsWith('/api/')) {
    return normalizedPath.slice(4);
  }
  return normalizedPath;
}

function buildQuery(params) {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, value]) => value != null);
  if (entries.length === 0) return '';
  return `?${new URLSearchParams(entries)}`;
}

function isFormData(value) {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

async function request(path, options = {}) {
  const { params, body, ...init } = options;
  const base = getApiBase();
  const url = `${base}${normalizePath(base, path)}${buildQuery(params)}`;
  const headers = { ...init.headers };

  let payload = body;
  if (body != null && !isFormData(body) && typeof body !== 'string') {
    payload = JSON.stringify(body);
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const res = await fetch(url, {
    ...init,
    body: payload,
    headers,
    credentials: init.credentials || 'include',
    cache: init.cache || 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fallbackMessage =
      Array.isArray(data.errors) && data.errors.length
        ? data.errors[0]?.msg
        : null;
    throw new Error(data.message || fallbackMessage || res.statusText);
  }
  return data;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};
