import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../src/db/index'
import { media } from '../../../../src/db/schema'
import { createUploadUrl, publicObjectUrl } from '../../../../src/lib/storage'
import { jsonError, requireUser } from '../../../../src/lib/server-auth'

export async function POST(request: NextRequest) {
  try {
    const context = await requireUser(request)
    const { fileName, contentType, size } = await request.json()
    if (!fileName || !contentType || !Number.isInteger(size) || size <= 0 || size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Invalid upload' }, { status: 400 })
    if (!process.env.S3_BUCKET) return NextResponse.json({ error: 'Object storage is not configured' }, { status: 503 })
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const objectKey = `uploads/${context.user.id}/${crypto.randomUUID()}-${safeName}`
    const uploadUrl = await createUploadUrl(objectKey, contentType)
    await db.insert(media).values({ ownerId: context.user.id, objectKey, publicUrl: publicObjectUrl(objectKey), contentType, size })
    return NextResponse.json({ uploadUrl, objectKey, publicUrl: publicObjectUrl(objectKey) })
  } catch (error) { return jsonError(error as Error) }
}
