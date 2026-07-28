import { NextRequest, NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../../../src/db/index'
import { roles, users } from '../../../../src/db/schema'
import { jsonError, requireRole, requireUser } from '../../../../src/lib/server-auth'

export async function GET(request: NextRequest) {
  try {
    const context = await requireUser(request); requireRole(context, ['admin'])
    const rows = await db.select({ user: users, role: roles }).from(users).leftJoin(roles, eq(users.id, roles.userId)).orderBy(desc(users.createdAt))
    const byId = new Map<string, { user: typeof users.$inferSelect; roles: Array<{ role: string; permissions: unknown; level: number }> }>()
    for (const { user, role } of rows) {
      const existing = byId.get(user.id)
      if (existing) { if (role) existing.roles.push({ role: role.role, permissions: role.permissions, level: role.level }) }
      else byId.set(user.id, { user, roles: role ? [{ role: role.role, permissions: role.permissions, level: role.level }] : [] })
    }
    const result = [...byId.values()].map(({ user, roles: userRoles }) => {
      const primary = userRoles.find(r => r.level === Math.min(...userRoles.map(r => r.level))) || userRoles[0]
      return { ...user, uid: user.firebaseUid, photoURL: user.photoUrl, role: primary?.role || 'member', permissions: primary?.permissions || [], allRoles: userRoles.map(r => r.role) }
    })
    return NextResponse.json({ users: result })
  } catch (error) { return jsonError(error as Error) }
}
