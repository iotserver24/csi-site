import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '../../../../../../src/db/index'
import { eventRegistrations } from '../../../../../../src/db/schema'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const code = new URL(request.url).searchParams.get('code')
  if (!code) return NextResponse.json({ available: false }, { status: 400 })
  const rows = await db.select().from(eventRegistrations).where(and(eq(eventRegistrations.eventId, id), eq(eventRegistrations.registrationCode, code))).limit(1)
  return NextResponse.json({ available: rows.length === 0 })
}
