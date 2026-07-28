import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '../../../../src/db/index'
import { media } from '../../../../src/db/schema'
import { deleteObject } from '../../../../src/lib/storage'
import { jsonError, requireUser } from '../../../../src/lib/server-auth'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const context = await requireUser(request)
    const [item] = await db.select().from(media).where(eq(media.id, id)).limit(1)
    if (!item) return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    if (item.ownerId !== context.user.id && context.role?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await deleteObject(item.objectKey)
    await db.delete(media).where(eq(media.id, item.id))
    return new NextResponse(null, { status: 204 })
  } catch (error) { return jsonError(error as Error) }
}
