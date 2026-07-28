'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Code2, Mic2, Rocket, Trophy } from 'lucide-react'

const activities = [
  {
    icon: Code2,
    title: 'Technical workshops',
    description: 'Hands-on sessions on web, cloud, AI, security, and tooling — led by peers and industry guests.',
    count: '30+',
    label: 'workshops',
  },
  {
    icon: Trophy,
    title: 'Hackathons',
    description: 'Timed builds, teamwork, and demos. Practice shipping under pressure with people who care.',
    count: '10+',
    label: 'hackathons',
  },
  {
    icon: Mic2,
    title: 'Talks & panels',
    description: 'Alumni and industry voices on careers, product, research, and what “good engineering” looks like.',
    count: '20+',
    label: 'sessions',
  },
  {
    icon: Rocket,
    title: 'Showcases',
    description: 'Present projects, get feedback, and find collaborators for the next build cycle.',
    count: '15+',
    label: 'showcases',
  },
]

const Features: React.FC = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section className="py-20 sm:py-28 bg-zinc-50 dark:bg-zinc-900/40 border-y border-gray-100 dark:border-gray-900" ref={ref}>
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mb-12 sm:mb-16"
        >
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-primary-500 mb-3">
            What we run
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            A year of building, not just attending
          </h2>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
            Structured activities so members leave with skills, portfolio pieces, and people they can call for the next project.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4 lg:gap-5">
          {activities.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.06 * index }}
              className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 sm:p-7 hover:border-primary-400/40 dark:hover:border-primary-500/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 group-hover:bg-primary-500/10 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  <item.icon size={20} />
                </span>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{item.count}</p>
                  <p className="text-[11px] uppercase tracking-wider text-gray-400">{item.label}</p>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
