import { NextResponse } from 'next/server'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../../src/db/index.js'
import { events } from '../../../src/db/schema.js'
import { jsonError, requireRole, requireUser } from '../../../src/lib/server-auth.js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDrafts = searchParams.get('includeDrafts') === 'true'
    if (includeDrafts) {
      const context = await requireUser(request)
      requireRole(context, ['admin', 'coreMember'])
    }
    const conditions = includeDrafts ? undefined : eq(events.published, true)
    const rows = await db.select().from(events).where(conditions).orderBy(desc(events.createdAt))
    return NextResponse.json({ events: rows })
  } catch (error) { return jsonError(error) }
}

export async function POST(request) {
  try {
    const context = await requireUser(request)
    requireRole(context, ['admin', 'coreMember'])
    const input = await request.json()
    if (!input.id || !input.title) return NextResponse.json({ error: 'id and title are required' }, { status: 400 })
    const [event] = await db.insert(events).values({ ...input, id: input.id, title: input.title }).returning()
    return NextResponse.json({ event }, { status: 201 })
  } catch (error) { return jsonError(error) }
}
