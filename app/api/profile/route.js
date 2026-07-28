import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '../../../src/db/index.js'
import { users } from '../../../src/db/schema.js'
import { jsonError, requireUser } from '../../../src/lib/server-auth.js'

const editableFields = ['name', 'phone', 'college', 'branch', 'year', 'bio', 'usn', 'github', 'linkedin']

export async function GET(request) {
  try {
    const context = await requireUser(request)
    return NextResponse.json({ user: context.user })
  } catch (error) { return jsonError(error) }
}

export async function PATCH(request) {
  try {
    const context = await requireUser(request)
    const input = await request.json()
    const profile = input.profile || {}
    const values = Object.fromEntries(editableFields
      .filter(field => input[field] !== undefined || profile[field] !== undefined)
      .map(field => [field, input[field] ?? profile[field] ?? null]))
    const [user] = await db.update(users).set({ ...values, updatedAt: new Date() }).where(eq(users.id, context.user.id)).returning()
    return NextResponse.json({ user })
  } catch (error) { return jsonError(error) }
}
