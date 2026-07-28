import { NextResponse, type NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { firebaseAdminAuth } from './firebase-admin'
import { db } from '../db/index'
import { roles, users } from '../db/schema'
import type { DecodedIdToken } from 'firebase-admin/auth'
import type { InferSelectModel } from 'drizzle-orm'

type _UserRow = InferSelectModel<typeof users>
type _RoleRow = InferSelectModel<typeof roles>

export async function requireUser(request: NextRequest) {
  const header = request.headers.get('authorization') || ''
  if (!header.startsWith('Bearer ')) throw new AuthError('Missing authorization token', 401)
  const decoded: DecodedIdToken = await firebaseAdminAuth.verifyIdToken(header.slice(7))
  const [user] = await db.select().from(users).where(eq(users.firebaseUid, decoded.uid)).limit(1)
  if (!user) throw new AuthError('User profile not found', 404)
  const userRoles = await db.select().from(roles).where(eq(roles.userId, user.id))
  const role = userRoles.find(item => item.role === 'admin') || userRoles[0]
  return { firebaseUser: decoded, user, role, userRoles }
}

export function jsonError(error: Error | AuthError) {
  const status = error instanceof AuthError ? error.status : 500
  if (status === 500) console.error(error)
  return NextResponse.json({ error: status === 500 ? 'Internal server error' : error.message }, { status })
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) { super(message); this.status = status }
}

export function requireRole(context: { role?: { role: string } }, rolesAllowed: string[]) {
  if (!context.role || !rolesAllowed.includes(context.role.role)) throw new AuthError('Forbidden', 403)
}
