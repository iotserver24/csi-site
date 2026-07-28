import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '../../../../../src/db/index'
import { roles, users } from '../../../../../src/db/schema'
import { jsonError, requireRole, requireUser } from '../../../../../src/lib/server-auth'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const context = await requireUser(request); requireRole(context, ['admin'])
    const { role, permissions = [], level = 99 } = await request.json()
    if (!role || !['member', 'coreMember', 'admin'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    const user = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0]
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    await db.delete(roles).where(eq(roles.userId, user.id))
    if (role !== 'member') await db.insert(roles).values({ userId: user.id, role, permissions: role === 'admin' ? ['all'] : permissions, level })
    return NextResponse.json({ ok: true })
  } catch (error) { return jsonError(error as Error) }
}
