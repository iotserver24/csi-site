import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '../../../../src/db/index.js'
import { events } from '../../../../src/db/schema.js'
import { jsonError, requireRole, requireUser } from '../../../../src/lib/server-auth.js'

export async function PATCH(request, { params }) {
  try {
    const context = await requireUser(request); requireRole(context, ['admin', 'coreMember'])
    const [event] = await db.update(events).set({ ...(await request.json()), updatedAt: new Date() }).where(eq(events.id, params.id)).returning()
    return NextResponse.json({ event })
  } catch (error) { return jsonError(error) }
}
export async function DELETE(request, { params }) {
  try {
    const context = await requireUser(request); requireRole(context, ['admin', 'coreMember'])
    await db.delete(events).where(eq(events.id, params.id))
    return new NextResponse(null, { status: 204 })
  } catch (error) { return jsonError(error) }
}
