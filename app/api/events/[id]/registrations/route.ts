import { NextRequest, NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { db } from '../../../../../src/db/index'
import { eventRegistrations, events } from '../../../../../src/db/schema'
import { jsonError, requireUser } from '../../../../../src/lib/server-auth'
import { invalidateCache } from '../../../../../src/lib/cache'

type TeamMember = { userId: string; name?: string | null; email?: string | null; role?: string }

async function seatsTaken(eventId: string): Promise<number> {
  const rows = await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, eventId))
  let n = 0
  for (const row of rows) {
    const members = Array.isArray(row.teamMembers) ? (row.teamMembers as TeamMember[]) : []
    if (members.length > 0) n += members.length
    else n += 1
  }
  return n
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const context = await requireUser(request)
    const { searchParams } = new URL(request.url)
    const rows = await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, id))
    const registrations = searchParams.get('mine') === 'true'
      ? rows.filter(row => {
          if (row.userId === context.user.id) return true
          const members = Array.isArray(row.teamMembers) ? (row.teamMembers as TeamMember[]) : []
          return members.some(m => m.userId === context.user.id)
        })
      : searchParams.get('teams') === 'true'
        ? rows.filter(row => row.teamName)
        : rows
    return NextResponse.json({ registrations: registrations.map(presentRegistration) })
  } catch (error) {
    return jsonError(error as Error)
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params
    const context = await requireUser(request)
    const event = (await db.select().from(events).where(eq(events.id, eventId)).limit(1))[0]
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    if (!event.registrationsAvailable) return NextResponse.json({ error: 'Registrations are closed' }, { status: 400 })

    const input = await request.json()
    const displayName = String(input.name || context.user.name || '').trim() || context.user.email
    const meta = (event.metadata || {}) as { teamSizeOptions?: number[] }
    const eventType = (event.type || 'INDIVIDUAL').toUpperCase()

    const existing = await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, eventId))
    const already = existing.some(row => {
      if (row.userId === context.user.id) return true
      const members = Array.isArray(row.teamMembers) ? (row.teamMembers as TeamMember[]) : []
      return members.some(m => m.userId === context.user.id)
    })

    if (input.type === 'join') {
      if (eventType !== 'TEAM') return NextResponse.json({ error: 'Not a team event' }, { status: 400 })
      if (already) return NextResponse.json({ error: 'You are already registered for this event' }, { status: 409 })

      const code = String(input.teamCode || '').toUpperCase().trim()
      const team = existing.find(row => row.registrationCode === code && row.teamName)
      if (!team) return NextResponse.json({ error: 'Team code not found' }, { status: 404 })

      const members = Array.isArray(team.teamMembers) ? ([...team.teamMembers] as TeamMember[]) : []
      if (members.some(m => m.userId === context.user.id)) {
        return NextResponse.json({ error: 'Already a team member' }, { status: 409 })
      }
      const teamSize = Number((team.metadata as { teamSize?: number })?.teamSize || 2)
      if (members.length >= teamSize) return NextResponse.json({ error: 'This team is full' }, { status: 409 })

      if (event.capacity != null) {
        const taken = await seatsTaken(eventId)
        if (taken >= event.capacity) return NextResponse.json({ error: 'Event is full' }, { status: 409 })
      }

      const updated = [...members, { userId: context.user.id, name: displayName, email: context.user.email, role: 'member' }]
      const [registration] = await db
        .update(eventRegistrations)
        .set({ teamMembers: updated, updatedAt: new Date() })
        .where(eq(eventRegistrations.id, team.id))
        .returning()
      await db.update(events).set({ participantCount: sql`${events.participantCount} + 1`, updatedAt: new Date() }).where(eq(events.id, eventId))
      await invalidateCache('events:')
      return NextResponse.json({ registration: presentRegistration(registration) })
    }

    if (already) return NextResponse.json({ error: 'You are already registered for this event' }, { status: 409 })

    if (event.capacity != null) {
      const taken = await seatsTaken(eventId)
      if (taken >= event.capacity) return NextResponse.json({ error: 'Event is full' }, { status: 409 })
    }

    if (input.type === 'team') {
      if (eventType !== 'TEAM') return NextResponse.json({ error: 'Not a team event' }, { status: 400 })
      const teamName = String(input.teamName || '').trim()
      if (!teamName) return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
      let teamSize = Number(input.teamSize) || 2
      const allowed = meta.teamSizeOptions
      if (Array.isArray(allowed) && allowed.length && !allowed.map(Number).includes(teamSize)) {
        teamSize = Number(allowed[0]) || 2
      }
      const code = String(input.teamCode || cryptoRandom()).toUpperCase()

      const registration = {
        eventId,
        userId: context.user.id,
        email: context.user.email,
        registrationCode: code,
        teamName,
        teamLeader: context.user.id,
        teamMembers: [{ userId: context.user.id, name: displayName, email: context.user.email, role: 'leader' }],
        metadata: { teamSize, leaderName: displayName },
        status: 'registered',
      }
      const [created] = await db.insert(eventRegistrations).values(registration).returning()
      await db.update(events).set({ participantCount: sql`${events.participantCount} + 1`, updatedAt: new Date() }).where(eq(events.id, eventId))
      await invalidateCache('events:')
      return NextResponse.json({ registration: presentRegistration(created) }, { status: 201 })
    }

    if (eventType === 'TEAM') {
      return NextResponse.json({ error: 'This is a team event — create or join a team' }, { status: 400 })
    }

    const registration = {
      eventId,
      userId: context.user.id,
      email: context.user.email,
      registrationCode: `IND-${cryptoRandom()}`,
      teamName: null as string | null,
      teamLeader: null as string | null,
      teamMembers: [] as TeamMember[],
      metadata: { registrationType: 'individual', name: displayName },
      status: 'registered',
    }
    const [created] = await db.insert(eventRegistrations).values(registration).returning()
    await db.update(events).set({ participantCount: sql`${events.participantCount} + 1`, updatedAt: new Date() }).where(eq(events.id, eventId))
    await invalidateCache('events:')
    return NextResponse.json({ registration: presentRegistration(created) }, { status: 201 })
  } catch (error) {
    return jsonError(error as Error)
  }
}

const cryptoRandom = () => Math.random().toString(36).slice(2, 10).toUpperCase()

const presentRegistration = (row: {
  registrationCode: string
  teamMembers: unknown
  metadata: unknown
}) => ({
  ...row,
  teamCode: row.registrationCode,
  members: row.teamMembers,
  teamSize: (row.metadata as { teamSize?: number })?.teamSize,
})
