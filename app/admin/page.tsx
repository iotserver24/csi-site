'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '../../src/lib/api-client'
import { auth } from '../../src/lib/firebase-client'
import { useAuth } from '../../src/contexts/AuthContext'

type Tab = 'dashboard' | 'users' | 'events' | 'payments' | 'recruits' | 'core-members' | 'certificates'

interface Stats { users: number; events: number; payments: number; recruits: number }
interface UserRow { id: string; name?: string; email: string; photoURL?: string; role: string; createdAt: string; membershipStatus?: string; usn?: string; certificates?: CertificateEntry[] }
interface EventRow {
  id: string; title: string; date?: string; year?: number; type?: string; category?: string
  description?: string; location?: string; image?: string
  published: boolean; featured: boolean; registrationsAvailable?: boolean
  participantCount: number; capacity?: number | null; spotsLeft?: number | null
  time?: string; entryFee?: number; organizers?: string; teamSizeOptions?: number[] | null
  allowViewOtherTeams?: boolean; brief?: string; createdAt: string
}
interface PaymentRow { id: string; orderId: string; amount: string; currency: string; status: string; userId?: string; createdAt: string }
interface RecruitRow { id: string; name: string; email: string; phone?: string; branch?: string; year?: string; usn?: string; status: string; whyJoin?: string; createdAt: string }
interface CoreMemberRow { id: string; email: string; name?: string; role: string; position?: string; quote?: string; image?: string; usn?: string; level: number; createdAt: string }
interface CertificateEntry { title: string; date: string; issuer?: string; imageUrl?: string; eventName?: string; eventId?: string; usn?: string }

const emptyEventForm = () => ({
  id: '',
  title: '',
  description: '',
  date: '',
  year: '2026',
  type: 'INDIVIDUAL',
  category: 'UPCOMING',
  location: '',
  image: '',
  time: '',
  entryFee: '0',
  teamSizeOptions: '2,3,4',
  organizers: 'CSI NMAMIT',
  published: true,
  featured: false,
  registrationsAvailable: true,
  allowViewOtherTeams: false,
  capacity: '',
  brief: '',
})
interface CertUserRow { id: string; name?: string; email: string; usn?: string; certificates: CertificateEntry[] }
interface UploadResultRow {
  fileName: string; usn: string; status: string; userName?: string | null; error?: string; publicUrl?: string
}

