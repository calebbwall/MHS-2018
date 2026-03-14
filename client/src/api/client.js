/**
 * Centralized fetch wrapper.
 * Automatically attaches Authorization header when a token is provided.
 * Throws on non-OK responses with the server's error message.
 */
export async function apiFetch(path, { token, method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Parse JSON response (even on error responses)
  let data;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return null;
  }

  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }

  return data;
}

/**
 * Hook-friendly helper that pulls the token from localStorage.
 * Use this in components via the useAuth context instead where possible.
 */
export function getToken() {
  return localStorage.getItem('token');
}
