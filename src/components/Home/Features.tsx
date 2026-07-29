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
      'Hands-on sessions on web, cloud, AI, security, and tooling — leave with something you can put on a resume.',
    count: '30+',
    label: 'labs / year',
    accent: 'from-sky-500/20 to-blue-600/5',
    ring: 'group-hover:border-sky-400/40',
  },
  {
    icon: Trophy,
    title: 'Hackathons',
    description:
      'Timed builds, teamwork, and demos. Practice shipping under pressure with people who care.',
    count: '10+',
    label: 'sprints',
    accent: 'from-violet-500/20 to-fuchsia-600/5',
    ring: 'group-hover:border-violet-400/40',
  },
  {
    icon: Mic2,
    title: 'Talks & panels',
    description:
      'Alumni and industry voices on careers, product, research, and real engineering judgment.',
    count: '20+',
    label: 'sessions',
    accent: 'from-emerald-500/20 to-teal-600/5',
    ring: 'group-hover:border-emerald-400/40',
  },
  {
    icon: Rocket,
    title: 'Showcases',
    description:
      'Present projects, get feedback, find collaborators. Portfolio pieces — not just attendance.',
    count: '15+',
    label: 'demos',
    accent: 'from-amber-500/20 to-orange-600/5',
    ring: 'group-hover:border-amber-400/40',
  },
]

const Features: React.FC = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.08 })
  const [selected, setSelected] = useState(0)

  return (
    <section className="relative py-20 sm:py-28 bg-[#07080d] text-white overflow-hidden" ref={ref}>
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 80% 0%, rgba(59,130,246,0.2) 0%, transparent 55%)',
        }}
      />

      <div className="container-custom relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className="max-w-xl"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-sky-400/90 mb-3">
              // program surface
            </p>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.05]">
              A full stack of
              <br />
              <span className="text-white/40">campus tech energy</span>
            </h2>
          </motion.div>
          <p className="text-sm text-white/45 max-w-sm leading-relaxed">
            Click any module. Structured activities so members leave with skills, portfolio pieces, and people.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-3 sm:gap-4">
          {activities.map((item, index) => {
            const active = selected === index
            const isHero = index === 0
            return (
              <motion.button
                type="button"
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.05 * index }}
                onClick={() => setSelected(index)}
                onMouseEnter={() => setSelected(index)}
                onFocus={() => setSelected(index)}
                className={`group relative text-left rounded-3xl border p-6 sm:p-8 overflow-hidden transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  isHero ? 'lg:col-span-7 min-h-[220px]' : 'lg:col-span-5'
                } ${
                  active
                    ? 'border-white/25 bg-white/[0.07] shadow-[0_0_40px_-12px_rgba(56,189,248,0.35)]'
                    : `border-white/10 bg-white/[0.03] ${item.ring}`
                }`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.accent} opacity-0 transition-opacity duration-300 ${
                    active ? 'opacity-100' : 'group-hover:opacity-70'
                  }`}
                />
                <div className="relative z-10 flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors ${
                        active
                          ? 'border-white/20 bg-white/10 text-white'
                          : 'border-white/10 bg-black/30 text-white/60'
                      }`}
                    >
                      <item.icon size={22} />
                    </span>
                    <div className="text-right">
                      <p className="font-display text-3xl font-extrabold tracking-tight">{item.count}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-white/35">
                        {item.label}
                      </p>
                    </div>
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold mb-2">{item.title}</h3>
                  <p
                    className={`text-sm leading-relaxed transition-all ${
                      active ? 'text-white/70' : 'text-white/40 line-clamp-2'
                    }`}
                  >
                    {item.description}
                  </p>
                  {active && (
                    <span className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-sky-300/80">
                      module selected
                    </span>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Features
