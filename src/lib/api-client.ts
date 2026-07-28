import { auth } from './firebase-client'

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Record<string, unknown>> {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(path, { ...options, headers })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Request failed')
  return body
}

export const api = {
  get: (path: string) => apiFetch(path),
  post: (path: string, body: Record<string, unknown>) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path: string, body: Record<string, unknown>) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch(path, { method: 'DELETE' }),
}
