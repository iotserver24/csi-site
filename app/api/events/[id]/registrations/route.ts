import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '../../../../../src/db/index'
import { eventRegistrations, events } from '../../../../../src/db/schema'
import { jsonError, requireUser } from '../../../../../src/lib/server-auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const context = await requireUser(request)
    const { searchParams } = new URL(request.url)
    const rows = await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, id))
    const registrations = searchParams.get('mine') === 'true'
      ? rows.filter(row => row.userId === context.user.id)
      : searchParams.get('teams') === 'true'
        ? rows.filter(row => row.teamName)
        : rows
    return NextResponse.json({ registrations: registrations.map(presentRegistration) })
  } catch (error) { return jsonError(error as Error) }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params
    const context = await requireUser(request)
    const event = (await db.select().from(events).where(eq(events.id, eventId)).limit(1))[0]
    if (!event || !event.registrationsAvailable) return NextResponse.json({ error: 'Registrations are closed' }, { status: 400 })
    const input = await request.json()
    if (input.type === 'join') {
      const team = (await db.select().from(eventRegistrations).where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.registrationCode, input.teamCode)))).find(row => row.teamName)
      if (!team) return NextResponse.json({ error: 'Team code not found' }, { status: 404 })
      const members = Array.isArray(team.teamMembers) ? team.teamMembers : []
      if (members.some(member => member.userId === context.user.id)) return NextResponse.json({ error: 'Already a team member' }, { status: 409 })
      if (team.teamMembers && members.length >= Number((team.metadata as { teamSize?: number })?.teamSize || 2)) return NextResponse.json({ error: 'Team is full' }, { status: 409 })
      const updated = [...members, { userId: context.user.id, name: context.user.name, email: context.user.email, role: 'member' }]
    const [registration] = await db.update(eventRegistrations).set({ teamMembers: updated, updatedAt: new Date() }).where(eq(eventRegistrations.id, team.id)).returning()
    return NextResponse.json({ registration: presentRegistration(registration as Parameters<typeof presentRegistration>[0]) })
    }
    const registration = {
      eventId, userId: context.user.id, email: context.user.email,
      registrationCode: input.teamCode || `IND-${cryptoRandom()}`,
      teamName: input.type === 'team' ? input.teamName : null,
      teamLeader: input.type === 'team' ? context.user.id : null,
      teamMembers: input.type === 'team' ? [{ userId: context.user.id, name: context.user.name, email: context.user.email, role: 'leader' }] : [],
      metadata: input.type === 'team' ? { teamSize: input.teamSize || 2 } : { registrationType: 'individual' },
    }
    const [created] = await db.insert(eventRegistrations).values(registration).returning()
    return NextResponse.json({ registration: presentRegistration(created as Parameters<typeof presentRegistration>[0]) }, { status: 201 })
  } catch (error) { return jsonError(error as Error) }
}

const cryptoRandom = () => Math.random().toString(36).slice(2, 10).toUpperCase()
const presentRegistration = (row: { registrationCode: string; teamMembers: unknown; metadata: unknown }) => ({ ...row, teamCode: row.registrationCode, members: row.teamMembers, teamSize: (row.metadata as { teamSize?: number })?.teamSize })
