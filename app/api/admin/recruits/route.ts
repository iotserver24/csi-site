import { NextRequest, NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { db } from '../../../../src/db/index'
import { recruits } from '../../../../src/db/schema'
import { jsonError, requireRole, requireUser } from '../../../../src/lib/server-auth'

export async function GET(request: NextRequest) {
  try {
    const context = await requireUser(request); requireRole(context, ['admin'])
    const rows = await db.select().from(recruits).orderBy(desc(recruits.createdAt))
    return NextResponse.json({ recruits: rows })
  } catch (error) { return jsonError(error as Error) }
}
