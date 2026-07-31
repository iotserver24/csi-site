'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { ArrowRight, Calendar, Sparkles, Users } from 'lucide-react'
import { api } from '../../lib/api-client'
import type { Event } from '../../types'
import { formatEventDate } from '../../utils/eventUtils'

function pickUpcoming(events: Event[]): Event[] {
  const now = Date.now()
  const scored = events
    .filter(e => e.published !== false)
    .map(e => {
      const year = Number(e.year || String(e.date || '').slice(0, 4)) || 0
      const t = e.date
        ? e.date instanceof Date
          ? e.date.getTime()
          : Date.parse(String(e.date))
        : NaN
      const created = e.createdAt
        ? e.createdAt instanceof Date
          ? e.createdAt.getTime()
          : Date.parse(String(e.createdAt))
        : 0
      const isFutureOrOpen =
        e.category === 'UPCOMING' ||
        e.registrationsAvailable === true ||
        e.featured === true ||
        year >= new Date().getFullYear() ||
        (!Number.isNaN(t) && t >= now - 86400000) ||
        // Newly added published events (last 60 days) always surface
        (created > 0 && now - created < 60 * 86400000)
      return {
        e,
        upcoming: isFutureOrOpen,
        t: Number.isNaN(t) ? year * 1e12 : t,
        year,
        created,
        open: e.registrationsAvailable ? 1 : 0,
        featured: e.featured ? 1 : 0,
      }
    })
    .filter(x => x.upcoming)
    // Open regs + featured first, then soonest date, then newest
    .sort(
      (a, b) =>
        b.open - a.open ||
        b.featured - a.featured ||
        a.t - b.t ||
        b.created - a.created ||
        b.year - a.year
    )

  return scored.slice(0, 6).map(x => x.e)
}

const Skeleton = () => (
  <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden animate-pulse">
    <div className="aspect-[16/10] bg-gray-100 dark:bg-white/5" />
    <div className="p-5 space-y-3">
      <div className="h-3 w-16 rounded bg-gray-100 dark:bg-white/10" />
      <div className="h-4 w-3/4 rounded bg-gray-100 dark:bg-white/10" />
    </div>
  </div>
)

const UpcomingEvents: React.FC = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.08 })
  const [items, setItems] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api
      .get('/api/events')
      .then(body => {
        if (cancelled) return
        const rows = Array.isArray(body.events) ? (body.events as Event[]) : []
        setItems(pickUpcoming(rows))
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section
      className="relative py-12 sm:py-24 bg-zinc-50 dark:bg-[#05060a] text-gray-900 dark:text-white border-t border-gray-100 dark:border-white/5 overflow-x-hidden"
      ref={ref}
    >
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
        >
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400/90 mb-3">
              // live feed
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight">
              What’s next
            </h2>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-gray-500 dark:text-white/50 hover:text-sky-600 dark:hover:text-sky-300 transition-colors"
          >
            view_all <ArrowRight size={14} />
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 dark:border-white/15 bg-white dark:bg-white/[0.02] px-6 py-14 text-center">
            <Sparkles className="mx-auto mb-3 text-sky-500" size={22} />
            <p className="font-display text-xl font-bold mb-2">Queue is warming up</p>
            <p className="text-sm text-gray-500 dark:text-white/45 mb-6 max-w-md mx-auto">
              New events land here as soon as they are published. Browse the full archive while the season loads.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-950 px-5 py-2.5 text-sm font-bold"
            >
              Open events
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 18 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.06 * index }}
              >
                <Link
                  href={`/events?event=${event.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-sky-400/50 dark:hover:border-sky-400/40 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-white/5">
                    {event.image ? (
                      <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image src="/csi-logo.png" alt="" width={40} height={40} className="opacity-30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {event.type && (
                        <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded-md bg-black/60 text-sky-100 border border-white/10">
                          {event.type}
                        </span>
                      )}
                      {event.registrationsAvailable && (
                        <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded-md bg-emerald-500/90 text-white border border-emerald-300/30">
                          Open
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-semibold line-clamp-2 mb-3 group-hover:text-sky-600 dark:group-hover:text-sky-200 transition-colors">
                      {event.title}
                    </h3>
                    <div className="mt-auto space-y-1.5">
                      <p className="flex items-center gap-1.5 font-mono text-[11px] text-gray-500 dark:text-white/40">
                        <Calendar size={12} />
                        {event.date ? formatEventDate(String(event.date)) : event.year || 'TBA'}
                      </p>
                      <p className="flex items-center gap-1.5 font-mono text-[11px] text-gray-500 dark:text-white/40">
                        <Users size={12} />
                        {event.participantCount || 0} joined
                        {event.capacity != null && event.spotsLeft != null
                          ? ` · ${event.spotsLeft} left`
                          : ''}
                        {event.registrationsAvailable ? ' · participate →' : ''}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default UpcomingEvents
