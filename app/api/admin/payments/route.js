import { NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { db } from '../../../../src/db/index.js'
import { payments } from '../../../../src/db/schema.js'
import { jsonError, requireRole, requireUser } from '../../../../src/lib/server-auth.js'

export async function GET(request) {
  try {
    const context = await requireUser(request); requireRole(context, ['admin'])
    return NextResponse.json({ payments: await db.select().from(payments).orderBy(desc(payments.createdAt)) })
  } catch (error) { return jsonError(error) }
}
