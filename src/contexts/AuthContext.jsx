'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase-client'
import { api } from '../lib/api-client'
import { toast } from 'sonner'

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

const isComplete = user => ['name', 'phone', 'branch', 'year', 'usn']
  .every(field => String(user?.[field] || user?.profile?.[field] || '').trim())

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false)

  const syncUser = async firebaseUser => {
    if (!firebaseUser) {
      setUser(null)
      setIsProfileIncomplete(false)
      return null
    }
    const { user: appUser } = await api.post('/api/auth/me', {
      email: firebaseUser.email,
      name: firebaseUser.displayName,
      photoUrl: firebaseUser.photoURL,
    })
    setUser(appUser)
    setIsProfileIncomplete(!isComplete(appUser))
    return appUser
  }

  const signInWithGoogle = async () => {
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
      const appUser = await syncUser(result.user)
      toast.success(`Welcome${appUser?.name ? `, ${appUser.name}` : ''}!`)
      return result.user
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
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      try {
        if (active) await syncUser(firebaseUser)
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    })
    getRedirectResult(auth).catch(() => {})
    return () => { active = false; unsubscribe() }
  }, [])

  const logout = async () => {
    setAuthLoading(true)
    try {
      await signOut(auth)
      setUser(null)
      toast.success('Signed out successfully')
    } finally {
      setAuthLoading(false)
    }
  }

  const updateUserProfile = async updates => {
    if (!auth?.currentUser) return false
    try {
      if (updates.name || updates.photoURL) {
        await updateProfile(auth.currentUser, {
          displayName: updates.name || auth.currentUser.displayName,
          photoURL: updates.photoURL || auth.currentUser.photoURL,
        })
      }
      const { user: updated } = await api.patch('/api/profile', updates)
      setUser(updated)
      setIsProfileIncomplete(!isComplete(updated))
      toast.success('Profile updated successfully')
      return true
    } catch {
      toast.error('Failed to update profile')
      return false
    }
  }

  const getUserData = async () => {
    try { return (await api.get('/api/profile')).user } catch { return null }
  }
  const checkProfileCompletion = async (data = user) => {
    const complete = isComplete(data)
    setIsProfileIncomplete(!complete)
    return complete
  }
  const checkPermission = permission => user?.permissions?.includes('all') || user?.permissions?.includes(permission)
  const getUserRoleDisplay = () => user?.roleName || (user?.role === 'admin' ? 'Administrator' : user ? 'Member' : null)
  const isUserCoreMember = () => user?.role === 'coreMember'

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
