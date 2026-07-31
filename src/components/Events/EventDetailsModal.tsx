import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  X, Calendar, Clock, MapPin, DollarSign,
  User, AlertCircle, Share2, Copy, Loader,
  Users as TeamIcon, Hash, Plus, CheckCircle2
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { formatEventDate } from '../../utils/eventUtils'
import { toast } from 'sonner'
import { api } from '../../lib/api-client'
import type { Event } from '../../types'

interface UserTeam {
  teamName: string
  teamCode: string
  teamSize?: number
  members: Array<{ userId: string; name?: string; email?: string; role?: string; joinedAt?: Date }>
}

interface TeamRegistration {
  id?: string
  teamName: string
  teamCode?: string
  teamSize?: number
  members?: Array<{ userId: string; name?: string; email?: string; role?: string; joinedAt?: Date }>
  registrationCode?: string
  memberCount?: number
}

export type RegistrationUpdate = {
  eventId: string
  participantCount: number
  spotsLeft: number | null
  registered: boolean
}

interface Props {
  event: Event
  isOpen: boolean
  onClose: () => void
  onRegistered?: (update: RegistrationUpdate) => void
}

const EventDetailsModal = ({ event, isOpen, onClose, onRegistered }: Props) => {
  const { user, signInWithGoogle, isProfileIncomplete } = useAuth()
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [showJoinTeamForm, setShowJoinTeamForm] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamCode, setTeamCode] = useState('')
  const [teamSize, setTeamSize] = useState(2)
  const [loading, setLoading] = useState(false)
  const [checkingReg, setCheckingReg] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [userTeam, setUserTeam] = useState<UserTeam | null>(null)
  const [participantCount, setParticipantCount] = useState(event.participantCount || 0)
  const [spotsLeft, setSpotsLeft] = useState<number | null>(event.spotsLeft ?? null)
  const [showOtherTeams, setShowOtherTeams] = useState(false)
  const [otherTeams, setOtherTeams] = useState<TeamRegistration[]>([])
  const [otherTeamsLoading, setOtherTeamsLoading] = useState(false)
  const modalRef = useRef(null)

  const dbUserId = user?.id
  const matchesUser = (id?: string | null) => Boolean(id && (id === dbUserId || id === user?.uid))

  // Only reset registration UI when switching events — NOT when counts update after create/join
  useEffect(() => {
    setIsRegistered(false)
    setUserTeam(null)
    setShowTeamForm(false)
    setShowJoinTeamForm(false)
    setTeamName('')
    setTeamCode('')
  }, [event.id])

  // Keep capacity counters in sync with event props (separate from form reset above)
  useEffect(() => {
    setParticipantCount(event.participantCount || 0)
    setSpotsLeft(event.spotsLeft ?? (event.capacity != null ? Math.max(0, event.capacity - (event.participantCount || 0)) : null))
  }, [event.participantCount, event.spotsLeft, event.capacity])

  useEffect(() => {
    if (event && user && isOpen) void checkUserRegistration()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, user?.id, isOpen])

  // Deep link: /events?event=ID&code=TEAMCODE → prefill join form
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const code = (params.get('code') || params.get('teamCode') || '').trim().toUpperCase()
    if (code) {
      setTeamCode(code)
      setShowJoinTeamForm(true)
      setShowTeamForm(false)
    }
  }, [isOpen, event.id])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const applyCounts = (count?: number, left?: number | null) => {
    if (typeof count === 'number') setParticipantCount(count)
    if (left !== undefined) setSpotsLeft(left)
    if (typeof count === 'number') {
      onRegistered?.({
        eventId: event.id,
        participantCount: count,
        spotsLeft: left ?? (event.capacity != null ? Math.max(0, event.capacity - count) : null),
        registered: true,
      })
    }
  }

  const checkUserRegistration = async () => {
    if (!user) return
    setCheckingReg(true)
    try {
      const { registrations } = await api.get(`/api/events/${event.id}/registrations?mine=true`) as { registrations?: TeamRegistration[] }
      if (registrations?.length) {
        const registration = registrations[0]
        setIsRegistered(true)
        if (registration.teamName) {
          setUserTeam({
            teamName: registration.teamName,
            teamCode: registration.teamCode || registration.registrationCode || '',
            teamSize: registration.teamSize,
            members: registration.members || [],
          })
        }
      } else {
        setIsRegistered(false)
        setUserTeam(null)
      }
    } catch {
      /* ignore — user can still try register */
    } finally {
      setCheckingReg(false)
    }
  }

  const fetchOtherTeams = async () => {
    if (!event) return
    setOtherTeamsLoading(true)
    try {
      const { registrations } = await api.get(`/api/events/${event.id}/registrations?teams=true`) as { registrations?: TeamRegistration[] }
      setOtherTeams(registrations || [])
    } catch { setOtherTeams([]) }
    finally { setOtherTeamsLoading(false) }
  }

  const generateTeamCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
    return code
  }

  const generateUniqueTeamCode = async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateTeamCode()
      const { available } = await api.get(`/api/events/${event.id}/registrations/check-code?code=${code}`) as { available?: boolean }
      if (available) return code
    }
    return generateTeamCode()
  }

  const handleLogin = async () => {
    try {
      const result = await signInWithGoogle()
      if (result) toast.success('Successfully logged in!')
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code || ''
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return
      toast.error('Failed to login. Please try again.')
    }
  }

  const checkProfileComplete = () => {
    if (isProfileIncomplete) { toast.error('Please complete your profile before registering for events'); return false }
    return true
  }

  const handleIndividualRegistration = async () => {
    if (!user) { toast.error('Please login first'); return }
    if (isRegistered) { toast.message("You're already registered for this event"); return }
    if (!checkProfileComplete()) return
    if (!event.registrationsAvailable) { toast.error('Registrations are closed for this event'); return }
    if (spotsLeft === 0) { toast.error('Event is full'); return }
    setLoading(true)
    try {
      const body = await api.post(`/api/events/${event.id}/registrations`, { type: 'individual', name: user.name || user.email }) as {
        participantCount?: number
        spotsLeft?: number | null
      }
      setIsRegistered(true)
      applyCounts(body.participantCount ?? participantCount + 1, body.spotsLeft)
      toast.success("You're in! Registration confirmed.")
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to register. Please try again.'
      if (/already registered/i.test(message)) {
        setIsRegistered(true)
        toast.message("You're already registered for this event")
      } else {
        console.error('Registration error:', error)
        toast.error(message)
      }
    } finally { setLoading(false) }
  }

  const handleCreateTeam = async () => {
    if (!user) { toast.error('Please login first'); return }
    if (isRegistered) { toast.message("You're already registered for this event"); return }
    if (!teamName.trim()) { toast.error('Please enter a team name'); return }
    if (!checkProfileComplete()) return
    if (!event.registrationsAvailable) { toast.error('Registrations are closed for this event'); return }
    if (spotsLeft === 0) { toast.error('Event is full'); return }
    setLoading(true)
    try {
      const code = await generateUniqueTeamCode()
      const body = await api.post(`/api/events/${event.id}/registrations`, {
        type: 'team',
        teamName: teamName.trim(),
        teamCode: code,
        teamSize,
        name: user.name || user.email,
      }) as {
        participantCount?: number
        spotsLeft?: number | null
        registration?: {
          teamCode?: string
          registrationCode?: string
          teamName?: string
          members?: UserTeam['members']
          teamMembers?: UserTeam['members']
          teamSize?: number
          metadata?: { teamSize?: number }
        }
      }
      const reg = body.registration
      const finalCode = reg?.teamCode || reg?.registrationCode || code
      const members = reg?.members || reg?.teamMembers || [
        { userId: user.id || user.uid || '', name: user.name || undefined, email: user.email || undefined, role: 'leader' },
      ]
      const size = reg?.teamSize || reg?.metadata?.teamSize || teamSize
      setIsRegistered(true)
      setShowTeamForm(false)
      setShowJoinTeamForm(false)
      setUserTeam({
        teamName: reg?.teamName || teamName.trim(),
        teamCode: finalCode,
        teamSize: size,
        members,
      })
      applyCounts(body.participantCount ?? participantCount + 1, body.spotsLeft)
      toast.success('Team created! Share the invite link with teammates.')
      void checkUserRegistration()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create team. Please try again.'
      if (/already registered/i.test(message)) {
        setIsRegistered(true)
        toast.message("You're already registered for this event")
        void checkUserRegistration()
      } else {
        console.error('Team creation error:', error)
        toast.error(message)
      }
    } finally { setLoading(false) }
  }

  const handleJoinTeam = async () => {
    if (!teamCode.trim()) { toast.error('Please enter a team code'); return }
    if (isRegistered) { toast.message("You're already registered for this event"); return }
    if (!checkProfileComplete()) return
    if (!event.registrationsAvailable) { toast.error('Registrations are closed for this event'); return }
    setLoading(true)
    try {
      const { registration: teamData } = await api.get(`/api/events/${event.id}/registrations/team?code=${teamCode.trim().toUpperCase()}`) as { registration?: TeamRegistration }
      if (!teamData) { toast.error('Team code not found'); setLoading(false); return }
      const alreadyMember = teamData.members?.some((m: { userId: string }) => matchesUser(m.userId))
      if (alreadyMember) {
        setIsRegistered(true)
        setUserTeam({
          teamName: teamData.teamName,
          teamCode: teamData.teamCode || teamData.registrationCode || teamCode.trim().toUpperCase(),
          teamSize: teamData.teamSize,
          members: teamData.members || [],
        })
        toast.message("You're already a member of this team")
        setLoading(false)
        return
      }
      const maxSize = teamData.teamSize || 99
      if (teamData.members && teamData.members.length >= maxSize) { toast.error('This team is full'); setLoading(false); return }
      const body = await api.post(`/api/events/${event.id}/registrations`, { type: 'join', teamCode: teamCode.trim().toUpperCase() }) as {
        participantCount?: number
        spotsLeft?: number | null
        registration?: TeamRegistration
      }
      toast.success('Successfully joined the team!')
      setIsRegistered(true)
      setShowJoinTeamForm(false)
      setShowTeamForm(false)
      const joined = body.registration
      setUserTeam({
        teamName: joined?.teamName || teamData.teamName,
        teamCode: joined?.teamCode || joined?.registrationCode || teamData.teamCode || teamCode.trim().toUpperCase(),
        teamSize: joined?.teamSize || teamData.teamSize,
        members: joined?.members || [
          ...(teamData.members || []),
          { userId: user!.id || user!.uid || '', name: user!.name || undefined, email: user!.email || undefined, role: 'member', joinedAt: new Date() },
        ],
      })
      applyCounts(body.participantCount ?? participantCount + 1, body.spotsLeft)
      void checkUserRegistration()
    } catch (error: unknown) {
      console.error('Join team error:', error)
      let message = 'Failed to join team. Please try again.'
      if (error) {
        if (typeof error === 'object') message = (error as { message?: string; code?: string }).message || (error as { code?: string }).code || message
        else message = String(error)
      }
      if (/already registered|already a team member/i.test(message)) {
        setIsRegistered(true)
        void checkUserRegistration()
        toast.message("You're already registered for this event")
      } else {
        toast.error(message)
      }
    } finally { setLoading(false) }
  }

  const teamInviteUrl = (code: string) =>
    `${typeof window !== 'undefined' ? window.location.origin : ''}/events?event=${encodeURIComponent(event.id)}&code=${encodeURIComponent(code)}`

  const handleShare = async () => {
    const shareUrl = userTeam?.teamCode
      ? teamInviteUrl(userTeam.teamCode)
      : `${window.location.origin}/events?event=${event.id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: userTeam?.teamCode
            ? `Join my team "${userTeam.teamName}" for ${event.title}. Code: ${userTeam.teamCode}`
            : `Check out this event: ${event.title}`,
          url: shareUrl,
        })
        toast.success('Shared!')
      } catch (error: unknown) {
        if ((error as { name?: string })?.name !== 'AbortError') copyToClipboard(shareUrl, 'Link copied')
      }
    } else {
      copyToClipboard(shareUrl, userTeam?.teamCode ? 'Invite link copied' : 'Event link copied')
    }
  }

  const copyToClipboard = (text: string, message = 'Copied to clipboard') => {
    void navigator.clipboard.writeText(text)
    toast.success(message)
  }

  const shareTeamInvite = async () => {
    if (!userTeam?.teamCode) return
    const url = teamInviteUrl(userTeam.teamCode)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${userTeam.teamName}`,
          text: `Join team "${userTeam.teamName}" for ${event.title}. Invite code: ${userTeam.teamCode}`,
          url,
        })
        toast.success('Invite shared!')
        return
      } catch (error: unknown) {
        if ((error as { name?: string })?.name === 'AbortError') return
      }
    }
    copyToClipboard(url, 'Invite link copied — send it to teammates')
  }

  if (!isOpen || !event) return null

  const isTeamEvent = (event.type || '').toUpperCase() === 'TEAM'
  const seatsLabel =
    event.capacity != null
      ? `${participantCount} / ${event.capacity}${spotsLeft != null ? ` · ${spotsLeft} left` : ''}`
      : `${participantCount} registered`

  const teamSizeChoices = (() => {
    const raw = Array.isArray(event.teamSizeOptions) ? event.teamSizeOptions : [2, 3, 4]
    const nums = raw.map(Number).filter(n => Number.isFinite(n) && n >= 1 && n <= 20)
    const unique = [...new Set(nums.length ? nums : [2, 3, 4])].sort((a, b) => a - b)
    return unique
  })()

  return (
    <AnimatePresence>
      <div key={`event-modal-${event.id || 'unknown'}`} className="fixed inset-0 z-40 overflow-y-auto p-4 pt-20 md:pt-24">
        <motion.div
          key="event-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/40"
          onClick={onClose}
        />
        <motion.div
          key="event-modal-panel"
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative mx-auto max-w-5xl w-full max-h-[85vh] overflow-y-auto mt-4 rounded-2xl bg-white dark:bg-gray-900 shadow-2xl"
        >
          <div className="relative overflow-hidden rounded-t-2xl">
            <div className="relative h-32 md:h-36">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 px-6 pb-4 flex items-end justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white drop-shadow-sm">{event.title}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white ring-1 ring-white/30">
                      {event.type || 'EVENT'}
                    </span>
                    {event.category && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white ring-1 ring-white/20">
                        {event.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleShare} className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white transition" title="Share Event">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button onClick={onClose} className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white transition" title="Close">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="relative rounded-xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10">
                {event.image ? (
                  <Image src={event.image} alt={event.title} width={600} height={400} unoptimized className="w-full h-56 md:h-full object-cover" />
                ) : (
                  <div className="w-full h-56 md:h-full min-h-[14rem] flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <Image src="/csi-logo.png" alt="" width={64} height={64} className="opacity-40" />
                  </div>
                )}
                {!event.registrationsAvailable && (
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-semibold">Registrations Closed</div>
                )}
              </div>
              <div className="rounded-xl p-5 bg-gray-50 dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/5">
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { icon: Calendar, color: 'text-primary-500', label: 'Date', value: event.date ? formatEventDate(event.date) : 'N/A' },
                    { icon: Clock, color: 'text-purple-500', label: 'Time', value: event.time || 'N/A' },
                    { icon: MapPin, color: 'text-pink-500', label: 'Location', value: event.venue || event.location || 'N/A' },
                    { icon: DollarSign, color: 'text-emerald-500', label: 'Entry Fee', value: `₹${event.entryFee || 0}` },
                    {
                      icon: TeamIcon,
                      color: 'text-cyan-500',
                      label: event.capacity != null ? 'Seats' : 'Participants',
                      value: seatsLabel,
                    },
                  ].map(({ icon: Icon, color, label, value }, i) => (
                    <div key={`meta-${i}-${label}`} className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 ${color} mt-0.5`} />
                      <div>
                        <div className="text-sm text-gray-500">{label}</div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl p-5 bg-gray-50 dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/5">
              <h3 className="text-xl font-semibold mb-3">About the Event</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{event.description}</p>
              {event.brief && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">More Details</h4>
                  <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{event.brief}</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Organized By</h3>
              <p className="text-gray-600 dark:text-gray-400">{event.organizers || 'CSI NMAMIT'}</p>
            </div>

            {event.registrationsAvailable && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                {!user ? (
                  <div className="text-center space-y-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto" />
                    <p className="text-gray-600 dark:text-gray-400">Please login to register for this event</p>
                    <p className="text-sm text-gray-500">{participantCount} already in</p>
                    <button onClick={handleLogin} className="px-5 py-2 rounded-lg font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 transition">
                      Login with Google
                    </button>
                  </div>
                ) : isProfileIncomplete ? (
                  <div className="text-center space-y-4 bg-amber-50 dark:bg-gray-800 rounded-xl p-6">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                    <p className="text-gray-600 dark:text-gray-400">Please complete your profile to register for events</p>
                    <button onClick={() => { onClose(); window.location.href = '/profile' }} className="px-5 py-2 rounded-lg font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 transition">
                      Go to Profile
                    </button>
                  </div>
                ) : checkingReg ? (
                  <div className="flex justify-center py-4 text-gray-500">
                    <Loader className="w-5 h-5 animate-spin" />
                  </div>
                ) : isRegistered ? (
                  <div className="space-y-4 rounded-xl p-5 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-200 dark:ring-emerald-800/50">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-emerald-800 dark:text-emerald-300">You&apos;re registered</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                          {seatsLabel}. Create / Join is closed for you on this event.
                        </p>
                      </div>
                    </div>

                    {isTeamEvent && userTeam && (
                      <div className="rounded-xl bg-white dark:bg-gray-900/60 ring-1 ring-black/5 dark:ring-white/10 p-4 space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500">Your team</p>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <TeamIcon className="w-5 h-5 text-primary-500" />
                              {userTeam.teamName}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {(userTeam.members?.length || 0)} / {userTeam.teamSize || '—'} members
                            </p>
                          </div>
                          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                            <Hash className="w-4 h-4 text-primary-500" />
                            <span className="font-mono font-semibold tracking-wider">{userTeam.teamCode || '—'}</span>
                            {userTeam.teamCode ? (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(userTeam.teamCode, 'Team code copied')}
                                className="ml-1 text-primary-500 hover:text-primary-600"
                                title="Copy code"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {Array.isArray(userTeam.members) && userTeam.members.length > 0 && (
                          <ul className="space-y-2">
                            {userTeam.members.map((m, i) => (
                              <li
                                key={m.userId || `m-${i}`}
                                className="flex items-center justify-between text-sm rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800/80"
                              >
                                <span className="font-medium text-gray-800 dark:text-gray-100">
                                  {m.name || m.email || 'Member'}
                                </span>
                                <span className="text-xs uppercase tracking-wide text-gray-500">
                                  {m.role || 'member'}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {userTeam.teamCode && (
                          <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-500">
                              Send this link so teammates can open the event and join with your code pre-filled:
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                readOnly
                                value={teamInviteUrl(userTeam.teamCode)}
                                className="input-field text-xs font-mono flex-1 min-w-0"
                                onFocus={e => e.target.select()}
                              />
                              <button
                                type="button"
                                onClick={() => void shareTeamInvite()}
                                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 transition flex items-center justify-center gap-2 shrink-0"
                              >
                                <Share2 className="w-4 h-4" />
                                Copy invite link
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {event.allowViewOtherTeams && isTeamEvent && (
                      <button
                        type="button"
                        onClick={() => { setShowOtherTeams(true); fetchOtherTeams() }}
                        className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 ring-1 ring-black/5 dark:ring-white/10"
                      >
                        View other teams
                      </button>
                    )}
                  </div>
                ) : isTeamEvent ? (
                  <div className="space-y-4">
                    {!showTeamForm && !showJoinTeamForm && (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={() => setShowTeamForm(true)} className="flex-1 px-4 py-2.5 rounded-lg font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 transition flex items-center justify-center gap-2">
                          <Plus className="w-4 h-4" /> Create Team
                        </button>
                        <button onClick={() => setShowJoinTeamForm(true)} className="flex-1 px-4 py-2.5 rounded-lg font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2">
                          <TeamIcon className="w-4 h-4" /> Join Team
                        </button>
                      </div>
                    )}
                    <p className="text-center text-xs text-gray-500">{participantCount} participant{participantCount === 1 ? '' : 's'} so far</p>
                    {event.allowViewOtherTeams && (
                      <div>
                        <button onClick={() => { setShowOtherTeams(true); fetchOtherTeams() }} className="w-full px-4 py-2 rounded-lg font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2">
                          <TeamIcon className="w-4 h-4" /> View other teams
                        </button>
                      </div>
                    )}
                    {showTeamForm && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-4">
                        <h3 className="font-semibold">Create Your Team</h3>
                        <div>
                          <label className="block text-sm font-medium mb-2">Your name</label>
                          <input type="text" value={user?.name || user?.email || ''} readOnly className="input-field opacity-80" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Team Name</label>
                          <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="input-field" placeholder="Enter team name" />
                        </div>
                        <p className="text-xs text-gray-500">You will get an invite code and a shareable link for teammates.</p>
                        <div>
                          <label className="block text-sm font-medium mb-2">Team Size</label>
                          <select value={teamSize} onChange={(e) => setTeamSize(parseInt(e.target.value, 10))} className="input-field">
                            {teamSizeChoices.map(sz => (
                              <option key={`size-${sz}`} value={sz}>
                                {sz} {sz === 1 ? 'member' : 'members'}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={handleCreateTeam} disabled={loading} className="flex-1 px-4 py-2 rounded-lg font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 transition">
                            {loading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Create Team'}
                          </button>
                          <button onClick={() => { setShowTeamForm(false); setTeamName('') }} className="flex-1 px-4 py-2 rounded-lg font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition" disabled={loading}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {showJoinTeamForm && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-4">
                        <h3 className="font-semibold">Join a Team</h3>
                        <div>
                          <label className="block text-sm font-medium mb-2">Team Code</label>
                          <input type="text" value={teamCode} onChange={(e) => setTeamCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} className="input-field font-mono text-center text-lg" placeholder="TEAM CODE" maxLength={12} />
                        </div>
                        <div className="flex gap-3">
                          <button onClick={handleJoinTeam} disabled={loading} className="flex-1 px-4 py-2 rounded-lg font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 transition">
                            {loading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Join Team'}
                          </button>
                          <button onClick={() => { setShowJoinTeamForm(false); setTeamCode('') }} className="flex-1 px-4 py-2 rounded-lg font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition" disabled={loading}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <button
                      onClick={handleIndividualRegistration}
                      disabled={loading || spotsLeft === 0}
                      className="px-6 py-2.5 rounded-lg font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 transition disabled:opacity-50"
                    >
                      {loading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : <span className="flex items-center gap-2"><User className="w-4 h-4" /> Participate</span>}
                    </button>
                    <p className="text-xs text-gray-500">
                      {spotsLeft === 0 ? 'Event is full' : `${participantCount} registered${spotsLeft != null ? ` · ${spotsLeft} spots left` : ''}`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {!event.registrationsAvailable && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-6 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">Registrations are currently closed for this event</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {showOtherTeams && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Other Teams — {event.title}</h3>
              <button onClick={() => setShowOtherTeams(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><X size={18} /></button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {otherTeamsLoading ? (
                <div className="text-center text-gray-600 dark:text-gray-400">Loading...</div>
              ) : otherTeams.length === 0 ? (
                <div className="text-center text-gray-600 dark:text-gray-400">No teams to show.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2">Team Name</th>
                      <th className="py-2">Code</th>
                      <th className="py-2">Members</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherTeams.map((t, idx) => (
                      <tr
                        key={t.id || t.teamCode || t.registrationCode || `team-${idx}-${t.teamName || 'x'}`}
                        className="border-t border-gray-100 dark:border-gray-700"
                      >
                        <td className="py-2">{t.teamName || '-'}</td>
                        <td className="py-2 font-mono">{t.teamCode || '—'}</td>
                        <td className="py-2">
                          {typeof t.memberCount === 'number'
                            ? t.memberCount
                            : Array.isArray(t.members) ? t.members.length : 0}
                          /{t.teamSize || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default EventDetailsModal
