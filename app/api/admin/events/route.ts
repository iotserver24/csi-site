import { NextRequest, NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { db } from '../../../../src/db/index'
import { events } from '../../../../src/db/schema'
import { jsonError, requireRole, requireUser, AuthError } from '../../../../src/lib/server-auth'
import { invalidateCache } from '../../../../src/lib/cache'

function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64) || `event-${Date.now()}`
}

function parseTeamSizes(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return raw.map(Number).filter(n => Number.isFinite(n) && n >= 1 && n <= 20)
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(/[,\s]+/).map(Number).filter(n => Number.isFinite(n) && n >= 1 && n <= 20)
  }
  return [2, 3, 4]
}

export function normalizeEventInput(input: Record<string, unknown>, existingId?: string) {
  const title = String(input.title || '').trim()
  if (!title) throw new AuthError('Title is required', 400)

  const id = existingId || String(input.id || '').trim() || slugify(title)
  const dateStr = input.date ? String(input.date) : ''
  const date = dateStr ? new Date(dateStr) : null
  const year = Number(input.year) || (date && !Number.isNaN(date.getTime()) ? date.getFullYear() : 2026)
  const type = String(input.type || 'INDIVIDUAL').toUpperCase()
  const teamSizeOptions = type === 'TEAM' ? parseTeamSizes(input.teamSizeOptions) : null

  const metadata = {
    time: input.time ? String(input.time) : null,
    entryFee: Number(input.entryFee) || 0,
    organizers: input.organizers ? String(input.organizers) : 'CSI NMAMIT',
    teamSizeOptions,
    allowViewOtherTeams: Boolean(input.allowViewOtherTeams),
    dateRaw: dateStr || null,
    brief: input.brief ? String(input.brief) : null,
  }

  return {
    id,
    title,
    description: input.description ? String(input.description) : null,
    date: date && !Number.isNaN(date.getTime()) ? date : null,
    year,
    type,
    category: input.category ? String(input.category) : (year >= 2026 ? 'UPCOMING' : 'PREVIOUS'),
    location: input.location ? String(input.location) : null,
    image: input.image ? String(input.image) : null,
    published: Boolean(input.published),
    featured: Boolean(input.featured),
    registrationsAvailable: Boolean(input.registrationsAvailable),
    capacity: input.capacity !== '' && input.capacity != null && input.capacity !== undefined
      ? Number(input.capacity) || null
      : null,
    metadata,
    updatedAt: new Date(),
  }
}

export async function GET(request: NextRequest) {
  try {
    const context = await requireUser(request)
    requireRole(context, ['admin'])
    const rows = await db.select().from(events).orderBy(desc(events.year), desc(events.date), desc(events.createdAt))
    return NextResponse.json({
      events: rows.map(r => {
        const meta = (r.metadata || {}) as Record<string, unknown>
        return {
          ...r,
          time: meta.time || null,
          entryFee: meta.entryFee ?? 0,
          organizers: meta.organizers || 'CSI NMAMIT',
          teamSizeOptions: meta.teamSizeOptions || null,
          allowViewOtherTeams: Boolean(meta.allowViewOtherTeams),
          brief: meta.brief || null,
          spotsLeft: r.capacity != null ? Math.max(0, r.capacity - (r.participantCount || 0)) : null,
        }
      }),
    })
  } catch (error) {
    return jsonError(error as Error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireUser(request)
    requireRole(context, ['admin'])
    const input = await request.json()
    const row = normalizeEventInput(input)
    const [event] = await db
      .insert(events)
      .values({ ...row, participantCount: 0, contactPersons: [], createdAt: new Date() })
      .returning()
    await invalidateCache('events:')
    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    return jsonError(error as Error)
  }
}
