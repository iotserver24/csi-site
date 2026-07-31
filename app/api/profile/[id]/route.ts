import { NextRequest, NextResponse } from 'next/server'
import { eq, desc, or } from 'drizzle-orm'
import { db } from '../../../../src/db/index'
import { users, eventRegistrations, events, roles } from '../../../../src/db/schema'
import { getCached, setCache } from '../../../../src/lib/cache'
import { normalizeUsername } from '../../../../src/utils/username'

const isUUID = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: raw } = await params
    const id = decodeURIComponent(raw || '').trim()
    if (!id) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const cacheKey = `profile:${id.toLowerCase()}`
    const cached = await getCached<Record<string, unknown>>(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'X-Cache': 'HIT',
        },
      })
    }

    // Prefer username (handle), then uuid / firebase uid for old links
    const handle = normalizeUsername(id)
    const condition = isUUID(id)
      ? or(eq(users.id, id), eq(users.firebaseUid, id), eq(users.username, handle))
      : or(eq(users.username, handle), eq(users.firebaseUid, id))

    const profileRows = await db.select().from(users).where(condition).limit(1)
    const profile = profileRows[0]
    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const userRole = await db.select().from(roles).where(eq(roles.userId, profile.id)).limit(1)

    const registrations = await db
      .select({
        event: events,
        registration: eventRegistrations,
      })
      .from(eventRegistrations)
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .where(eq(eventRegistrations.userId, profile.id))
      .orderBy(desc(events.date))

    const body = {
      user: {
        id: profile.id,
        username: profile.username,
        name: profile.name,
        // email intentionally omitted from public payload
        photoURL: profile.photoUrl,
        bio: profile.bio,
        usn: profile.usn,
        branch: profile.branch,
        year: profile.year,
        college: profile.college,
        github: profile.github,
        linkedin: profile.linkedin,
        membershipStatus: profile.membershipStatus,
        membershipType: profile.membershipType,
        membershipExpiresAt: profile.membershipExpiresAt,
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
    if (profile.username) await setCache(`profile:${profile.username}`, body, 30)

    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}
