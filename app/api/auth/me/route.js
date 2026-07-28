import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { firebaseAdminAuth } from '../../../../src/lib/firebase-admin.js'
import { db } from '../../../../src/db/index.js'
import { roles, users } from '../../../../src/db/schema.js'
import { jsonError } from '../../../../src/lib/server-auth.js'

export async function POST(request) {
  try {
    const header = request.headers.get('authorization') || ''
    if (!header.startsWith('Bearer ')) return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
    const decoded = await firebaseAdminAuth.verifyIdToken(header.slice(7))
    const input = await request.json().catch(() => ({}))
    const [user] = await db.insert(users).values({
      firebaseUid: decoded.uid,
      email: decoded.email || input.email,
      name: input.name || decoded.name || null,
      photoUrl: input.photoUrl || decoded.picture || null,
    }).onConflictDoUpdate({
      target: users.firebaseUid,
      set: {
        email: decoded.email || input.email,
        name: input.name || decoded.name || null,
        photoUrl: input.photoUrl || decoded.picture || null,
        updatedAt: new Date(),
      },
    }).returning()
    const userRoles = await db.select().from(roles).where(eq(roles.userId, user.id))
    const role = userRoles.find(item => item.role === 'admin') || userRoles[0]
    return NextResponse.json({ user: presentUser(user, role) })
  } catch (error) {
    return jsonError(error)
  }
}

function presentUser(user, role) {
  return {
    ...user,
    uid: user.firebaseUid,
    photoURL: user.photoUrl,
    role: role?.role || 'member',
    roleName: role?.role || 'Member',
    permissions: role?.permissions || [],
    profile: { phone: user.phone || '', college: user.college || 'NMAMIT', branch: user.branch || '', year: user.year || '', bio: user.bio || '' },
    membership: { status: user.membershipStatus, type: user.membershipType, expiresAt: user.membershipExpiresAt },
  }
}
