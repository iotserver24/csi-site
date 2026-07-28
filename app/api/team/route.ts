import { NextResponse } from 'next/server'
import { asc } from 'drizzle-orm'
import { db } from '../../../src/db/index'
import { coreMembers } from '../../../src/db/schema'
import { getCached, setCache } from '../../../src/lib/cache'

export async function GET() {
  try {
    const cached = await getCached<{ coreMembers: unknown[] }>('team')
    if (cached) return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'X-Cache': 'HIT' } })

    const members = await db.select().from(coreMembers).orderBy(asc(coreMembers.level))
    const body = {
      coreMembers: members.map(m => ({
        id: m.id,
        name: m.name || 'Unknown',
        email: m.email,
        usn: m.usn || '',
        role: m.role,
        position: m.position || m.role,
        quote: m.quote || '',
        image: m.image || '/default-avatar.svg',
        level: m.level,
        linkedin: '',
        github: '',
        branch: '',
        year: '',
        phone: '',
        bio: '',
        isCoreMember: true,
      })),
    }

    await setCache('team', body, 30)

    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to load team' }, { status: 500 })
  }
}
