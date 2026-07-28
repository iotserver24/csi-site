import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { firebaseAdminAuth } from './firebase-admin.js'
import { db } from '../db/index.js'
import { roles, users } from '../db/schema.js'

export async function requireUser(request) {
  const header = request.headers.get('authorization') || ''
  if (!header.startsWith('Bearer ')) throw new AuthError('Missing authorization token', 401)
  const decoded = await firebaseAdminAuth.verifyIdToken(header.slice(7))
  const [user] = await db.select().from(users).where(eq(users.firebaseUid, decoded.uid)).limit(1)
  if (!user) throw new AuthError('User profile not found', 404)
  const userRoles = await db.select().from(roles).where(eq(roles.userId, user.id))
  const role = userRoles.find(item => item.role === 'admin') || userRoles[0]
  return { firebaseUser: decoded, user, role, userRoles }
}

export function jsonError(error) {
  const status = error instanceof AuthError ? error.status : 500
  if (status === 500) console.error(error)
  return NextResponse.json({ error: status === 500 ? 'Internal server error' : error.message }, { status })
}

export class AuthError extends Error {
  constructor(message, status) { super(message); this.status = status }
}

export function requireRole(context, rolesAllowed) {
  if (!rolesAllowed.includes(context.role?.role)) throw new AuthError('Forbidden', 403)
}
