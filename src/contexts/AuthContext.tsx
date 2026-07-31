'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase-client'
import { api } from '../lib/api-client'
import { toast } from 'sonner'
import { ALLOWED_EMAIL_MESSAGE, isAllowedCollegeEmail } from '../utils/allowedEmail'
import type { AppUser, ProfileData, AuthContextValue } from '../types'

const AuthContext = createContext<AuthContextValue | null>(null)
export const useAuth = () => useContext(AuthContext) as AuthContextValue

const isComplete = (user: AppUser | null) => ['name', 'phone', 'branch', 'year', 'usn']
  .every(field => String(user?.[field as keyof AppUser] || user?.profile?.[field as keyof AppUser['profile']] || '').trim())

/** Reject personal Gmail etc.; sign out Firebase session so they stay logged out. */
let lastDomainRejectAt = 0
async function rejectNonCollegeUser(firebaseUser: FirebaseUser): Promise<boolean> {
  if (isAllowedCollegeEmail(firebaseUser.email)) return false
  if (auth) await signOut(auth)
  // Popup + onAuthStateChanged can both fire; only toast once per attempt
  const now = Date.now()
  if (now - lastDomainRejectAt > 2000) {
    lastDomainRejectAt = now
    toast.error(ALLOWED_EMAIL_MESSAGE)
  }
  return true
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [authLoading, setAuthLoading] = useState<boolean>(false)
  const [isProfileIncomplete, setIsProfileIncomplete] = useState<boolean>(false)

  const syncUser = async (firebaseUser: FirebaseUser | null): Promise<AppUser | null> => {
    if (!firebaseUser) {
      setUser(null)
      setIsProfileIncomplete(false)
      return null
    }
    if (await rejectNonCollegeUser(firebaseUser)) {
      setUser(null)
      setIsProfileIncomplete(false)
      return null
    }
    const { user: appUser } = await api.post('/api/auth/me', {
      email: firebaseUser.email,
      name: firebaseUser.displayName,
      photoUrl: firebaseUser.photoURL,
    })
    setUser(appUser as AppUser)
    setIsProfileIncomplete(!isComplete(appUser as AppUser))
    return appUser as AppUser
  }

  const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
    setAuthLoading(true)
    try {
      if (!auth || !googleProvider) throw new Error('Firebase Auth is not configured')
      let result
      try {
        result = await signInWithPopup(auth, googleProvider)
      } catch {
        await signInWithRedirect(auth, googleProvider)
        return null
      }
      if (await rejectNonCollegeUser(result.user)) return null
      const appUser = await syncUser(result.user)
      if (!appUser) return null
      toast.success(`Welcome${appUser?.name ? `, ${appUser.name}` : ''}!`)
      return result.user
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed'
      if (message.includes('@nmamit.in') || message.includes('college')) {
        toast.error(ALLOWED_EMAIL_MESSAGE)
      } else {
        toast.error(message)
      }
      if (auth?.currentUser && !isAllowedCollegeEmail(auth.currentUser.email)) {
        await signOut(auth)
      }
      return null
    } finally {
      setAuthLoading(false)
    }
  }

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return undefined
    }
    let active = true
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (active) await syncUser(firebaseUser)
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    })
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user && active) {
          if (await rejectNonCollegeUser(result.user)) {
            setUser(null)
            return
          }
        }
      })
      .catch(() => {})
    return () => { active = false; unsubscribe() }
  }, [])

  const logout = async (): Promise<void> => {
    setAuthLoading(true)
    try {
      if (auth) await signOut(auth)
      setUser(null)
      toast.success('Signed out successfully')
    } finally {
      setAuthLoading(false)
    }
  }

  const updateUserProfile = async (updates: ProfileData): Promise<boolean> => {
    if (!auth?.currentUser) return false
    try {
      if (updates.name || updates.photoURL) {
        await updateProfile(auth.currentUser, {
          displayName: updates.name || auth.currentUser.displayName,
          photoURL: updates.photoURL || auth.currentUser.photoURL,
        })
      }
      const { user: updated } = await api.patch('/api/profile', updates as Record<string, unknown>)
      setUser(updated as AppUser)
      setIsProfileIncomplete(!isComplete(updated as AppUser))
      toast.success('Profile updated successfully')
      return true
    } catch {
      toast.error('Failed to update profile')
      return false
    }
  }

  const getUserData = async (): Promise<AppUser | null> => {
    try { return (await api.get('/api/profile')).user as AppUser } catch { return null }
  }
  const checkProfileCompletion = async (data: AppUser | null = user): Promise<boolean> => {
    const complete = isComplete(data)
    setIsProfileIncomplete(!complete)
    return complete
  }
  const checkPermission = (permission: string): boolean => user?.permissions?.includes('all') || user?.permissions?.includes(permission) || false
  const getUserRoleDisplay = (): string | null => user?.roleName || (user?.role === 'admin' ? 'Administrator' : user ? 'Member' : null)
  const isUserCoreMember = (): boolean => user?.role === 'coreMember'

  return (
    <AuthContext.Provider value={{
      user, loading, authLoading, isProfileIncomplete, signInWithGoogle, logout,
      updateUserProfile, getUserData, checkProfileCompletion, checkPermission,
      getUserRoleDisplay, isUserCoreMember,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
