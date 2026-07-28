'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../src/lib/api-client'
import { useAuth } from '../../src/contexts/AuthContext'

export default function AdminPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [stats, setStats] = useState<{ users?: number; events?: number; payments?: number } | null>(null)
  const [recentUsers, setRecentUsers] = useState<Array<{ id: string; name?: string; email: string; role?: string }>>([])
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/admin/login'); return }
    if (user.role !== 'admin') { setError('You do not have admin access'); return }
    Promise.all([api.get('/api/admin/stats'), api.get('/api/admin/users')])
      .then(([statsResult, usersResult]) => { setStats(statsResult.stats as { users?: number; events?: number; payments?: number }); setRecentUsers((usersResult.users as Array<{ id: string; name?: string; email: string; role?: string }>).slice(0, 8)) })
      .catch((err: Error) => setError(err.message))
  }, [loading, user, router])
  if (loading) return <main className="min-h-[70vh] grid place-items-center">Loading…</main>
  return <main className="min-h-[70vh] bg-gray-950 text-white px-6 py-24"><div className="max-w-7xl mx-auto"><div className="flex justify-between items-center mb-8"><div><p className="text-sm text-gray-400">CSI NMAMIT</p><h1 className="text-3xl font-bold">Admin dashboard</h1></div><a href="/" className="text-sm text-gray-400 hover:text-white">Back to site</a></div>{error ? <p className="text-red-400">{error}</p> : <><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">{[['Users', stats?.users], ['Events', stats?.events], ['Payments', stats?.payments]].map(([label, value]) => <div key={label as string} className="rounded-xl bg-gray-900 border border-gray-800 p-6"><p className="text-gray-400">{label}</p><p className="text-3xl font-bold mt-2">{value ?? '—'}</p></div>)}</div><div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden"><div className="px-6 py-4 border-b border-gray-800 font-semibold">Recent users</div><div className="divide-y divide-gray-800">{recentUsers.map(item => <div key={item.id} className="px-6 py-4 flex justify-between"><span>{item.name || item.email}</span><span className="text-gray-400">{item.role}</span></div>)}</div></div></>}</div></main>
}
