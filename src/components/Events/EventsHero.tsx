import { motion } from 'framer-motion'

interface Props {
  eventCount?: number
  totalCount?: number
  year?: string
}

const EventsHero = ({ eventCount, totalCount, year }: Props) => (
  <section className="pt-32 pb-12">
    <div className="container-custom">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
      >
        <div>
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-primary-500 mb-3">
            CSI NMAMIT
          </p>
          <h1 className="text-display-xl font-bold tracking-tightest leading-none text-gray-900 dark:text-white">
            Events
          </h1>
          <p className="text-gray-400 dark:text-gray-500 mt-3 font-display text-sm">
            {eventCount !== undefined && year
              ? `${eventCount} in ${year}–${String(Number(year) + 1).slice(2)}`
              : null}
            {totalCount !== undefined ? (
              <span className="text-gray-300 dark:text-gray-600">
                {eventCount !== undefined ? ' · ' : ''}
                {totalCount} total
              </span>
            ) : null}
          </p>
        </div>

        <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed max-w-sm md:text-right">
          Workshops, hackathons, talks, and chapter moments from CSI NMAMIT — browse by academic year.
        </p>
      </motion.div>
    </div>
  </section>
)

export default EventsHero
