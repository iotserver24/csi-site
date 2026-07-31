import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '../../../src/db/index'
import { users } from '../../../src/db/schema'
import { jsonError, requireUser } from '../../../src/lib/server-auth'
import { ensureUsername, isUsernameTaken } from '../../../src/lib/username'
import {
  isDefaultUsername,
  normalizeUsername,
  usernameFromUsn,
  validateUsername,
} from '../../../src/utils/username'
import { sanitizeProfilePatch } from '../../../src/utils/profileValidation'
import { invalidateCache } from '../../../src/lib/cache'
import { clientIp, rateLimit } from '../../../src/lib/rate-limit'

const editableFields = [
  'name',
  'phone',
  'college',
  'branch',
  'year',
  'bio',
  'usn',
  'github',
  'linkedin',
  'photoUrl',
  'username',
]

export async function GET(request: NextRequest) {
  try {
    const context = await requireUser(request)
    return NextResponse.json({
      user: {
        ...context.user,
        photoURL: context.user.photoUrl,
        username: context.user.username,
        role: context.role?.role || 'member',
        permissions: context.role?.permissions || [],
        profile: {
          phone: context.user.phone || '',
          college: context.user.college || 'NMAMIT',
          branch: context.user.branch || '',
          year: context.user.year || '',
          bio: context.user.bio || '',
        },
        membership: {
          status: context.user.membershipStatus,
          type: context.user.membershipType,
          expiresAt: context.user.membershipExpiresAt,
        },
      },
    })
  } catch (error) {
    return jsonError(error as Error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const context = await requireUser(request)
    if (!(await rateLimit(`profile:${context.user.id}:${clientIp(request)}`, 30, 60_000))) {
      return NextResponse.json({ error: 'Too many profile updates' }, { status: 429 })
    }

    const input = await request.json().catch(() => ({}))
    const profile = input.profile || {}
    let values = Object.fromEntries(
      editableFields
        .filter(field => input[field] !== undefined || profile[field] !== undefined)
        .map(field => [field, input[field] ?? profile[field] ?? null])
    ) as Record<string, unknown>

    try {
      values = sanitizeProfilePatch(values)
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 })
    }

    const usernameExplicit =
      input.username !== undefined || profile.username !== undefined

    if (usernameExplicit && values.username !== undefined && values.username !== null && values.username !== '') {
      const next = normalizeUsername(String(values.username))
      const err = validateUsername(next)
      if (err) return NextResponse.json({ error: err }, { status: 400 })
      if (await isUsernameTaken(next, context.user.id)) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })
      }
      values.username = next
    } else {
      // Default: username = USN when available (and handle is still default/empty)
      const nextUsn = String(values.usn ?? context.user.usn ?? '')
      const fromUsn = usernameFromUsn(nextUsn)
      if (
        fromUsn &&
        isDefaultUsername(context.user.username, {
          email: context.user.email,
          name: context.user.name,
          usn: context.user.usn,
        })
      ) {
        if (!(await isUsernameTaken(fromUsn, context.user.id))) {
          values.username = fromUsn
        }
      } else if (!context.user.username && !values.username) {
        // leave empty; ensureUsername after update fills it
        delete values.username
      }
    }

    let [user] = await db
      .update(users)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(users.id, context.user.id))
      .returning()

    // Prefer USN handle after save
    const username = await ensureUsername(user)
    if (username !== user.username) user = { ...user, username }

    // Bust public profile caches for old + new handles
    const handles = [context.user.username, user.username, user.firebaseUid, user.id].filter(Boolean)
    await Promise.all(handles.map(h => invalidateCache(`profile:${h}`)))

    return NextResponse.json({
      user: {
        ...user,
        uid: user.firebaseUid,
        photoURL: user.photoUrl,
        username: user.username,
        role: context.role?.role || 'member',
        permissions: context.role?.permissions || [],
        profile: {
          phone: user.phone || '',
          college: user.college || 'NMAMIT',
          branch: user.branch || '',
          year: user.year || '',
          bio: user.bio || '',
        },
        membership: {
          status: user.membershipStatus,
          type: user.membershipType,
          expiresAt: user.membershipExpiresAt,
        },
      },
    })
  } catch (error) {
    return jsonError(error as Error)
  }
}
