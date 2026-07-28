import { motion } from 'framer-motion'

interface Props {
  eventCount?: number
}

const EventsHero = ({ eventCount }: Props) => (
  <section className="pt-32 pb-12">
    <div className="container-custom">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
      >
        {/* Left: heading */}
        <div>
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase 
                        text-primary-500 mb-3">
            CSI NMAMIT
          </p>
          <h1 className="text-display-xl font-bold tracking-tightest leading-none text-gray-900 dark:text-white">
            Events
          </h1>
          {eventCount !== undefined && (
            <p className="text-gray-400 dark:text-gray-500 mt-3 font-display text-sm">
              {eventCount} events this year
            </p>
          )}
        </div>

        {/* Right: description */}
        <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed 
                      max-w-sm md:text-right">
          From technical workshops to competitive hackathons — everything happening at CSI.
        </p>
      </motion.div>
    </div>
  </section>
)

export default EventsHero
