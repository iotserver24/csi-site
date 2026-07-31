import { eq } from 'drizzle-orm'
import { db } from '../db/index'
import { users } from '../db/schema'
import {
  isDefaultUsername,
  normalizeUsername,
  suggestUsername,
  usernameFromUsn,
  validateUsername,
  withSuffix,
} from '../utils/username'

async function claimUsername(
  userId: string,
  base: string,
  current?: string | null
): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const candidate = withSuffix(base, i)
    if (validateUsername(candidate)) continue

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, candidate))
      .limit(1)

    if (existing.length && existing[0].id !== userId) continue

    if (current !== candidate) {
      await db
        .update(users)
        .set({ username: candidate, updatedAt: new Date() })
        .where(eq(users.id, userId))
    }
    return candidate
  }

  const fallback = `u${userId.replace(/-/g, '').slice(0, 12)}`
  await db
    .update(users)
    .set({ username: fallback, updatedAt: new Date() })
    .where(eq(users.id, userId))
  return fallback
}

/**
 * Ensure user has a unique username.
 * Prefers **USN** as the default handle; upgrades auto email/name handles when USN appears.
 */
export async function ensureUsername(user: {
  id: string
  username?: string | null
  email?: string | null
  name?: string | null
  usn?: string | null
}): Promise<string> {
  const usnHandle = usernameFromUsn(user.usn)

  // Already on USN handle
  if (usnHandle && user.username && normalizeUsername(user.username) === usnHandle) {
    return usnHandle
  }

  // Upgrade to USN when available and current handle is still a default
  if (
    usnHandle &&
    isDefaultUsername(user.username, {
      email: user.email,
      name: user.name,
      usn: user.usn,
    })
  ) {
    return claimUsername(user.id, usnHandle, user.username)
  }

  // Keep a valid custom username
  if (user.username && !validateUsername(user.username)) {
    return normalizeUsername(user.username)
  }

  const base = suggestUsername({
    email: user.email,
    name: user.name,
    usn: user.usn,
  })
  return claimUsername(user.id, base, user.username)
}

export async function isUsernameTaken(username: string, exceptUserId?: string): Promise<boolean> {
  const u = normalizeUsername(username)
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.username, u)).limit(1)
  if (!rows.length) return false
  if (exceptUserId && rows[0].id === exceptUserId) return false
  return true
}
