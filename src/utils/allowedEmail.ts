/** College Google accounts only — personal Gmail etc. cannot sign in. */
export const ALLOWED_EMAIL_DOMAIN = 'nmamit.in'

export function isAllowedCollegeEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  return normalized.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)
}

export const ALLOWED_EMAIL_MESSAGE =
  'Only @nmamit.in college emails can sign in. Use your NMAMIT Google account.'
