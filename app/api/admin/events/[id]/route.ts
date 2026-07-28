import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '../../../../../src/db/index'
import { events } from '../../../../../src/db/schema'
import { jsonError, requireRole, requireUser } from '../../../../../src/lib/server-auth'
import { invalidateCache } from '../../../../../src/lib/cache'
import { normalizeEventInput } from '../route'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const context = await requireUser(request)
    requireRole(context, ['admin'])
    const input = await request.json()

    // Partial toggles used by admin table buttons
    const keys = Object.keys(input || {})
    if (keys.length > 0 && keys.every(k => ['published', 'featured', 'registrationsAvailable'].includes(k))) {
      const updated = await db.update(events).set({ ...input, updatedAt: new Date() }).where(eq(events.id, id)).returning()
      if (!updated.length) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      await invalidateCache('events:')
      return NextResponse.json({ event: updated[0] })
    }

    const row = normalizeEventInput(input, id)
    const { id: _drop, ...set } = row
    const updated = await db.update(events).set(set).where(eq(events.id, id)).returning()
    if (!updated.length) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    await invalidateCache('events:')
    return NextResponse.json({ event: updated[0] })
  } catch (error) {
    return jsonError(error as Error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const context = await requireUser(request)
    requireRole(context, ['admin'])
    const deleted = await db.delete(events).where(eq(events.id, id)).returning()
    if (!deleted.length) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    await invalidateCache('events:')
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error as Error)
  }
}
