import { NextRequest, NextResponse } from 'next/server'
import { desc, eq, or, sql } from 'drizzle-orm'
import { db } from '../../../../src/db/index'
import { eventRegistrations, events } from '../../../../src/db/schema'
import { jsonError, requireUser } from '../../../../src/lib/server-auth'

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
    teamSizeOptions: Array.isArray(meta.teamSizeOptions) ? meta.teamSizeOptions : null,
    allowViewOtherTeams: Boolean(meta.allowViewOtherTeams),
    spotsLeft,
  }
}

export async function GET(request: NextRequest) {
  try {
    const context = await requireUser(request)
    const userId = context.user.id

    const rows = await db
      .select({
        registration: eventRegistrations,
        event: events,
      })
      .from(eventRegistrations)
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .where(
        or(
          eq(eventRegistrations.userId, userId),
          sql`EXISTS (
            SELECT 1
            FROM jsonb_array_elements(COALESCE(${eventRegistrations.teamMembers}::jsonb, '[]'::jsonb)) AS m
            WHERE m->>'userId' = ${userId}
          )`
        )
      )
      .orderBy(desc(eventRegistrations.createdAt))

    const items = rows.map(({ registration, event }) => {
      const members = Array.isArray(registration.teamMembers)
        ? (registration.teamMembers as Array<{ userId?: string; role?: string }>)
        : []
      const myRole =
        registration.userId === userId && registration.teamLeader === userId
          ? 'leader'
          : members.find(m => m.userId === userId)?.role ||
            (registration.userId === userId ? 'registrant' : 'member')

      return {
        event: presentEvent(event),
        registration: {
          id: registration.id,
          status: registration.status,
          registrationCode: registration.registrationCode,
          teamCode: registration.registrationCode,
          teamName: registration.teamName,
          teamLeader: registration.teamLeader,
          teamMembers: registration.teamMembers,
          members: registration.teamMembers,
          teamSize: (registration.metadata as { teamSize?: number } | null)?.teamSize ?? null,
          role: myRole,
          createdAt: registration.createdAt,
        },
      }
    })

    return NextResponse.json({
      count: items.length,
      items,
      events: items.map(i => i.event),
    })
  } catch (error) {
    return jsonError(error as Error)
  }
}
