import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '../../../../src/db/index.js'
import { media } from '../../../../src/db/schema.js'
import { deleteObject } from '../../../../src/lib/storage.js'
import { jsonError, requireUser } from '../../../../src/lib/server-auth.js'

export async function DELETE(request, { params }) {
  try {
    const context = await requireUser(request)
    const [item] = await db.select().from(media).where(eq(media.id, params.id)).limit(1)
    if (!item) return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    if (item.ownerId !== context.user.id && context.role?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await deleteObject(item.objectKey)
    await db.delete(media).where(eq(media.id, item.id))
    return new NextResponse(null, { status: 204 })
  } catch (error) { return jsonError(error) }
}
