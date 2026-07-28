import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '../../../../../../src/db/index.js'
import { eventRegistrations } from '../../../../../../src/db/schema.js'
import { jsonError, requireUser } from '../../../../../../src/lib/server-auth.js'

export async function GET(request, { params }) {
  try {
    await requireUser(request)
    const code = new URL(request.url).searchParams.get('code')
    const [registration] = await db.select().from(eventRegistrations).where(and(eq(eventRegistrations.eventId, params.id), eq(eventRegistrations.registrationCode, code))).limit(1)
    return NextResponse.json({ registration: registration ? { ...registration, teamCode: registration.registrationCode, members: registration.teamMembers, teamSize: registration.metadata?.teamSize } : null })
  } catch (error) { return jsonError(error) }
}
