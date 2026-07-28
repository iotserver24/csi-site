import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '../../../../../../src/db/index'
import { eventRegistrations } from '../../../../../../src/db/schema'
import { jsonError, requireUser } from '../../../../../../src/lib/server-auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireUser(request)
    const code = new URL(request.url).searchParams.get('code')
    if (!code) return NextResponse.json({ registration: null })
    const [registration] = await db.select().from(eventRegistrations).where(and(eq(eventRegistrations.eventId, id), eq(eventRegistrations.registrationCode, code))).limit(1)
    return NextResponse.json({ registration: registration ? { ...registration, teamCode: registration.registrationCode, members: registration.teamMembers, teamSize: (registration.metadata as { teamSize?: number })?.teamSize } : null })
  } catch (error) { return jsonError(error as Error) }
}
