'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Users, ArrowRight, Loader2, Ticket } from 'lucide-react'
import { getMyEvents, type MyEventItem } from '../../services/eventService'
import { formatEventDate } from '../../utils/eventUtils'

interface Props {
  onCountChange?: (count: number) => void
}

const MyEventsSection: React.FC<Props> = ({ onCountChange }) => {
  const [items, setItems] = useState<MyEventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyEvents()
      setItems(data.items)
      onCountChange?.(data.count)
    } catch (err) {
      setItems([])
      onCountChange?.(0)
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [onCountChange])

  useEffect(() => {
    void load()
  }, [load])

  const now = Date.now()
  const upcoming = items.filter(({ event }) => {
    if (event.registrationsAvailable) return true
    if (event.category === 'UPCOMING') return true
    if (!event.date) return true
    const t = event.date instanceof Date ? event.date.getTime() : Date.parse(String(event.date))
    return Number.isNaN(t) || t >= now - 86400000
  })
  const past = items.filter(i => !upcoming.includes(i))

  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-sky-500" />
            My events
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Events you applied to or are participating in
          </p>
        </div>
        <Link
          href="/events"
          className="text-sm font-medium text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 shrink-0"
        >
          Browse <ArrowRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-500 py-6 text-center">{error}</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 px-4 py-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            No applications yet. Open an event and hit Participate.
          </p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 text-sm font-semibold"
          >
            Find events <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <EventList title="Upcoming / applied" rows={upcoming} />
          )}
          {past.length > 0 && (
            <EventList title="Past" rows={past} muted />
          )}
        </div>
      )}
    </div>
  )
}

function EventList({
  title,
  rows,
  muted,
}: {
  title: string
  rows: MyEventItem[]
  muted?: boolean
}) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{title}</h4>
      <ul className="space-y-3">
        {rows.map(({ event, registration }) => (
          <li key={`${event.id}-${registration.id}`}>
            <Link
              href={`/events?event=${event.id}`}
              className={`flex gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3 hover:border-sky-400/40 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors ${muted ? 'opacity-80' : ''}`}
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                {event.image ? (
                  <Image src={event.image} alt="" fill unoptimized className="object-cover" sizes="64px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image src="/csi-logo.png" alt="" width={28} height={28} className="opacity-40" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{event.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                  <Calendar size={12} />
                  {event.date ? formatEventDate(String(event.date)) : event.year || 'TBA'}
                  {event.type ? ` · ${event.type}` : ''}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                  <Users size={12} />
                  {registration.status || 'registered'}
                  {registration.teamName ? ` · ${registration.teamName}` : ''}
                  {registration.role ? ` · ${registration.role}` : ''}
                  {typeof event.participantCount === 'number' ? ` · ${event.participantCount} in` : ''}
                </p>
              </div>
              <ArrowRight size={16} className="text-gray-300 dark:text-gray-600 self-center shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MyEventsSection
