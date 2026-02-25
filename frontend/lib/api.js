const API = process.env.NEXT_PUBLIC_API_URL || '';

async function request(path, options = {}) {
  const { params, ...init } = options;
  const url = params ? `${API}${path}?${new URLSearchParams(params)}` : `${API}${path}`;
  const headers = { 'Content-Type': 'application/json', ...init.headers };
  const res = await fetch(url, {
    ...init,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) =>
    request(path, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: (path, body, options) =>
    request(path, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};
