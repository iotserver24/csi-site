'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Code2, Mic2, Rocket, Trophy } from 'lucide-react'

const activities = [
  {
    icon: Code2,
    title: 'Technical workshops',
    description:
      'Hands-on sessions on web, cloud, AI, security, and tooling — led by peers and industry guests. Leave with something you can put on a resume.',
    count: '30+',
    label: 'workshops',
    wide: true,
  },
  {
    icon: Trophy,
    title: 'Hackathons',
    description:
      'Timed builds, teamwork, and demos. Practice shipping under pressure with people who care about the craft.',
    count: '10+',
    label: 'hackathons',
    wide: false,
  },
  {
    icon: Mic2,
    title: 'Talks & panels',
    description:
      'Alumni and industry voices on careers, product, research, and what good engineering looks like day to day.',
    count: '20+',
    label: 'sessions',
    wide: false,
  },
  {
    icon: Rocket,
    title: 'Showcases',
    description:
      'Present projects, get feedback, and find collaborators for the next build cycle. Portfolio pieces, not just attendance.',
    count: '15+',
    label: 'showcases',
    wide: false,
  },
]

const Features: React.FC = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [selected, setSelected] = useState(0)

  return (
    <section
      className="py-20 sm:py-28 bg-zinc-50 dark:bg-zinc-900/40 border-y border-gray-100 dark:border-gray-900"
      ref={ref}
    >
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mb-12 sm:mb-14"
        >
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-primary-500 mb-3">
            What we run
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            A year of building, not just attending
          </h2>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
            Tap a tile — structured activities so members leave with skills, portfolio pieces, and people for the next project.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {activities.map((item, index) => {
            const active = selected === index
            return (
              <motion.button
                type="button"
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: 0.05 * index }}
                onClick={() => setSelected(index)}
                onMouseEnter={() => setSelected(index)}
                onFocus={() => setSelected(index)}
                className={`group text-left rounded-2xl border p-6 sm:p-7 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 ${
                  item.wide ? 'sm:col-span-2 lg:col-span-2' : ''
                } ${
                  active
                    ? 'border-primary-400/50 dark:border-primary-500/40 bg-white dark:bg-gray-950 shadow-lg shadow-primary-500/5 scale-[1.01]'
                    : 'border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                      active
                        ? 'bg-primary-500/15 text-primary-600 dark:text-primary-400'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <item.icon size={20} />
                  </span>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{item.count}</p>
                    <p className="text-[11px] uppercase tracking-wider text-gray-400">{item.label}</p>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p
                  className={`text-sm leading-relaxed transition-all duration-300 ${
                    active
                      ? 'text-gray-600 dark:text-gray-300 max-h-40 opacity-100'
                      : 'text-gray-500 dark:text-gray-400 max-h-12 opacity-90 line-clamp-2'
                  }`}
                >
                  {item.description}
                </p>
                {active && (
                  <span className="mt-4 inline-block h-0.5 w-10 rounded-full bg-gradient-to-r from-primary-500 to-violet-500" />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Features
