import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../../../src/db/index.js'
import { roles, users } from '../../../../src/db/schema.js'
import { jsonError, requireRole, requireUser } from '../../../../src/lib/server-auth.js'

export async function GET(request) {
  try {
    const context = await requireUser(request); requireRole(context, ['admin'])
    const rows = await db.select({ user: users, role: roles }).from(users).leftJoin(roles, eq(users.id, roles.userId)).orderBy(desc(users.createdAt))
    return NextResponse.json({ users: rows.map(({ user, role }) => ({ ...user, uid: user.firebaseUid, photoURL: user.photoUrl, role: role?.role || 'member', permissions: role?.permissions || [] })) })
  } catch (error) { return jsonError(error) }
}