const MAX_CERT_BYTES = 10 * 1024 * 1024

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
  const [coreMembers, setCoreMembers] = useState<CoreMemberRow[]>([])

  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [newRole, setNewRole] = useState('')

  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null)
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventForm, setEventForm] = useState(emptyEventForm)
  const [eventYearFilter, setEventYearFilter] = useState('all')
  const [eventSearch, setEventSearch] = useState('')

  const [certEventId, setCertEventId] = useState('')
  const [certEventSearch, setCertEventSearch] = useState('')

  const [recruitFilter, setRecruitFilter] = useState('all')

  const [editingCoreMember, setEditingCoreMember] = useState<CoreMemberRow | null>(null)
  const [showCoreMemberForm, setShowCoreMemberForm] = useState(false)
  const [coreMemberForm, setCoreMemberForm] = useState({ email: '', name: '', position: '', quote: '', image: '', usn: '', level: '10' })

  const [certEventName, setCertEventName] = useState('')
  const [certDate, setCertDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [certFiles, setCertFiles] = useState<File[]>([])
  const [certUploading, setCertUploading] = useState(false)
  const [certProgress, setCertProgress] = useState('')
  const [certResults, setCertResults] = useState<UploadResultRow[]>([])
  const [certUsers, setCertUsers] = useState<CertUserRow[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/admin/login'); return }
    if (user.role !== 'admin') { setError('You do not have admin access'); return }
    loadData()
  }, [loading, user, router])

  const loadData = async () => {
    try {
      const [s, u, e, p, r, cm, certs] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/admin/events'),
        api.get('/api/admin/payments').catch(() => ({ payments: [] })),
        api.get('/api/admin/recruits').catch(() => ({ recruits: [] })),
        api.get('/api/admin/core-members').catch(() => ({ coreMembers: [] })),
        api.get('/api/admin/certificates').catch(() => ({ users: [] })),
      ])
      setStats(s.stats as Stats)
      setUsers(u.users as UserRow[])
      setEvents(e.events as EventRow[])
      setPayments(p.payments as PaymentRow[])
      setRecruits(r.recruits as RecruitRow[])
      setCoreMembers((cm.coreMembers || []) as CoreMemberRow[])
      setCertUsers((certs.users || []) as CertUserRow[])
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to load data') }
  }

  const onCertFilesSelected = (list: FileList | null) => {
    if (!list) return
    const next: File[] = []
    const errors: string[] = []
    for (const f of Array.from(list)) {
      if (f.size > MAX_CERT_BYTES) {
        errors.push(`${f.name}: exceeds 10MB`)
        continue
      }
      const okType = f.type.startsWith('image/') || f.type === 'application/pdf'
      if (!okType) {
        errors.push(`${f.name}: only PNG/JPG/WEBP/PDF`)
        continue
      }
      next.push(f)
    }
    if (errors.length) alert(errors.slice(0, 8).join('\n') + (errors.length > 8 ? `\n…+${errors.length - 8} more` : ''))
    setCertFiles(next)
    setCertResults([])
  }

  const uploadCertificates = async () => {
    const linked = events.find(e => e.id === certEventId)
    const name = (linked?.title || certEventName).trim()
    if (!name) return alert('Select an event or type an event name')
    if (certFiles.length === 0) return alert('Select certificate files named like USN.png')
    const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null
    if (!token) return alert('Not signed in — refresh and try again')

    setCertUploading(true)
    setCertProgress(`Uploading ${certFiles.length} file(s) via server → R2…`)
    setCertResults([])
    try {
      const form = new FormData()
      form.append('eventName', name)
      if (certEventId) form.append('eventId', certEventId)
      form.append('date', certDate)
      form.append('issuer', 'CSI NMAMIT')
      for (const f of certFiles) form.append('files', f)

      const res = await fetch('/api/admin/certificates', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const body = await res.json().catch(() => ({})) as {
        error?: string
        assigned?: number
        skipped?: number
        results?: UploadResultRow[]
      }
      if (!res.ok) throw new Error(body.error || `Upload failed (${res.status})`)

      const results = body.results || []
      setCertResults(results)
      setCertFiles([])
      setCertProgress(`Done: ${body.assigned ?? 0} assigned, ${body.skipped ?? 0} skipped/issues`)

      const refreshed = await api.get('/api/admin/certificates').catch(() => ({ users: [] }))
      setCertUsers((refreshed.users || []) as CertUserRow[])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Certificate upload failed'
      alert(msg)
      setCertProgress(msg)
    } finally {
      setCertUploading(false)
    }
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

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const yearOk = eventYearFilter === 'all' || String(e.year) === eventYearFilter
      const q = eventSearch.toLowerCase()
      const searchOk = !q || e.title.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)
      return yearOk && searchOk
    })
  }, [events, eventYearFilter, eventSearch])

  const certEventOptions = useMemo(() => {
    const q = certEventSearch.toLowerCase()
    const list = [...events].sort((a, b) => (b.year || 0) - (a.year || 0))
    if (!q) return list.slice(0, 40)
    return list.filter(e => e.title.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || String(e.year).includes(q)).slice(0, 40)
  }, [events, certEventSearch])

  const downloadCsv = async (url: string, fallbackName: string) => {
    const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null
    if (!token) return alert('Not signed in')
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return alert((body as { error?: string }).error || 'Export failed')
    }
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = fallbackName
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const updateUserRole = async (userId: string, role: string) => {
    await api.patch(`/api/admin/users/${userId}`, { role, level: role === 'admin' ? 0 : role === 'coreMember' ? 10 : 99 })
    setEditingUser(null)
    loadData()
  }

  const toggleEventField = async (eventId: string, field: 'published' | 'featured' | 'registrationsAvailable', value: boolean) => {
    await api.put(`/api/admin/events/${eventId}`, { [field]: value })
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, [field]: value } : e))
  }

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Delete this event?')) return
    await api.delete(`/api/admin/events/${eventId}`)
    setEvents(prev => prev.filter(e => e.id !== eventId))
  }

  const saveEvent = async () => {
    if (!eventForm.title.trim()) return alert('Title is required')
    const payload = {
      id: eventForm.id.trim() || undefined,
      title: eventForm.title.trim(),
      description: eventForm.description,
      date: eventForm.date || null,
      year: Number(eventForm.year) || 2026,
      type: eventForm.type,
      category: eventForm.category,
      location: eventForm.location,
      image: eventForm.image,
      time: eventForm.time,
      entryFee: Number(eventForm.entryFee) || 0,
      teamSizeOptions: eventForm.teamSizeOptions,
      organizers: eventForm.organizers,
      published: eventForm.published,
      featured: eventForm.featured,
      registrationsAvailable: eventForm.registrationsAvailable,
      allowViewOtherTeams: eventForm.allowViewOtherTeams,
      capacity: eventForm.capacity === '' ? null : Number(eventForm.capacity),
      brief: eventForm.brief,
    }
    try {
      if (editingEvent) {
        await api.put(`/api/admin/events/${editingEvent.id}`, payload)
      } else {
        await api.post('/api/admin/events', payload)
      }
      setShowEventForm(false)
      setEditingEvent(null)
      setEventForm(emptyEventForm())
      loadData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save event')
    }
  }

  const updateRecruitStatus = async (recruitId: string, status: string) => {
    await api.patch(`/api/admin/recruits/${recruitId}`, { status })
    setRecruits(prev => prev.map(r => r.id === recruitId ? { ...r, status } : r))
  }

  const saveCoreMember = async () => {
    if (!coreMemberForm.email) return alert('Email required')
    const payload = { ...coreMemberForm, level: Number(coreMemberForm.level) }
    if (editingCoreMember) {
      await api.put(`/api/admin/core-members/${editingCoreMember.id}`, payload)
    } else {
      await api.post('/api/admin/core-members', payload)
    }
    setShowCoreMemberForm(false); setEditingCoreMember(null)
    setCoreMemberForm({ email: '', name: '', position: '', quote: '', image: '', usn: '', level: '10' })
    loadData()
  }

  const deleteCoreMember = async (id: string) => {
    if (!confirm('Remove this core member?')) return
    await api.delete(`/api/admin/core-members/${id}`)
    setCoreMembers(prev => prev.filter(c => c.id !== id))
  }

  const startEditCoreMember = (cm: CoreMemberRow) => {
    setEditingCoreMember(cm)
    setCoreMemberForm({ email: cm.email, name: cm.name || '', position: cm.position || '', quote: cm.quote || '', image: cm.image || '', usn: cm.usn || '', level: cm.level?.toString() || '10' })
    setShowCoreMemberForm(true)
  }

  const startEditEvent = (event: EventRow) => {
    setEditingEvent(event)
    let dateVal = ''
    if (event.date) {
      try {
        dateVal = new Date(event.date).toISOString().slice(0, 16)
      } catch { dateVal = '' }
    }
    setEventForm({
      id: event.id,
      title: event.title,
      description: event.description || '',
      date: dateVal,
      year: String(event.year || 2026),
      type: (event.type || 'INDIVIDUAL').toUpperCase(),
      category: event.category || 'UPCOMING',
      location: event.location || '',
      image: event.image || '',
      time: event.time || '',
      entryFee: String(event.entryFee ?? 0),
      teamSizeOptions: Array.isArray(event.teamSizeOptions) ? event.teamSizeOptions.join(',') : '2,3,4',
      organizers: event.organizers || 'CSI NMAMIT',
      published: event.published,
      featured: event.featured,
      registrationsAvailable: Boolean(event.registrationsAvailable),
      allowViewOtherTeams: Boolean(event.allowViewOtherTeams),
      capacity: event.capacity != null ? String(event.capacity) : '',
      brief: event.brief || '',
    })
    setShowEventForm(true)
  }

  if (loading) return <main className="min-h-[70vh] grid place-items-center bg-gray-950 text-white pt-24">Loading…</main>
  if (error) return <main className="min-h-[70vh] grid place-items-center bg-gray-950 text-red-400 pt-24">{error}</main>

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'users', label: 'Users', count: users.length },
    { key: 'events', label: 'Events', count: events.length },
    { key: 'payments', label: 'Payments', count: payments.length },
    { key: 'recruits', label: 'Recruits', count: recruits.length },
    { key: 'core-members', label: 'Core Members', count: coreMembers.length },
    { key: 'certificates', label: 'Certificates', count: certUsers.length },
  ]

  return (
    <main className="min-h-screen bg-gray-950 text-white pt-24 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <input value={eventSearch} onChange={e => setEventSearch(e.target.value)} placeholder="Search events…"
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm" />
                <select value={eventYearFilter} onChange={e => setEventYearFilter(e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm">
                  <option value="all">All years</option>
                  {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019].map(y => (
                    <option key={y} value={String(y)}>{y}–{String(y + 1).slice(2)}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => downloadCsv('/api/admin/events/export?type=events', 'csi-events.csv')}
                  className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm px-3 py-2 rounded-lg">Export CSV</button>
                <button type="button" onClick={() => { setEditingEvent(null); setEventForm(emptyEventForm()); setShowEventForm(true) }}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg">+ New Event (2026–27)</button>
              </div>
            </div>
            <p className="text-sm text-gray-400">{filteredEvents.length} shown · {events.length} total · public view works without login; apply requires login</p>

            {showEventForm && (
              <div className="rounded-xl bg-gray-900 border border-gray-800 p-5 space-y-3">
                <h3 className="font-semibold">{editingEvent ? 'Edit Event' : 'Create Event · 2026–27'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <input placeholder="Title *" value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm sm:col-span-2" />
                  <input placeholder="ID (auto if empty)" value={eventForm.id} onChange={e => setEventForm(f => ({ ...f, id: e.target.value }))} disabled={!!editingEvent}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm disabled:opacity-50 font-mono text-xs" />
                  <select value={eventForm.year} onChange={e => setEventForm(f => ({ ...f, year: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
                    {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019].map(y => <option key={y} value={y}>{y}–{String(y + 1).slice(2)}</option>)}
                  </select>
                  <input type="datetime-local" value={eventForm.date} onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                  <input placeholder="Display time (e.g. 2:00 PM)" value={eventForm.time} onChange={e => setEventForm(f => ({ ...f, time: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                  <input placeholder="Location / venue" value={eventForm.location} onChange={e => setEventForm(f => ({ ...f, location: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                  <select value={eventForm.type} onChange={e => setEventForm(f => ({ ...f, type: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="TEAM">Team</option>
                  </select>
                  <select value={eventForm.category} onChange={e => setEventForm(f => ({ ...f, category: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="PREVIOUS">PREVIOUS</option>
                  </select>
                  <input type="number" min={0} placeholder="Entry fee ₹" value={eventForm.entryFee} onChange={e => setEventForm(f => ({ ...f, entryFee: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                  <input type="number" min={1} placeholder="Capacity (blank = unlimited)" value={eventForm.capacity} onChange={e => setEventForm(f => ({ ...f, capacity: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                  {eventForm.type === 'TEAM' && (
                    <input placeholder="Team sizes e.g. 2,3,4" value={eventForm.teamSizeOptions} onChange={e => setEventForm(f => ({ ...f, teamSizeOptions: e.target.value }))}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                  )}
                  <input placeholder="Image URL" value={eventForm.image} onChange={e => setEventForm(f => ({ ...f, image: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm sm:col-span-2" />
                  <input placeholder="Organizers" value={eventForm.organizers} onChange={e => setEventForm(f => ({ ...f, organizers: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                </div>
                <textarea placeholder="Description" value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm h-24 resize-none" />
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={eventForm.published} onChange={e => setEventForm(f => ({ ...f, published: e.target.checked }))} className="rounded" /> Published (public)</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={eventForm.featured} onChange={e => setEventForm(f => ({ ...f, featured: e.target.checked }))} className="rounded" /> Featured</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={eventForm.registrationsAvailable} onChange={e => setEventForm(f => ({ ...f, registrationsAvailable: e.target.checked }))} className="rounded" /> Registrations open</label>
                  {eventForm.type === 'TEAM' && (
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={eventForm.allowViewOtherTeams} onChange={e => setEventForm(f => ({ ...f, allowViewOtherTeams: e.target.checked }))} className="rounded" /> Allow view other teams</label>
                  )}
                </div>
                <p className="text-xs text-gray-500">Users can browse without login. Applying requires Google login + complete profile. Team events use invite codes.</p>
                <div className="flex gap-2">
                  <button type="button" onClick={saveEvent} className="bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-2 rounded-lg">{editingEvent ? 'Update' : 'Create'}</button>
                  <button type="button" onClick={() => { setShowEventForm(false); setEditingEvent(null) }} className="bg-gray-700 hover:bg-gray-600 text-sm px-4 py-2 rounded-lg">Cancel</button>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-left text-gray-400">
                      <th className="px-4 py-3">Event</th>
                      <th className="px-4 py-3">Year</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Seats</th>
                      <th className="px-4 py-3">Regs</th>
                      <th className="px-4 py-3">Published</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredEvents.map(e => (
                      <tr key={e.id} className="hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{e.title}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{e.id}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{e.year || '—'}</td>
                        <td className="px-4 py-3 text-gray-400">{e.type || '—'}</td>
                        <td className="px-4 py-3 text-gray-300">
                          {e.participantCount || 0}
                          {e.capacity != null ? ` / ${e.capacity}` : ' / ∞'}
                          {e.spotsLeft != null && e.spotsLeft === 0 && <span className="ml-1 text-red-400 text-xs">full</span>}
                        </td>
                        <td className="px-4 py-3">
                          <button type="button" onClick={() => toggleEventField(e.id, 'registrationsAvailable', !e.registrationsAvailable)}
                            className={`text-xs px-2 py-1 rounded ${e.registrationsAvailable ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                            {e.registrationsAvailable ? 'Open' : 'Closed'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button type="button" onClick={() => toggleEventField(e.id, 'published', !e.published)}
                            className={`text-xs px-2 py-1 rounded ${e.published ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                            {e.published ? 'Live' : 'Draft'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => startEditEvent(e)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                            <button type="button" onClick={() => downloadCsv(`/api/admin/events/export?type=registrations&eventId=${encodeURIComponent(e.id)}`, `regs-${e.id}.csv`)}
                              className="text-xs text-yellow-400 hover:text-yellow-300">Export regs</button>
                            <button type="button" onClick={() => deleteEvent(e.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredEvents.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No events match. Create one for 2026–27.</td></tr>
                    )}
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

        {tab === 'core-members' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-400">{coreMembers.length} core members</p>
              <button onClick={() => { setEditingCoreMember(null); setCoreMemberForm({ email: '', name: '', position: '', quote: '', image: '', usn: '', level: '10' }); setShowCoreMemberForm(true) }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">+ Add Core Member</button>
            </div>
            {showCoreMemberForm && (
              <div className="rounded-xl bg-gray-900 border border-gray-800 p-5 space-y-3">
                <h3 className="font-semibold">{editingCoreMember ? 'Edit Core Member' : 'Add Core Member'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input placeholder="Email *" value={coreMemberForm.email} onChange={e => setCoreMemberForm(f => ({ ...f, email: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                  <input placeholder="Name" value={coreMemberForm.name} onChange={e => setCoreMemberForm(f => ({ ...f, name: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                  <input placeholder="Position (e.g. Technical Lead)" value={coreMemberForm.position} onChange={e => setCoreMemberForm(f => ({ ...f, position: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                  <input placeholder="USN" value={coreMemberForm.usn} onChange={e => setCoreMemberForm(f => ({ ...f, usn: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                  <input placeholder="Image URL" value={coreMemberForm.image} onChange={e => setCoreMemberForm(f => ({ ...f, image: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                  <select value={coreMemberForm.level} onChange={e => setCoreMemberForm(f => ({ ...f, level: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
                    <option value="0">Level 0 (Admin)</option>
                    <option value="10">Level 10 (Core)</option>
                    <option value="99">Level 99 (Member)</option>
                  </select>
                </div>
                <textarea placeholder="Quote" value={coreMemberForm.quote} onChange={e => setCoreMemberForm(f => ({ ...f, quote: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm h-20 resize-none" />
                <div className="flex gap-2">
                  <button onClick={saveCoreMember} className="bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-2 rounded-lg">{editingCoreMember ? 'Update' : 'Add'}</button>
                  <button onClick={() => { setShowCoreMemberForm(false); setEditingCoreMember(null) }} className="bg-gray-700 hover:bg-gray-600 text-sm px-4 py-2 rounded-lg">Cancel</button>
                </div>
              </div>
            )}
            <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-800 text-left text-gray-400">
                    <th className="px-4 py-3">Member</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Position</th><th className="px-4 py-3">Level</th><th className="px-4 py-3">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-800">
                    {coreMembers.map(cm => (
                      <tr key={cm.id} className="hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-medium">{cm.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-400">{cm.email}</td>
                        <td className="px-4 py-3 text-gray-400">{cm.position || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded ${cm.level === 0 ? 'bg-red-500/20 text-red-400' : cm.level === 10 ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>L{cm.level}</span>
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          <button onClick={() => startEditCoreMember(cm)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                          <button onClick={() => deleteCoreMember(cm.id)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                        </td>
                      </tr>
                    ))}
                    {coreMembers.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No core members</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'certificates' && (
          <div className="space-y-6">
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Bulk upload certificates</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Uploads go through the server to Cloudflare R2 as{' '}
                  <code className="text-blue-300">certificates/&#123;event&#125;/&#123;USN&#125;.ext</code>.
                  Name each file after the student USN (e.g. <code className="text-blue-300">4NM21CS001.png</code>). Max 10MB each.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs text-gray-400 block">Link to event (search + select) *</label>
                  <input
                    value={certEventSearch}
                    onChange={e => setCertEventSearch(e.target.value)}
                    placeholder="Search events by title or year…"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                  />
                  <select
                    value={certEventId}
                    onChange={e => {
                      const id = e.target.value
                      setCertEventId(id)
                      const ev = events.find(x => x.id === id)
                      if (ev) setCertEventName(ev.title)
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">— Select event —</option>
                    {certEventOptions.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        [{ev.year || '?'}] {ev.title}
                      </option>
                    ))}
                  </select>
                  <input
                    value={certEventName}
                    onChange={e => { setCertEventName(e.target.value); if (!e.target.value) setCertEventId('') }}
                    placeholder="Or type custom event name (if not in list)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                  />
                  {certEventId && (
                    <p className="text-xs text-green-400">Linked to event id: <code>{certEventId}</code></p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Certificate date</label>
                  <input
                    type="date"
                    value={certDate}
                    onChange={e => setCertDate(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Certificate files (multiple)</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                  multiple
                  onChange={e => onCertFilesSelected(e.target.files)}
                  className="w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:text-sm hover:file:bg-blue-500"
                />
                {certFiles.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">{certFiles.length} file(s) selected · total {(certFiles.reduce((s, f) => s + f.size, 0) / (1024 * 1024)).toFixed(1)} MB</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={uploadCertificates}
                  disabled={certUploading}
                  className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg"
                >
                  {certUploading ? 'Uploading…' : 'Upload & assign'}
                </button>
                {certProgress && <span className="text-sm text-gray-400">{certProgress}</span>}
              </div>
              {certResults.length > 0 && (
                <div className="rounded-lg border border-gray-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 text-left text-gray-400">
                        <th className="px-3 py-2">File</th>
                        <th className="px-3 py-2">USN</th>
                        <th className="px-3 py-2">User</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {certResults.map((r, i) => (
                        <tr key={`${r.fileName}-${i}`}>
                          <td className="px-3 py-2 font-mono text-xs truncate max-w-[180px]">{r.fileName}</td>
                          <td className="px-3 py-2 font-mono text-xs">{r.usn || '—'}</td>
                          <td className="px-3 py-2 text-gray-400">{r.userName || '—'}</td>
                          <td className="px-3 py-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              r.status === 'assigned' ? 'bg-green-500/20 text-green-400' :
                              r.status === 'uploaded_no_user' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>{r.status}{r.error ? `: ${r.error}` : ''}</span>
                            {r.publicUrl && (
                              <button type="button" onClick={() => setPreviewUrl(r.publicUrl!)} className="ml-2 text-xs text-blue-400 hover:underline">view</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800 flex justify-between items-center">
                <h3 className="font-semibold">Users with certificates ({certUsers.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-left text-gray-400">
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">USN</th>
                      <th className="px-4 py-3">Certificates</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {certUsers.map(cu => (
                      <tr key={cu.id} className="hover:bg-gray-800/50 align-top">
                        <td className="px-4 py-3">
                          <div className="font-medium">{cu.name || '—'}</div>
                          <div className="text-xs text-gray-500">{cu.email}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{cu.usn || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {(cu.certificates || []).map((c, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => c.imageUrl && setPreviewUrl(c.imageUrl)}
                                className="text-left rounded-lg border border-gray-700 bg-gray-800/60 px-2 py-1.5 max-w-[200px] hover:border-blue-500"
                              >
                                <div className="text-xs font-medium truncate">{c.title || c.eventName || 'Certificate'}</div>
                                <div className="text-[10px] text-gray-500">{c.date ? new Date(c.date).toLocaleDateString() : ''}</div>
                                {c.imageUrl && <div className="text-[10px] text-blue-400 mt-0.5">Open image</div>}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {certUsers.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-500">No certificates assigned yet. Upload a batch above.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {previewUrl && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewUrl(null)}>
                <div className="relative max-w-4xl w-full max-h-[90vh] bg-gray-900 rounded-xl border border-gray-700 overflow-auto" onClick={e => e.stopPropagation()}>
                  <button type="button" onClick={() => setPreviewUrl(null)} className="absolute top-3 right-3 text-sm text-gray-300 hover:text-white z-10 bg-black/50 px-2 py-1 rounded">Close</button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Certificate" className="w-full h-auto" />
                  <div className="p-3 text-center">
                    <a href={previewUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline">Open original</a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
