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
    description: 'Workshops and sessions focused on tools and practices you will actually use.',
  },
  {
    icon: Zap,
    title: 'Build & compete',
    description: 'Hackathons and project showcases where ideas leave the slide deck.',
  },
  {
    icon: Users,
    title: 'Peer community',
    description: 'Seniors, juniors, and alumni connected through events and collaboration.',
  },
]

const About: React.FC = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.12 })

  return (
    <section className="py-20 sm:py-28 relative" ref={ref}>
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-primary-500 mb-3">
              About the chapter
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
              CSI NMAMIT is where campus tech gets serious.
            </h2>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              We run the Computer Society of India student chapter at NMAMIT — a space for students who want more than classroom theory: real events, real projects, and people who show up.
            </p>
            <ul className="space-y-4 mb-8">
              {pillars.map((item, index) => (
                <motion.li
                  key={item.title}
                  initial={{ opacity: 0, x: -12 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
                  className="flex gap-3"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
                    <item.icon size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.description}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
            <Link
              href="/team"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:gap-3 transition-all"
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
            <div className="relative aspect-[5/4] rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xl">
              <Image
                src="/team.jpg"
                alt="CSI NMAMIT team"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white">
                <div>
                  <p className="text-2xl font-bold">10+ years</p>
                  <p className="text-sm text-white/80">of campus tech culture</p>
                </div>
                <Link
                  href="/events"
                  className="text-xs font-semibold uppercase tracking-wider bg-white/15 backdrop-blur px-3 py-2 rounded-lg border border-white/20 hover:bg-white/25 transition-colors"
                >
                  See events
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default About
