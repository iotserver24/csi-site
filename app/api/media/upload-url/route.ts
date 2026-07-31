import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../src/db/index'
import { media } from '../../../../src/db/schema'
import { createUploadUrl, publicObjectUrl } from '../../../../src/lib/storage'
import { clientIp, rateLimit } from '../../../../src/lib/rate-limit'
import { jsonError, requireUser } from '../../../../src/lib/server-auth'

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
])

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: NextRequest) {
  try {
    const context = await requireUser(request)
    if (!(await rateLimit(`upload:${context.user.id}:${clientIp(request)}`, 15, 60_000))) {
      return NextResponse.json({ error: 'Too many upload requests' }, { status: 429 })
    }

    const body = await request.json().catch(() => ({}))
    const fileName = typeof body.fileName === 'string' ? body.fileName : ''
    const contentType = typeof body.contentType === 'string' ? body.contentType.toLowerCase() : ''
    const size = body.size

    if (!fileName || fileName.length > 200) {
      return NextResponse.json({ error: 'Invalid upload' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json({ error: 'Only images and PDF uploads are allowed' }, { status: 400 })
    }
    if (!Number.isInteger(size) || size <= 0 || size > MAX_SIZE) {
      return NextResponse.json({ error: 'File must be between 1 byte and 5MB' }, { status: 400 })
    }
    if (!process.env.S3_BUCKET) {
      return NextResponse.json({ error: 'Object storage is not configured' }, { status: 503 })
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
    const objectKey = `uploads/${context.user.id}/${crypto.randomUUID()}-${safeName}`
    const uploadUrl = await createUploadUrl(objectKey, contentType)
    await db.insert(media).values({
      ownerId: context.user.id,
      objectKey,
      publicUrl: publicObjectUrl(objectKey),
      contentType,
      size,
    })
    return NextResponse.json({ uploadUrl, objectKey, publicUrl: publicObjectUrl(objectKey) })
  } catch (error) {
    return jsonError(error as Error)
  }
}
