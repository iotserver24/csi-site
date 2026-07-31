import type { InferSelectModel } from 'drizzle-orm'
import type { users, roles } from '../db/schema'

export type DbUser = InferSelectModel<typeof users>
export type DbRole = InferSelectModel<typeof roles>

export interface AppUser extends DbUser {
  uid: string
  photoURL: string | null
  role: string
  roleName: string
  permissions: string[]
  profile: {
    phone: string
    college: string
    branch: string
    year: string
    bio: string
  }
  membership: {
    status: string
    type: string | null
    expiresAt: Date | null
  }
  events?: unknown[]
  participation?: unknown[]
  awards?: unknown[]
}

export interface ProfileData {
  name?: string
  email?: string
  username?: string
  phone?: string
  college?: string
  branch?: string
  year?: string
  bio?: string
  usn?: string
  github?: string
  linkedin?: string
  photoURL?: string
}

export interface AuthContextValue {
  user: AppUser | null
  loading: boolean
  authLoading: boolean
  isProfileIncomplete: boolean
  signInWithGoogle: () => Promise<import('firebase/auth').User | null>
  logout: () => Promise<void>
  updateUserProfile: (updates: ProfileData) => Promise<boolean>
  getUserData: () => Promise<AppUser | null>
  checkProfileCompletion: (data?: AppUser | null) => Promise<boolean>
  checkPermission: (permission: string) => boolean
  getUserRoleDisplay: () => string | null
  isUserCoreMember: () => boolean
}

export interface TeamMember {
  id: string
  name: string
  role: string
  usn: string
  branch: string
  year: string
  linkedin: string
  github: string
  imageSrc: string
  skills: string[]
  bio: string
  email: string
  phone?: string
  isCoreMember: boolean
  position?: string
  quote?: string
  roleDetails?: { position?: string }
}

export interface FacultyMember {
  name: string
  role: string
  department: string
  email: string
  linkedin: string
  image: string
}
