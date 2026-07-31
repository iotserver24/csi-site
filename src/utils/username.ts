/** Public profile handle rules: 3–24 chars, lowercase a-z / 0-9 / _ / - */

const RESERVED = new Set([
  'admin',
  'api',
  'auth',
  'events',
  'team',
  'profile',
  'recruit',
  'u',
  'me',
  'settings',
  'login',
  'logout',
  'csi',
  'nmamit',
  'core',
  'null',
  'undefined',
  'www',
  'static',
  'assets',
])

export const USERNAME_MIN = 3
export const USERNAME_MAX = 24

export function normalizeUsername(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/[_-]{2,}/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '')
    .slice(0, USERNAME_MAX)
}

/** Returns error message, or null if valid. */
export function validateUsername(raw: string): string | null {
  const u = normalizeUsername(raw)
  if (u.length < USERNAME_MIN) return `Username must be at least ${USERNAME_MIN} characters`
  if (u.length > USERNAME_MAX) return `Username must be at most ${USERNAME_MAX} characters`
  if (!/^[a-z0-9][a-z0-9_-]*[a-z0-9]$/.test(u) && u.length > 1) {
    if (u.length === 1 || !/^[a-z0-9]+$/.test(u)) {
      return 'Use letters, numbers, _ or - (start and end with a letter or number)'
    }
  }
  // 3–24: must match full pattern
  if (!/^[a-z0-9]([a-z0-9_-]{0,22}[a-z0-9])?$/.test(u)) {
    return 'Use letters, numbers, _ or - (start and end with a letter or number)'
  }
  if (RESERVED.has(u)) return 'That username is reserved'
  return null
}

/** USN → default public handle (e.g. NNM24AC008 → nnm24ac008). */
export function usernameFromUsn(usn: string | null | undefined): string | null {
  const u = normalizeUsername(usn || '')
  if (u.length < USERNAME_MIN) return null
  if (validateUsername(u)) return null
  return u
}

/** True if handle looks auto-generated (safe to replace with USN). */
export function isDefaultUsername(
  username: string | null | undefined,
  parts: { email?: string | null; name?: string | null; usn?: string | null }
): boolean {
  if (!username) return true
  const u = normalizeUsername(username)
  const fromUsn = normalizeUsername(parts.usn || '')
  if (fromUsn && u === fromUsn) return true
  const email = normalizeUsername((parts.email || '').split('@')[0] || '')
  if (email && (u === email || u.startsWith(email))) return true
  const name = normalizeUsername((parts.name || '').replace(/\s+/g, ''))
  if (name && (u === name || u.startsWith(name))) return true
  if (u.startsWith('user')) return true
  return false
}

/**
 * Default handle: **USN first**, then email local-part, then name.
 */
export function suggestUsername(parts: {
  email?: string | null
  name?: string | null
  usn?: string | null
}): string {
  const fromUsn = usernameFromUsn(parts.usn)
  if (fromUsn) return fromUsn

  const local = (parts.email || '').split('@')[0] || ''
  const fromEmail = normalizeUsername(local)
  if (fromEmail.length >= USERNAME_MIN) return fromEmail

  const fromName = normalizeUsername((parts.name || '').replace(/\s+/g, ''))
  if (fromName.length >= USERNAME_MIN) return fromName

  return `user${Math.random().toString(36).slice(2, 8)}`
}

export function withSuffix(base: string, n: number): string {
  const suffix = n === 0 ? '' : String(n)
  const room = USERNAME_MAX - suffix.length
  const stem = normalizeUsername(base).slice(0, Math.max(USERNAME_MIN, room))
  return normalizeUsername(`${stem}${suffix}`) || `user${n}`
}
