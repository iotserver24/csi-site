// EventCard-modernized.jsx — 2026-level redesign
// Drop-in replacement for src/components/Events/EventCard.jsx

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Calendar, ArrowUpRight, Users } from 'lucide-react'
import type { Event } from '../../types'
import { formatEventDate } from '../../utils/eventUtils'

const formatDate = (dateStr: string) => formatEventDate(dateStr)

// Subtle type accent color map
const TYPE_ACCENTS = {
  Workshop: 'text-cyan-500 bg-cyan-500/8 border-cyan-500/20',
  Hackathon: 'text-violet-500 bg-violet-500/8 border-violet-500/20',
  Seminar: 'text-emerald-500 bg-emerald-500/8 border-emerald-500/20',
  Competition: 'text-amber-500 bg-amber-500/8 border-amber-500/20',
  default: 'text-gray-500 bg-gray-500/8 border-gray-500/20',
}

interface Props {
  event: Event
  index: number
  onClick?: (event: Event) => void
}

const EventCard = ({ event, index: _index, onClick }: Props) => {
  const accent = (event.type && TYPE_ACCENTS[event.type as keyof typeof TYPE_ACCENTS]) || TYPE_ACCENTS.default

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }
      }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="group cursor-pointer"
      onClick={() => onClick?.(event)}
    >
      <div
        className="relative flex flex-col h-full rounded-2xl overflow-hidden
                   bg-white dark:bg-gray-900
                   border border-gray-100 dark:border-gray-800
                   shadow-sm hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/40
                   transition-shadow duration-400"
      >
        {/* Image with subtle zoom */}
        <div className="relative overflow-hidden aspect-[4/3] bg-gray-100 dark:bg-gray-800">
          {event.image ? (
            <Image
              src={event.image}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
              <Image src="/csi-logo.png" alt="" width={48} height={48} className="opacity-40" />
              <span className="text-[10px] uppercase tracking-wider text-gray-400">No image</span>
            </div>
          )}
          {/* Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          {(event.registrationsAvailable || (event.participantCount ?? 0) > 0) && (
            <div className="absolute top-3 left-3 px-2 py-1 rounded-md text-[10px] font-semibold bg-black/50 text-white backdrop-blur-sm flex items-center gap-1">
              <Users size={10} />
              {event.capacity != null
                ? (event.spotsLeft === 0
                  ? 'Full'
                  : `${event.spotsLeft ?? Math.max(0, event.capacity - (event.participantCount || 0))} left`)
                : `${event.participantCount || 0} in`}
            </div>
          )}
          {/* Arrow icon — top right */}
          <div
            className="absolute top-3 right-3 p-1.5 rounded-lg
                       bg-white/10 backdrop-blur-md border border-white/20
                       opacity-0 group-hover:opacity-100
                       translate-y-1 group-hover:translate-y-0
                       transition-all duration-300"
          >
            <ArrowUpRight size={14} className="text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5">
          {/* Type badge */}
          {event.type && (
            <span
              className={`self-start text-[10px] font-bold tracking-[0.12em] uppercase
                          px-2.5 py-1 rounded-full border mb-3 ${accent}`}
            >
              {event.type}
            </span>
          )}

          {/* Title */}
          <h3
            className="text-base font-semibold text-gray-900 dark:text-white
                       group-hover:text-primary-500 transition-colors duration-200
                       leading-snug mb-auto"
          >
            {event.title}
          </h3>

          {/* Date + participants */}
          <div className="mt-4 space-y-1">
            {(event.date || event.time) && (
              <div className="flex items-center gap-1.5 text-[12px] text-gray-400 dark:text-gray-500">
                <Calendar size={12} />
                <span>{formatDate(event.date ? String(event.date) : '')}{event.time ? ` · ${event.time}` : ''}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[12px] text-gray-400 dark:text-gray-500">
              <Users size={12} />
              <span>
                {event.participantCount || 0} participant{(event.participantCount || 0) === 1 ? '' : 's'}
                {event.registrationsAvailable ? ' · open' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom accent line — animated on hover */}
        <div
          className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full
                     bg-gradient-to-r from-primary-500 to-cyber-blue
                     transition-all duration-500 ease-out"
        />
      </div>
    </motion.article>
  )
}

export default EventCard