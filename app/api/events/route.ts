import { NextRequest, NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../../src/db/index'
import { events } from '../../../src/db/schema'
import { jsonError, requireRole, requireUser } from '../../../src/lib/server-auth'
import { getCached, setCache } from '../../../src/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDrafts = searchParams.get('includeDrafts') === 'true'
    if (includeDrafts) {
      const context = await requireUser(request)
      requireRole(context, ['admin', 'coreMember'])
    }

    const cacheKey = `events:${includeDrafts ? 'all' : 'published'}`
    if (!includeDrafts) {
      const cached = await getCached<{ events: typeof events.$inferSelect[] }>(cacheKey)
      if (cached) return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'X-Cache': 'HIT' } })
    }

    const conditions = includeDrafts ? undefined : eq(events.published, true)
    const rows = await db.select().from(events).where(conditions).orderBy(desc(events.createdAt))
    const body = { events: rows }

    if (!includeDrafts) await setCache(cacheKey, body, 30)

    return NextResponse.json(body, {
      headers: { 'Cache-Control': includeDrafts ? 'no-store' : 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (error) { return jsonError(error as Error) }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireUser(request)
    requireRole(context, ['admin', 'coreMember'])
    const input = await request.json()
    if (!input.id || !input.title) return NextResponse.json({ error: 'id and title are required' }, { status: 400 })
    const [event] = await db.insert(events).values({ ...input, id: input.id, title: input.title }).returning()
    return NextResponse.json({ event }, { status: 201 })
  } catch (error) { return jsonError(error as Error) }
}
