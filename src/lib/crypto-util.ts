import crypto from 'node:crypto'

/** Constant-time hex HMAC compare (rejects length mismatch safely). */
export function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'utf8')
    const bb = Buffer.from(b, 'utf8')
    if (ba.length !== bb.length) return false
    return crypto.timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

/** Short unguessable team / invite codes. */
export function secureTeamCode(bytes = 5): string {
  return crypto.randomBytes(bytes).toString('hex').toUpperCase().slice(0, 8)
}
