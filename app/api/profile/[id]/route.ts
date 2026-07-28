import { NextRequest, NextResponse } from 'next/server'
import { eq, desc, or } from 'drizzle-orm'
import { db } from '../../../../src/db/index'
import { users, eventRegistrations, events, roles } from '../../../../src/db/schema'
import { getCached, setCache } from '../../../../src/lib/cache'

const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cacheKey = `profile:${id}`
    const cached = await getCached<Record<string, unknown>>(cacheKey)
    if (cached) return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'X-Cache': 'HIT' } })

    const condition = isUUID(id)
      ? or(eq(users.id, id), eq(users.firebaseUid, id))
      : eq(users.firebaseUid, id)

    const profileRows = await db.select().from(users).where(condition).limit(1)
    const profile = profileRows[0]
    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const userRole = await db.select().from(roles).where(eq(roles.userId, profile.id)).limit(1)

    const registrations = await db.select({
      event: events,
      registration: eventRegistrations,
    }).from(eventRegistrations)
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .where(eq(eventRegistrations.userId, profile.id))
      .orderBy(desc(events.date))

    const body = {
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        photoURL: profile.photoUrl,
        bio: profile.bio,
        usn: profile.usn,
        branch: profile.branch,
        year: profile.year,
        college: profile.college,
        github: profile.github,
        linkedin: profile.linkedin,
        membershipStatus: profile.membershipStatus,
        certificates: profile.certificates || [],
        createdAt: profile.createdAt,
      },
      role: userRole[0]?.role || 'member',
      events: registrations.map(({ event, registration }) => ({
        id: event.id,
        title: event.title,
        date: event.date,
        type: event.type,
        category: event.category,
        image: event.image,
        registrationStatus: registration.status,
        teamName: registration.teamName,
      })),
    }

    await setCache(cacheKey, body, 30)

    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}
