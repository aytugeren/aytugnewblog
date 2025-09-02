const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

export async function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API_BASE}${path}`, { cache: 'no-store', ...init });
}
