'use client'

import { useAuth } from '../../../src/contexts/AuthContext'

export default function AdminLogin() {
  const { user, signInWithGoogle, authLoading } = useAuth()
  return (
    <main className="min-h-[70vh] grid place-items-center px-6 pt-24 pb-10">
      <div className="max-w-md w-full rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Admin access</h1>
        <p className="text-gray-500 mb-6">Sign in with your Firebase account. Postgres controls admin permissions.</p>
        {user?.role === 'admin' ? <a className="btn-primary inline-block" href="/admin">Open dashboard</a> : <button className="btn-primary" onClick={signInWithGoogle} disabled={authLoading}>{authLoading ? 'Signing in…' : 'Sign in with Google'}</button>}
      </div>
    </main>
  )
}
