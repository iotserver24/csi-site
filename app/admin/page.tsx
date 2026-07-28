'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '../../src/lib/api-client'
import { useAuth } from '../../src/contexts/AuthContext'

type Tab = 'dashboard' | 'users' | 'events' | 'payments' | 'recruits'

interface Stats { users: number; events: number; payments: number; recruits: number }
interface UserRow { id: string; name?: string; email: string; photoURL?: string; role: string; createdAt: string; membershipStatus?: string }
interface EventRow { id: string; title: string; date?: string; type?: string; category?: string; published: boolean; featured: boolean; participantCount: number; capacity?: number; createdAt: string }
interface PaymentRow { id: string; orderId: string; amount: string; currency: string; status: string; userId?: string; createdAt: string }
interface RecruitRow { id: string; name: string; email: string; phone?: string; branch?: string; year?: string; usn?: string; status: string; whyJoin?: string; createdAt: string }

export default function AdminPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [error, setError] = useState<string | null>(null)

  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [recruits, setRecruits] = useState<RecruitRow[]>([])

  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [newRole, setNewRole] = useState('')

  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null)
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventForm, setEventForm] = useState({ id: '', title: '', description: '', date: '', type: '', category: '', location: '', image: '', published: false, featured: false, capacity: '' })

  const [recruitFilter, setRecruitFilter] = useState('all')

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/admin/login'); return }
    if (user.role !== 'admin') { setError('You do not have admin access'); return }
    loadData()
  }, [loading, user, router])

  const loadData = async () => {
    try {
      const [s, u, e, p, r] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/admin/events'),
        api.get('/api/admin/payments').catch(() => ({ payments: [] })),
        api.get('/api/admin/recruits').catch(() => ({ recruits: [] })),
      ])
      setStats(s.stats as Stats)
      setUsers(u.users as UserRow[])
      setEvents(e.events as EventRow[])
      setPayments(p.payments as PaymentRow[])
      setRecruits(r.recruits as RecruitRow[])
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to load data') }
  }

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = !userSearch || u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
      const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter
      return matchSearch && matchRole
    })
  }, [users, userSearch, userRoleFilter])

  const filteredRecruits = useMemo(() => {
    return recruits.filter(r => recruitFilter === 'all' || r.status === recruitFilter)
  }, [recruits, recruitFilter])

  const updateUserRole = async (userId: string, role: string) => {
    await api.patch(`/api/admin/users/${userId}`, { role, level: role === 'admin' ? 0 : role === 'coreMember' ? 10 : 99 })
    setEditingUser(null)
    loadData()
  }

  const toggleEventField = async (eventId: string, field: 'published' | 'featured', value: boolean) => {
    await api.put(`/api/admin/events/${eventId}`, { [field]: value })
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, [field]: value } : e))
  }

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Delete this event?')) return
    await api.delete(`/api/admin/events/${eventId}`)
    setEvents(prev => prev.filter(e => e.id !== eventId))
  }

  const saveEvent = async () => {
    const payload = { ...eventForm, capacity: eventForm.capacity ? Number(eventForm.capacity) : null }
    if (editingEvent) {
      await api.put(`/api/admin/events/${editingEvent.id}`, payload)
    } else {
      if (!payload.id || !payload.title) return alert('ID and title required')
      await api.post('/api/admin/events', payload)
    }
    setShowEventForm(false); setEditingEvent(null)
    setEventForm({ id: '', title: '', description: '', date: '', type: '', category: '', location: '', image: '', published: false, featured: false, capacity: '' })
    loadData()
  }

  const updateRecruitStatus = async (recruitId: string, status: string) => {
    await api.patch(`/api/admin/recruits/${recruitId}`, { status })
    setRecruits(prev => prev.map(r => r.id === recruitId ? { ...r, status } : r))
  }

  const startEditEvent = (event: EventRow) => {
    setEditingEvent(event)
    setEventForm({
      id: event.id, title: event.title, description: '', date: event.date ? new Date(event.date).toISOString().slice(0, 16) : '',
      type: event.type || '', category: event.category || '', location: '', image: '',
      published: event.published, featured: event.featured, capacity: event.capacity?.toString() || ''
    })
    setShowEventForm(true)
  }

  if (loading) return <main className="min-h-[70vh] grid place-items-center bg-gray-950 text-white">Loading…</main>
  if (error) return <main className="min-h-[70vh] grid place-items-center bg-gray-950 text-red-400">{error}</main>

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'users', label: 'Users', count: users.length },
    { key: 'events', label: 'Events', count: events.length },
    { key: 'payments', label: 'Payments', count: payments.length },
    { key: 'recruits', label: 'Recruits', count: recruits.length },
  ]

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <p className="text-sm text-gray-400">CSI NMAMIT</p>
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <Link href="/" className="text-sm text-gray-400 hover:text-white">← Back to site</Link>
        </div>

        <div className="flex gap-1 border-b border-gray-800 mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${tab === t.key ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}>
              {t.label}{t.count !== undefined ? ` (${t.count})` : ''}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Users', value: stats.users, color: 'text-blue-400' },
                { label: 'Events', value: stats.events, color: 'text-green-400' },
                { label: 'Payments', value: stats.payments, color: 'text-yellow-400' },
                { label: 'Recruits', value: recruits.length, color: 'text-purple-400' },
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-gray-900 border border-gray-800 p-5">
                  <p className="text-gray-400 text-sm">{s.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
                <h3 className="font-semibold mb-3">Recent Users</h3>
                <div className="space-y-2">
                  {users.slice(0, 5).map(u => (
                    <div key={u.id} className="flex justify-between text-sm">
                      <span className="truncate">{u.name || u.email}</span>
                      <span className="text-gray-400 ml-2 shrink-0">{u.role}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
                <h3 className="font-semibold mb-3">Recent Events</h3>
                <div className="space-y-2">
                  {events.slice(0, 5).map(e => (
                    <div key={e.id} className="flex justify-between text-sm">
                      <span className="truncate">{e.title}</span>
                      <span className={`ml-2 shrink-0 ${e.published ? 'text-green-400' : 'text-gray-500'}`}>{e.published ? 'Live' : 'Draft'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search by name or email…"
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
              <select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500">
                <option value="all">All roles</option>
                <option value="admin">Admin</option>
                <option value="coreMember">Core Member</option>
                <option value="member">Member</option>
              </select>
            </div>
            <p className="text-sm text-gray-400">{filteredUsers.length} users</p>
            <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-800 text-left text-gray-400">
                    <th className="px-4 py-3">User</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-medium">{u.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-400">{u.email}</td>
                        <td className="px-4 py-3">
                          {editingUser === u.id ? (
                            <div className="flex gap-2">
                              <select value={newRole} onChange={e => setNewRole(e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs">
                                <option value="member">member</option><option value="coreMember">coreMember</option><option value="admin">admin</option>
                              </select>
                              <button onClick={() => updateUserRole(u.id, newRole)} className="text-xs text-green-400 hover:text-green-300">Save</button>
                              <button onClick={() => setEditingUser(null)} className="text-xs text-gray-400 hover:text-white">Cancel</button>
                            </div>
                          ) : (
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              u.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                              u.role === 'coreMember' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-gray-700 text-gray-300'
                            }`}>{u.role}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400">{u.membershipStatus || 'inactive'}</td>
                        <td className="px-4 py-3">
                          {editingUser !== u.id && (
                            <button onClick={() => { setEditingUser(u.id); setNewRole(u.role) }}
                              className="text-xs text-blue-400 hover:text-blue-300">Edit role</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'events' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-400">{events.length} events</p>
              <button onClick={() => { setEditingEvent(null); setEventForm({ id: '', title: '', description: '', date: '', type: '', category: '', location: '', image: '', published: false, featured: false, capacity: '' }); setShowEventForm(true) }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">+ New Event</button>
            </div>
            {showEventForm && (
              <div className="rounded-xl bg-gray-900 border border-gray-800 p-5 space-y-3">
                <h3 className="font-semibold">{editingEvent ? 'Edit Event' : 'Create Event'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input placeholder="Event ID (slug)" value={eventForm.id} onChange={e => setEventForm(f => ({ ...f, id: e.target.value }))} disabled={!!editingEvent}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm disabled:opacity-50" />
                  <input placeholder="Title" value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                  <input type="datetime-local" value={eventForm.date} onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                  <input placeholder="Type (workshop/hackathon/etc)" value={eventForm.type} onChange={e => setEventForm(f => ({ ...f, type: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                  <input placeholder="Category" value={eventForm.category} onChange={e => setEventForm(f => ({ ...f, category: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                  <input placeholder="Location" value={eventForm.location} onChange={e => setEventForm(f => ({ ...f, location: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                  <input placeholder="Image URL" value={eventForm.image} onChange={e => setEventForm(f => ({ ...f, image: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                  <input type="number" placeholder="Capacity" value={eventForm.capacity} onChange={e => setEventForm(f => ({ ...f, capacity: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                </div>
                <textarea placeholder="Description" value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm h-24 resize-none" />
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={eventForm.published} onChange={e => setEventForm(f => ({ ...f, published: e.target.checked }))} className="rounded" /> Published</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={eventForm.featured} onChange={e => setEventForm(f => ({ ...f, featured: e.target.checked }))} className="rounded" /> Featured</label>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEvent} className="bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-2 rounded-lg">{editingEvent ? 'Update' : 'Create'}</button>
                  <button onClick={() => { setShowEventForm(false); setEditingEvent(null) }} className="bg-gray-700 hover:bg-gray-600 text-sm px-4 py-2 rounded-lg">Cancel</button>
                </div>
              </div>
            )}
            <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-800 text-left text-gray-400">
                    <th className="px-4 py-3">Event</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Published</th><th className="px-4 py-3">Featured</th><th className="px-4 py-3">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-800">
                    {events.map(e => (
                      <tr key={e.id} className="hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-medium">{e.title}</td>
                        <td className="px-4 py-3 text-gray-400">{e.date ? new Date(e.date).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-3 text-gray-400">{e.type || '—'}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleEventField(e.id, 'published', !e.published)}
                            className={`text-xs px-2 py-1 rounded ${e.published ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                            {e.published ? 'Live' : 'Draft'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleEventField(e.id, 'featured', !e.featured)}
                            className={`text-xs px-2 py-1 rounded ${e.featured ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>
                            {e.featured ? '★' : '☆'}
                          </button>
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          <button onClick={() => startEditEvent(e)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                          <button onClick={() => deleteEvent(e.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'payments' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">{payments.length} payments</p>
            <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-800 text-left text-gray-400">
                    <th className="px-4 py-3">Order ID</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-800">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-mono text-xs">{p.orderId}</td>
                        <td className="px-4 py-3">₹{p.amount}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded ${p.status === 'captured' ? 'bg-green-500/20 text-green-400' : p.status === 'refunded' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>{p.status}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {payments.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No payments yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'recruits' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <p className="text-sm text-gray-400">{filteredRecruits.length} recruits</p>
              <select value={recruitFilter} onChange={e => setRecruitFilter(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500">
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-800 text-left text-gray-400">
                    <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Branch</th><th className="px-4 py-3">Year</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredRecruits.map(r => (
                      <tr key={r.id} className="hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-medium">{r.name}</td>
                        <td className="px-4 py-3 text-gray-400">{r.email}</td>
                        <td className="px-4 py-3 text-gray-400">{r.branch || '—'}</td>
                        <td className="px-4 py-3 text-gray-400">{r.year || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded ${
                            r.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                            r.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>{r.status}</span>
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          {r.status === 'pending' && (<>
                            <button onClick={() => updateRecruitStatus(r.id, 'approved')} className="text-xs text-green-400 hover:text-green-300">Approve</button>
                            <button onClick={() => updateRecruitStatus(r.id, 'rejected')} className="text-xs text-red-400 hover:text-red-300">Reject</button>
                          </>)}
                        </td>
                      </tr>
                    ))}
                    {filteredRecruits.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No recruits</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
