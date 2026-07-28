import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '../../../../src/db/index'
import { events } from '../../../../src/db/schema'
import { jsonError, requireRole, requireUser } from '../../../../src/lib/server-auth'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const context = await requireUser(request); requireRole(context, ['admin', 'coreMember'])
    const [event] = await db.update(events).set({ ...(await request.json()), updatedAt: new Date() }).where(eq(events.id, id)).returning()
    return NextResponse.json({ event })
  } catch (error) { return jsonError(error as Error) }
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const context = await requireUser(request); requireRole(context, ['admin', 'coreMember'])
    await db.delete(events).where(eq(events.id, id))
    return new NextResponse(null, { status: 204 })
  } catch (error) { return jsonError(error as Error) }
}
