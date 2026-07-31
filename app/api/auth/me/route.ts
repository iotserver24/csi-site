import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { firebaseAdminAuth } from '../../../../src/lib/firebase-admin'
import { db } from '../../../../src/db/index'
import { roles, users } from '../../../../src/db/schema'
import { AuthError, jsonError } from '../../../../src/lib/server-auth'
import { ensureUsername } from '../../../../src/lib/username'
import { ALLOWED_EMAIL_MESSAGE, isAllowedCollegeEmail } from '../../../../src/utils/allowedEmail'
import { clientIp, rateLimit } from '../../../../src/lib/rate-limit'
import type { DbUser, DbRole } from '../../../../src/types'

export async function POST(request: NextRequest) {
  try {
    if (!(await rateLimit(`auth-me:${clientIp(request)}`, 30, 60_000))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const header = request.headers.get('authorization') || ''
    if (!header.startsWith('Bearer ')) return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
    const token = header.slice(7).trim()
    if (!token || token.length > 4096) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const decoded = await firebaseAdminAuth.verifyIdToken(token)
    const email = decoded.email || ''
    if (!isAllowedCollegeEmail(email)) {
      throw new AuthError(ALLOWED_EMAIL_MESSAGE, 403)
    }
    if (decoded.email_verified === false) {
      throw new AuthError('Verify your email before continuing', 403)
    }

    // Prefer token claims over client body for identity fields
    const input = await request.json().catch(() => ({}))
    const name = (decoded.name || input.name || null) as string | null
    const photoUrl = (decoded.picture || input.photoUrl || null) as string | null
    const safeName = name ? String(name).slice(0, 100) : null
    const safePhoto = photoUrl && String(photoUrl).startsWith('https://') ? String(photoUrl).slice(0, 500) : null

    let [user] = await db.insert(users).values({
      firebaseUid: decoded.uid,
      email,
      name: safeName,
      photoUrl: safePhoto,
    }).onConflictDoUpdate({
      target: users.firebaseUid,
      set: {
        email,
        name: safeName,
        photoUrl: safePhoto,
        updatedAt: new Date(),
      },
    }).returning()

    // Default public handle = USN (or email until USN is set); upgrade when USN appears
    {
      const username = await ensureUsername(user)
      if (username !== user.username) user = { ...user, username }
    }

    const userRoles = await db.select().from(roles).where(eq(roles.userId, user.id))
    const role = userRoles.find(item => item.role === 'admin') || userRoles[0]
    return NextResponse.json({ user: presentUser(user, role) })
  } catch (error) {
    return jsonError(error as Error)
  }
}

function presentUser(user: DbUser, role: DbRole | undefined) {
  return {
    ...user,
    uid: user.firebaseUid,
    photoURL: user.photoUrl,
    username: user.username,
    role: role?.role || 'member',
    roleName: role?.role || 'Member',
    permissions: role?.permissions || [],
    profile: { phone: user.phone || '', college: user.college || 'NMAMIT', branch: user.branch || '', year: user.year || '', bio: user.bio || '' },
    membership: { status: user.membershipStatus, type: user.membershipType, expiresAt: user.membershipExpiresAt },
  }
}
