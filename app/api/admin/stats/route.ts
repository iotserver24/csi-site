import { NextRequest, NextResponse } from 'next/server'
import { count } from 'drizzle-orm'
import { db } from '../../../../src/db/index'
import { events, payments, users } from '../../../../src/db/schema'
import { jsonError, requireRole, requireUser } from '../../../../src/lib/server-auth'

export async function GET(request: NextRequest) {
  try {
    const context = await requireUser(request); requireRole(context, ['admin'])
    const [[userCount], [eventCount], [paymentCount]] = await Promise.all([
      db.select({ count: count() }).from(users), db.select({ count: count() }).from(events), db.select({ count: count() }).from(payments),
    ])
    return NextResponse.json({ stats: { users: userCount.count, events: eventCount.count, payments: paymentCount.count } })
  } catch (error) { return jsonError(error as Error) }
}
