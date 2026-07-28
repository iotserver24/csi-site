import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '../../../../../src/db/index'
import { recruits } from '../../../../../src/db/schema'
import { jsonError, requireRole, requireUser } from '../../../../../src/lib/server-auth'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const context = await requireUser(request); requireRole(context, ['admin'])
    const input = await request.json()
    const updated = await db.update(recruits).set(input).where(eq(recruits.id, id)).returning()
    if (!updated.length) return NextResponse.json({ error: 'Recruit not found' }, { status: 404 })
    return NextResponse.json({ recruit: updated[0] })
  } catch (error) { return jsonError(error as Error) }
}
