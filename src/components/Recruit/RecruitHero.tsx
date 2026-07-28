import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

const RecruitHero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% -20%, rgba(59,130,246,0.5) 0%, transparent 60%)',
        }}
      />
      
      <div className="container-custom relative z-10 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-3 mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <Sparkles size={14} className="text-primary-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Recruitment</span>
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="text-display-xl font-bold mb-6 leading-tight tracking-tightest text-gray-900 dark:text-white"
        >
          Join the <br className="hidden sm:block" /> builders of <span className="text-primary-500">tomorrow.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="text-body-lg text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto"
        >
          Become part of India's leading tech community. We build, we ship, we lead.
        </motion.p>

        {/* Stats Strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="inline-flex divide-x divide-gray-200 dark:divide-gray-800
                     border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden
                     bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm"
        >
          {[
            { value: '500+', label: 'Members' },
            { value: '50+',  label: 'Events / yr' },
            { value: '10+',  label: 'Chapters' },
          ].map((s) => (
            <div key={s.label} className="px-8 py-4 text-center">
              <p className="text-xl font-bold font-display text-gray-900 dark:text-white">
                {s.value}
              </p>
              <p className="text-[10px] text-gray-500 tracking-widest uppercase mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default RecruitHero
