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
    const rows = await db.select().from(events).where(conditions).orderBy(desc(events.year), desc(events.date), desc(events.createdAt))
    const presented = rows.map(presentEvent)
    const body = { events: presented }

    if (!includeDrafts) await setCache(cacheKey, body, 30)

    return NextResponse.json(body, {
      headers: { 'Cache-Control': includeDrafts ? 'no-store' : 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (error) { return jsonError(error as Error) }
}

function presentEvent(row: typeof events.$inferSelect) {
  const meta = (row.metadata && typeof row.metadata === 'object' ? row.metadata : {}) as Record<string, unknown>
  const capacity = row.capacity
  const participantCount = row.participantCount || 0
  const spotsLeft = capacity != null ? Math.max(0, capacity - participantCount) : null
  return {
    ...row,
    venue: (meta.venue as string) || row.location || null,
    time: (meta.time as string) || null,
    entryFee: typeof meta.entryFee === 'number' ? meta.entryFee : Number(meta.entryFee) || 0,
    organizers: (meta.organizers as string) || 'CSI NMAMIT',
    brief: (meta.brief as string) || null,
    dateRaw: (meta.dateRaw as string) || null,
    teamSizeOptions: Array.isArray(meta.teamSizeOptions) ? meta.teamSizeOptions : null,
    allowViewOtherTeams: Boolean(meta.allowViewOtherTeams),
    spotsLeft,
  }
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
