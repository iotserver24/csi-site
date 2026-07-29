'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useInView } from 'react-intersection-observer'
import { ArrowRight, BookOpen, Users, Zap } from 'lucide-react'

const pillars = [
  {
    icon: BookOpen,
    title: 'Hands-on learning',
    description: 'Workshops focused on tools and practices you will actually use.',
  },
  {
    icon: Zap,
    title: 'Build & compete',
    description: 'Hackathons and showcases where ideas leave the slide deck.',
  },
  {
    icon: Users,
    title: 'Peer community',
    description: 'Seniors, juniors, and alumni connected through real collabs.',
  },
]

const About: React.FC = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.12 })

  return (
    <section
      className="relative py-14 sm:py-28 bg-white dark:bg-[#0a0b12] text-gray-900 dark:text-white overflow-x-hidden"
      ref={ref}
    >
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300/90 mb-3">
              // about chapter
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 sm:mb-4 leading-tight">
              Where campus tech
              <br />
              <span className="text-gray-400 dark:text-white/40">gets serious.</span>
            </h2>
            <p className="text-gray-500 dark:text-white/50 leading-relaxed mb-8 max-w-lg">
              CSI NMAMIT is the Computer Society of India student chapter — events, projects, and people who show up beyond classroom theory.
            </p>
            <ul className="space-y-3 mb-8">
              {pillars.map((item, index) => (
                <motion.li
                  key={item.title}
                  initial={{ opacity: 0, x: -12 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
                  className="flex gap-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.03] p-4 hover:border-gray-300 dark:hover:border-white/20 transition-colors"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-300">
                    <item.icon size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-sm text-gray-500 dark:text-white/45 leading-relaxed">{item.description}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
            <Link
              href="/team"
              className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 dark:text-sky-300 hover:gap-3 transition-all"
            >
              Meet the core team
              <ArrowRight size={16} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <div className="relative aspect-[5/4] rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/10 dark:shadow-black/50">
              <Image
                src="/team.jpg"
                alt="CSI NMAMIT team"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white">
                <div>
                  <p className="font-display text-3xl font-extrabold">10+</p>
                  <p className="font-mono text-[11px] text-white/70 uppercase tracking-wider">
                    years of campus tech
                  </p>
                </div>
                <Link
                  href="/events"
                  className="font-mono text-[10px] uppercase tracking-wider bg-white/10 backdrop-blur px-3 py-2 rounded-lg border border-white/15 hover:bg-white/20 transition-colors"
                >
                  see events
                </Link>
              </div>
            </div>
            <div className="absolute -z-10 -inset-3 rounded-[2rem] bg-gradient-to-br from-sky-500/15 to-violet-600/15 blur-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default About
