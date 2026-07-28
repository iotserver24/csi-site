import { NextRequest, NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../../../../src/db/index'
import { eventRegistrations, events, users } from '../../../../../src/db/schema'
import { jsonError, requireRole, requireUser } from '../../../../../src/lib/server-auth'

function csvEscape(value: unknown): string {
  const s = value == null ? '' : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.join(',')]
  for (const row of rows) lines.push(row.map(csvEscape).join(','))
  return lines.join('\n')
}

/** Export events list or registrations. ?type=events|registrations&eventId= */
export async function GET(request: NextRequest) {
  try {
    const context = await requireUser(request)
    requireRole(context, ['admin'])
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'events'
    const eventId = searchParams.get('eventId')

    if (type === 'registrations') {
      if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 })
      const event = (await db.select().from(events).where(eq(events.id, eventId)).limit(1))[0]
      if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

      const rows = await db
        .select({ reg: eventRegistrations, user: users })
        .from(eventRegistrations)
        .leftJoin(users, eq(eventRegistrations.userId, users.id))
        .where(eq(eventRegistrations.eventId, eventId))

      const headers = [
        'registration_id', 'event_id', 'event_title', 'user_name', 'user_email', 'user_usn',
        'team_name', 'team_code', 'team_leader', 'team_members', 'status', 'registered_at',
      ]
      const data = rows.map(({ reg, user }) => {
        const members = Array.isArray(reg.teamMembers) ? reg.teamMembers : []
        return [
          reg.id,
          event.id,
          event.title,
          user?.name || '',
          user?.email || reg.email || '',
          user?.usn || '',
          reg.teamName || '',
          reg.registrationCode || '',
          reg.teamLeader || '',
          JSON.stringify(members),
          reg.status,
          reg.createdAt instanceof Date ? reg.createdAt.toISOString() : reg.createdAt,
        ]
      })
      const csv = toCsv(headers, data)
      const filename = `registrations-${eventId}-${new Date().toISOString().slice(0, 10)}.csv`
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    const rows = await db.select().from(events).orderBy(desc(events.year), desc(events.date))
    const headers = [
      'id', 'title', 'year', 'date', 'type', 'category', 'location', 'image',
      'published', 'featured', 'registrations_open', 'capacity', 'registered', 'spots_left',
      'entry_fee', 'time', 'organizers',
    ]
    const data = rows.map(e => {
      const meta = (e.metadata || {}) as Record<string, unknown>
      const spots = e.capacity != null ? Math.max(0, e.capacity - (e.participantCount || 0)) : ''
      return [
        e.id, e.title, e.year,
        e.date instanceof Date ? e.date.toISOString() : e.date,
        e.type, e.category, e.location, e.image,
        e.published, e.featured, e.registrationsAvailable, e.capacity ?? '', e.participantCount,
        spots, meta.entryFee ?? 0, meta.time || '', meta.organizers || '',
      ]
    })
    const csv = toCsv(headers, data)
    const filename = `csi-events-${new Date().toISOString().slice(0, 10)}.csv`
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return jsonError(error as Error)
  }
}
