import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '../../../../../src/db/index.js'
import { roles, users } from '../../../../../src/db/schema.js'
import { jsonError, requireRole, requireUser } from '../../../../../src/lib/server-auth.js'

export async function PATCH(request, { params }) {
  try {
    const context = await requireUser(request); requireRole(context, ['admin'])
    const { role, permissions = [], level = 99 } = await request.json()
    if (!role || !['member', 'coreMember', 'admin'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    const user = (await db.select().from(users).where(eq(users.id, params.id)).limit(1))[0]
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    await db.delete(roles).where(eq(roles.userId, user.id))
    if (role !== 'member') await db.insert(roles).values({ userId: user.id, role, permissions: role === 'admin' ? ['all'] : permissions, level })
    return NextResponse.json({ ok: true })
  } catch (error) { return jsonError(error) }
}
