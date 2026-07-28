import { motion } from 'framer-motion'

const TeamHero: React.FC = () => (
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
            Team
          </h1>
          <p className="text-gray-400 dark:text-gray-500 mt-3 font-display text-sm">
            The minds behind the magic
          </p>
        </div>

        {/* Right: description */}
        <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed 
                      max-w-sm md:text-right">
          A dedicated group of students and faculty members working together to build a better tech ecosystem.
        </p>
      </motion.div>
    </div>
  </section>
)

export default TeamHero
