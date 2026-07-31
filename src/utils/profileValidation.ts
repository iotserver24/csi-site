const MAX = {
  name: 100,
  phone: 15,
  college: 120,
  branch: 80,
  year: 20,
  bio: 1000,
  usn: 20,
  github: 200,
  linkedin: 200,
  photoUrl: 500,
  username: 32,
} as const

const PHONE = /^[6-9]\d{9}$/
const GITHUB_USER = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/

function trimStr(v: unknown, max: number): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  if (!s) return null
  return s.slice(0, max)
}

/** Accept bare username, github.com/... or full https URL. */
function normalizeGithub(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null
  if (/^https:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/?$/i.test(s)) {
    return s.replace(/\/$/, '')
  }
  // strip accidental protocol / host
  const bare = s
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/^github\.com\//i, '')
    .replace(/\/$/, '')
    .split(/[/?#]/)[0]
  if (!GITHUB_USER.test(bare)) {
    throw new Error('Invalid GitHub username or URL')
  }
  return `https://github.com/${bare}`
}

/** Accept linkedin path, www., or full https URL. */
function normalizeLinkedin(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null
  if (/^https:\/\/(www\.)?linkedin\.com\/(in|pub|company)\/[A-Za-z0-9_.\-%/]+\/?$/i.test(s)) {
    return s.replace(/\/$/, '')
  }
  let path = s
    .replace(/^https?:\/\//i, '')
    .replace(/^(www\.)?/i, '')
  if (path.toLowerCase().startsWith('linkedin.com/')) {
    path = path.slice('linkedin.com/'.length)
  }
  // bare slug → /in/slug
  if (!path.includes('/')) {
    path = `in/${path.replace(/^@/, '')}`
  }
  if (!/^(in|pub|company)\/[A-Za-z0-9_.\-%/]+$/i.test(path)) {
    throw new Error('Invalid LinkedIn URL (use linkedin.com/in/your-name)')
  }
  return `https://www.linkedin.com/${path.replace(/\/$/, '')}`
}

/** Validate / normalize profile PATCH fields. Throws Error with message. */
export function sanitizeProfilePatch(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...values }

  if ('name' in out) out.name = trimStr(out.name, MAX.name)
  if ('college' in out) out.college = trimStr(out.college, MAX.college)
  if ('branch' in out) out.branch = trimStr(out.branch, MAX.branch)
  if ('year' in out) out.year = trimStr(out.year, MAX.year)
  if ('bio' in out) out.bio = trimStr(out.bio, MAX.bio)
  if ('usn' in out) {
    const usn = trimStr(out.usn, MAX.usn)
    out.usn = usn ? usn.toUpperCase() : null
  }
  if ('username' in out && out.username != null && out.username !== '') {
    out.username = String(out.username).trim().toLowerCase().slice(0, MAX.username)
  }

  if ('phone' in out) {
    const raw = out.phone == null ? '' : String(out.phone).replace(/\D/g, '')
    let phone = raw
    if (phone.startsWith('91') && phone.length > 10) phone = phone.slice(2)
    if (phone.startsWith('0')) phone = phone.slice(1)
    phone = phone.slice(0, 10)
    if (phone && !PHONE.test(phone)) throw new Error('Invalid phone number (10 digits, starts with 6–9)')
    out.phone = phone || null
  }

  if ('github' in out) {
    const g = trimStr(out.github, MAX.github)
    out.github = g ? normalizeGithub(g) : null
  }
  if ('linkedin' in out) {
    const l = trimStr(out.linkedin, MAX.linkedin)
    out.linkedin = l ? normalizeLinkedin(l) : null
  }
  if ('photoUrl' in out) {
    const p = trimStr(out.photoUrl, MAX.photoUrl)
    if (p && !/^https:\/\//i.test(p)) throw new Error('Photo URL must be https')
    if (p && /^(javascript|data|vbscript):/i.test(p)) throw new Error('Invalid photo URL')
    out.photoUrl = p
  }

  return out
}
