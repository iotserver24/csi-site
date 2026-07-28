import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../../src/db/index'
import { coreMembers, users } from '../../../src/db/schema'
import { getCached, setCache } from '../../../src/lib/cache'

export async function GET() {
  try {
    const cached = await getCached<{ students: unknown[] }>('team')
    if (cached) return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'X-Cache': 'HIT' } })

    const members = await db.select({ user: users, core: coreMembers })
      .from(users).leftJoin(coreMembers, eq(users.email, coreMembers.email)).orderBy(desc(users.createdAt))
    const body = {
      students: members.map(({ user, core }) => ({
        ...user, id: user.firebaseUid, uid: user.firebaseUid, photoURL: user.photoUrl,
        role: core?.role || 'Member', roleName: core?.role || 'Member', isCoreMember: Boolean(core),
        permissions: core?.permissions || [], profile: { branch: user.branch || '', year: user.year || '', phone: user.phone || '', bio: user.bio || '' },
        imageSrc: user.photoUrl || '/default-avatar.svg',
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
