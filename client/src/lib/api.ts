const BASE = '/api';

export function getToken(): string | null {
  return localStorage.getItem('ki_token');
}

export function setToken(t: string | null) {
  if (t) localStorage.setItem('ki_token', t);
  else localStorage.removeItem('ki_token');
}

export function getUser(): any {
  const u = localStorage.getItem('ki_user');
  return u ? JSON.parse(u) : null;
}

export function setUser(u: any) {
  if (u) localStorage.setItem('ki_user', JSON.stringify(u));
  else localStorage.removeItem('ki_user');
}

export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}
