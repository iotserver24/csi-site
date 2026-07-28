import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '../../../src/db/index'
import { users } from '../../../src/db/schema'
import { jsonError, requireUser } from '../../../src/lib/server-auth'

const editableFields = ['name', 'phone', 'college', 'branch', 'year', 'bio', 'usn', 'github', 'linkedin', 'photoUrl']

export async function GET(request: NextRequest) {
  try {
    const context = await requireUser(request)
    return NextResponse.json({ user: { ...context.user, photoURL: context.user.photoUrl, role: context.role?.role || 'member', permissions: context.role?.permissions || [], profile: { phone: context.user.phone || '', college: context.user.college || 'NMAMIT', branch: context.user.branch || '', year: context.user.year || '', bio: context.user.bio || '' }, membership: { status: context.user.membershipStatus, type: context.user.membershipType, expiresAt: context.user.membershipExpiresAt } } })
  } catch (error) { return jsonError(error as Error) }
}

export async function PATCH(request: NextRequest) {
  try {
    const context = await requireUser(request)
    const input = await request.json()
    const profile = input.profile || {}
    const values = Object.fromEntries(editableFields
      .filter(field => input[field] !== undefined || profile[field] !== undefined)
      .map(field => [field, input[field] ?? profile[field] ?? null]))
    const [user] = await db.update(users).set({ ...values, updatedAt: new Date() }).where(eq(users.id, context.user.id)).returning()
    return NextResponse.json({ user: { ...user, photoURL: user.photoUrl } })
  } catch (error) { return jsonError(error as Error) }
}
