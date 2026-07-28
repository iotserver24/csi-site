import { NextRequest, NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { db } from '../../../../src/db/index'
import { payments } from '../../../../src/db/schema'
import { jsonError, requireRole, requireUser } from '../../../../src/lib/server-auth'

export async function GET(request: NextRequest) {
  try {
    const context = await requireUser(request); requireRole(context, ['admin'])
    return NextResponse.json({ payments: await db.select().from(payments).orderBy(desc(payments.createdAt)) })
  } catch (error) { return jsonError(error as Error) }
}
