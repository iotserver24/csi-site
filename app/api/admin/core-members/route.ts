import { NextRequest, NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { db } from '../../../../src/db/index'
import { coreMembers } from '../../../../src/db/schema'
import { jsonError, requireRole, requireUser } from '../../../../src/lib/server-auth'

export async function GET(request: NextRequest) {
  try {
    const context = await requireUser(request); requireRole(context, ['admin'])
    const rows = await db.select().from(coreMembers).orderBy(desc(coreMembers.createdAt))
    return NextResponse.json({ coreMembers: rows })
  } catch (error) { return jsonError(error as Error) }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireUser(request); requireRole(context, ['admin'])
    const input = await request.json()
    if (!input.email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    const [row] = await db.insert(coreMembers).values({
      email: input.email,
      name: input.name || null,
      role: input.role || 'coreMember',
      position: input.position || null,
      quote: input.quote || null,
      image: input.image || null,
      usn: input.usn || null,
      level: input.level ?? 99,
      permissions: input.permissions || [],
    }).returning()
    return NextResponse.json({ coreMember: row }, { status: 201 })
  } catch (error) { return jsonError(error as Error) }
}
