import { NextRequest, NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { db } from '../../../../src/db/index'
import { media, users } from '../../../../src/db/schema'
import { putObject, publicObjectUrl } from '../../../../src/lib/storage'
import { jsonError, requireRole, requireUser } from '../../../../src/lib/server-auth'
import { invalidateCache } from '../../../../src/lib/cache'

export const runtime = 'nodejs'

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'])

export type CertificateEntry = {
  title: string
  date: string
  issuer?: string
  imageUrl?: string
  eventName?: string
  usn?: string
  objectKey?: string
}

function normalizeUsn(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s_-]+/g, '')
}

function usnFromFileName(fileName: string): string {
  const base = fileName.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '')
  return normalizeUsn(base)
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'event'
}

function extFromContentType(contentType: string, fileName: string): string {
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('pdf')) return 'pdf'
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg'
  const m = fileName.match(/\.([a-zA-Z0-9]+)$/)
  return (m?.[1] || 'png').toLowerCase()
}

/**
 * Multipart bulk upload (server → R2). Avoids browser CORS failures on presigned R2 URLs.
 * Fields: eventName, date?, issuer?, files (multiple)
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireUser(request)
    requireRole(context, ['admin'])

    if (!process.env.S3_BUCKET) {
      return NextResponse.json({ error: 'Object storage is not configured' }, { status: 503 })
    }

    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({
        error: 'Send multipart/form-data with eventName and files (named {USN}.png). Direct browser→R2 is disabled to avoid CORS.',
      }, { status: 400 })
    }

    const form = await request.formData()
    const eventName = String(form.get('eventName') || '').trim()
    const issuer = String(form.get('issuer') || 'CSI NMAMIT').trim() || 'CSI NMAMIT'
    const date = String(form.get('date') || '').trim() || new Date().toISOString().slice(0, 10)

    if (!eventName || eventName.length < 2) {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 })
    }

    const rawFiles = form.getAll('files').filter((f): f is File => typeof File !== 'undefined' && f instanceof File)
    // Node/undici may give Blob-like File
    const files = rawFiles.length > 0
      ? rawFiles
      : form.getAll('files').filter((f): f is File => f != null && typeof f === 'object' && 'arrayBuffer' in f && 'name' in f) as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: 'At least one file is required (field name: files)' }, { status: 400 })
    }
    if (files.length > 200) {
      return NextResponse.json({ error: 'Max 200 files per batch' }, { status: 400 })
    }

    const eventSlug = slugify(eventName)
    const allUsers = await db.select().from(users)
    const byUsn = new Map<string, (typeof allUsers)[0]>()
    for (const u of allUsers) {
      if (u.usn) byUsn.set(normalizeUsn(u.usn), u)
    }

    type ResultRow = {
      fileName: string
      usn: string
      status: 'assigned' | 'uploaded_no_user' | 'invalid' | 'failed'
      userId?: string
      userName?: string | null
      publicUrl?: string
      objectKey?: string
      error?: string
    }
    const results: ResultRow[] = []
    let assigned = 0
    let skipped = 0

    for (const file of files) {
      const fileName = file.name || 'unknown'
      const mime = (file.type || '').toLowerCase() || 'application/octet-stream'
      const size = file.size

      if (!Number.isFinite(size) || size <= 0) {
        results.push({ fileName, usn: '', status: 'invalid', error: 'Empty file' })
        skipped++
        continue
      }
      if (size > MAX_SIZE) {
        results.push({ fileName, usn: usnFromFileName(fileName), status: 'invalid', error: 'File exceeds 10MB' })
        skipped++
        continue
      }
      if (!ALLOWED_TYPES.has(mime) && !mime.startsWith('image/')) {
        results.push({ fileName, usn: usnFromFileName(fileName), status: 'invalid', error: 'Only PNG, JPG, WEBP, or PDF allowed' })
        skipped++
        continue
      }

      const usn = usnFromFileName(fileName)
      if (!usn || usn.length < 3) {
        results.push({ fileName, usn, status: 'invalid', error: 'Filename must be {USN}.png/jpg' })
        skipped++
        continue
      }

      const matched = byUsn.get(usn)
      const ext = extFromContentType(mime, fileName)
      const objectKey = `certificates/${eventSlug}/${usn}.${ext}`
      const publicUrl = publicObjectUrl(objectKey)

      try {
        const buf = Buffer.from(await file.arrayBuffer())
        await putObject(objectKey, buf, mime || `image/${ext}`)

        await db.insert(media).values({
          ownerId: matched?.id || context.user.id,
          objectKey,
          publicUrl,
          contentType: mime,
          size,
        }).onConflictDoUpdate({
          target: media.objectKey,
          set: { publicUrl, contentType: mime, size, ownerId: matched?.id || context.user.id, updatedAt: new Date() },
        })

        if (!matched) {
          results.push({
            fileName, usn, status: 'uploaded_no_user', publicUrl, objectKey,
            error: 'No user with this USN — file stored on R2 but not assigned',
          })
          skipped++
          continue
        }

        const existing = (Array.isArray(matched.certificates) ? matched.certificates : []) as CertificateEntry[]
        const filtered = existing.filter(
          c => !(c.eventName === eventName && normalizeUsn(c.usn || '') === usn)
        )
        const entry: CertificateEntry = {
          title: eventName,
          date,
          issuer,
          imageUrl: publicUrl,
          eventName,
          usn,
          objectKey,
        }
        const next = [...filtered, entry]
        await db.update(users).set({ certificates: next, updatedAt: new Date() }).where(eq(users.id, matched.id))
        await invalidateCache(`profile:${matched.id}`)
        await invalidateCache(`profile:${matched.firebaseUid}`)
        matched.certificates = next

        assigned++
        results.push({
          fileName, usn, status: 'assigned',
          userId: matched.id,
          userName: matched.name || matched.email,
          publicUrl, objectKey,
        })
      } catch (err) {
        console.error('Certificate upload failed for', fileName, err)
        results.push({
          fileName, usn, status: 'failed',
          userName: matched?.name || matched?.email,
          error: err instanceof Error ? err.message : 'Upload failed',
        })
        skipped++
      }
    }

    return NextResponse.json({
      ok: true,
      eventName,
      eventSlug,
      assigned,
      skipped,
      results,
    })
  } catch (error) {
    return jsonError(error as Error)
  }
}

/** List users who have certificates (for admin overview). */
export async function GET(request: NextRequest) {
  try {
    const context = await requireUser(request)
    requireRole(context, ['admin'])

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        usn: users.usn,
        certificates: users.certificates,
      })
      .from(users)
      .where(sql`jsonb_array_length(COALESCE(${users.certificates}, '[]'::jsonb)) > 0`)
      .orderBy(users.name)

    return NextResponse.json({
      users: rows.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        usn: r.usn,
        certificates: r.certificates || [],
      })),
    })
  } catch (error) {
    return jsonError(error as Error)
  }
}
