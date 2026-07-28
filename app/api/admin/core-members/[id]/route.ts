import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '../../../../../src/db/index'
import { coreMembers } from '../../../../../src/db/schema'
import { jsonError, requireRole, requireUser } from '../../../../../src/lib/server-auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const context = await requireUser(request); requireRole(context, ['admin'])
    const input = await request.json()
    const updated = await db.update(coreMembers).set(input).where(eq(coreMembers.id, id)).returning()
    if (!updated.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ coreMember: updated[0] })
  } catch (error) { return jsonError(error as Error) }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const context = await requireUser(request); requireRole(context, ['admin'])
    const deleted = await db.delete(coreMembers).where(eq(coreMembers.id, id)).returning()
    if (!deleted.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) { return jsonError(error as Error) }
}
