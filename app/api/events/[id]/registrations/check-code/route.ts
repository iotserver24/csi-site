import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '../../../../../../src/db/index'
import { eventRegistrations } from '../../../../../../src/db/schema'
import { clientIp, rateLimit } from '../../../../../../src/lib/rate-limit'
import { jsonError, requireUser } from '../../../../../../src/lib/server-auth'

/** Check whether a proposed team code is free for this event (authenticated + rate limited). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser(request)
    const { id } = await params
    if (!(await rateLimit(`check-code:${clientIp(request)}`, 30, 60_000))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const code = (new URL(request.url).searchParams.get('code') || '').trim().toUpperCase()
    if (!code || code.length > 32 || !/^[A-Z0-9-]+$/.test(code)) {
      return NextResponse.json({ available: false }, { status: 400 })
    }

    const rows = await db
      .select({ id: eventRegistrations.id })
      .from(eventRegistrations)
      .where(and(eq(eventRegistrations.eventId, id), eq(eventRegistrations.registrationCode, code)))
      .limit(1)

    return NextResponse.json({ available: rows.length === 0 })
  } catch (error) {
    return jsonError(error as Error)
  }
}
