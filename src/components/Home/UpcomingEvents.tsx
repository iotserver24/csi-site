'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { ArrowRight, Calendar, Sparkles } from 'lucide-react'
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
      const upcoming =
        e.category === 'UPCOMING' ||
        e.registrationsAvailable === true ||
        year >= 2026 ||
        (!Number.isNaN(t) && t >= now - 86400000)
      return { e, upcoming, t: Number.isNaN(t) ? year * 1e12 : t, year }
    })
    .filter(x => x.upcoming)
    .sort((a, b) => a.t - b.t || b.year - a.year)

  return scored.slice(0, 3).map(x => x.e)
}

const Skeleton = () => (
  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden animate-pulse">
    <div className="aspect-[16/10] bg-gray-100 dark:bg-gray-900" />
    <div className="p-5 space-y-3">
      <div className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-800" />
      <div className="h-4 w-3/4 rounded bg-gray-100 dark:bg-gray-800" />
      <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-800" />
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
    <section className="py-16 sm:py-20 relative" ref={ref}>
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
        >
          <div>
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-primary-500 mb-3">
              Live calendar
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              What’s next
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md">
              Upcoming chapter events — register, team up, show up.
            </p>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:gap-3 transition-all self-start sm:self-auto"
          >
            View all events
            <ArrowRight size={16} />
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 bg-zinc-50/80 dark:bg-zinc-900/30 px-6 py-14 text-center"
          >
            <Sparkles className="mx-auto mb-3 text-primary-500" size={22} />
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Season calendar is filling up
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Browse workshops and past years while new 2026–27 events land.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 text-sm font-semibold"
            >
              Browse events
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {items.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 18 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.06 * index }}
              >
                <Link
                  href="/events"
                  className="group flex flex-col h-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:border-primary-400/40 dark:hover:border-primary-500/30 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <div className="relative aspect-[16/10] bg-gray-100 dark:bg-gray-900 overflow-hidden">
                    {event.image ? (
                      <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image src="/csi-logo.png" alt="" width={40} height={40} className="opacity-30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    {event.type && (
                      <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-black/50 text-white backdrop-blur-sm">
                        {event.type}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 p-5">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {event.title}
                    </h3>
                    <p className="mt-auto flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar size={13} />
                      {event.date ? formatEventDate(String(event.date)) : event.year || 'TBA'}
                    </p>
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
