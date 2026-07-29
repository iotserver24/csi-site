'use client'

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  Command,
  Mic2,
  Terminal,
  Trophy,
  Users,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usePointerGlow } from './usePointerGlow'

const FOCI = [
  {
    id: 'workshops',
    label: 'Workshops',
    icon: Code2,
    tag: '01',
    line: 'Hands-on labs that leave real skills — not just attendance certificates.',
    image: '/hero.jpg',
    blurb: 'Web · Cloud · AI · Security',
  },
  {
    id: 'hackathons',
    label: 'Hackathons',
    icon: Trophy,
    tag: '02',
    line: 'Build under pressure. Ship demos. Find teammates who actually commit.',
    image: '/highlights/event (2).jpg',
    blurb: '48h builds · team codes · demos',
  },
  {
    id: 'talks',
    label: 'Talks',
    icon: Mic2,
    tag: '03',
    line: 'Alumni and industry builders on careers, product, and craft.',
    image: '/highlights/event (5).jpg',
    blurb: 'Panels · AMA · industry',
  },
  {
    id: 'community',
    label: 'Community',
    icon: Users,
    tag: '04',
    line: 'Seniors, juniors, core team — a network that shows up for each other.',
    image: '/team.jpg',
    blurb: 'Mentors · peers · alumni',
  },
] as const

type FocusId = (typeof FOCI)[number]['id']

const MARQUEE = [
  'WORKSHOPS',
  'HACKATHONS',
  'AI / ML',
  'WEB DEV',
  'CLOUD',
  'OPEN SOURCE',
  'SECURITY',
  'SYSTEM DESIGN',
  'DEVOPS',
  'COMPETITIVE CODE',
  'PRODUCT',
  'RESEARCH',
]

const Hero: React.FC = () => {
  const { user, signInWithGoogle, authLoading } = useAuth()
  const [focus, setFocus] = useState<FocusId>('workshops')
  const [tick, setTick] = useState(0)
  const { hostRef, onPointerMove, glowStyle } = usePointerGlow(true)
  const active = FOCI.find(f => f.id === focus) ?? FOCI[0]
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([])
  const idleRef = useRef(true)

  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % 1000), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      if (!idleRef.current) return
      setFocus(prev => {
        const i = FOCI.findIndex(f => f.id === prev)
        return FOCI[(i + 1) % FOCI.length].id
      })
    }, 4500)
    return () => clearInterval(id)
  }, [])

  const selectFocus = (id: FocusId) => {
    idleRef.current = false
    setFocus(id)
  }

  const onChipKey = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const idx = FOCI.findIndex(f => f.id === focus)
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        const next = (idx + 1) % FOCI.length
        selectFocus(FOCI[next].id)
        chipRefs.current[next]?.focus()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = (idx - 1 + FOCI.length) % FOCI.length
        selectFocus(FOCI[prev].id)
        chipRefs.current[prev]?.focus()
      }
    },
    [focus]
  )

  return (
    <section
      ref={hostRef as React.RefObject<HTMLElement>}
      onPointerMove={onPointerMove}
      className="relative overflow-x-hidden bg-zinc-50 text-gray-900 dark:bg-[#05060a] dark:text-white pt-20 sm:pt-24 pb-0"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-80 dark:opacity-70"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 15% 20%, rgba(37,99,235,0.18) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 85% 70%, rgba(168,85,247,0.12) 0%, transparent 50%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-50 dark:opacity-40 transition-[background] duration-200 hidden sm:block"
          style={glowStyle}
        />
        <div
          className="absolute inset-0 opacity-[0.08] dark:opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(100,116,139,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.4) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 70% 70% at 50% 40%, black 20%, transparent 75%)',
          }}
        />
        <div className="absolute -right-4 top-20 select-none font-display text-[clamp(4rem,28vw,14rem)] font-extrabold leading-none tracking-tighter text-gray-900/[0.04] dark:text-white/[0.03] pointer-events-none">
          CSI
        </div>
      </div>

      <div className="container-custom relative z-10 pb-8 sm:pb-14">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 sm:mb-8 flex flex-col xs:flex-row xs:flex-wrap items-start xs:items-center justify-between gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] px-3 sm:px-4 py-2 sm:py-2.5 font-mono text-[10px] sm:text-[11px] text-gray-500 dark:text-white/55 backdrop-blur-md"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Terminal size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-emerald-600 dark:text-emerald-400/90 shrink-0">online</span>
            <span className="text-gray-300 dark:text-white/20 hidden sm:inline">//</span>
            <span className="truncate hidden sm:inline">csi-nmamit · chapter runtime</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden sm:inline text-gray-400 dark:text-white/40">
              uptime {String(tick).padStart(3, '0')}s
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-soft shrink-0" />
              <span className="whitespace-nowrap">membership open</span>
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-gray-400 dark:text-white/40">
              <Command size={11} />K
            </span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-8 items-stretch">
          {/* Media first on mobile for visual hierarchy */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="lg:col-span-5 flex flex-col gap-2.5 sm:gap-3 order-1 lg:order-2"
          >
            <div className="relative w-full aspect-[16/11] sm:aspect-[4/3] sm:min-h-[280px] lg:min-h-[340px] lg:aspect-auto lg:flex-1 rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0b12] shadow-xl sm:shadow-2xl shadow-black/10 dark:shadow-black/50">
              <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-white/80 dark:bg-black/40 backdrop-blur-md border-b border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-red-400/80" />
                  <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-amber-400/80" />
                  <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-400/80" />
                </div>
                <span className="font-mono text-[9px] sm:text-[10px] text-gray-500 dark:text-white/45 truncate max-w-[50%]">
                  module://{active.id}
                </span>
                <ArrowUpRight size={12} className="text-gray-400 dark:text-white/35 shrink-0" />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={active.image}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={active.image}
                    alt={active.label}
                    fill
                    priority={active.id === 'workshops'}
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent dark:from-[#05060a]" />

              <div className="absolute bottom-0 inset-x-0 z-10 p-4 sm:p-5 lg:p-6 text-white">
                <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-sky-300/90 mb-1">
                  {active.tag} · {active.label}
                </p>
                <p className="font-display text-base sm:text-xl lg:text-2xl font-bold leading-snug">
                  {active.blurb}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Link
                href="/events"
                className="group rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] p-3 sm:p-4 hover:border-sky-400/50 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-all active:scale-[0.98]"
              >
                <p className="font-mono text-[9px] sm:text-[10px] text-gray-400 dark:text-white/35 mb-1 sm:mb-2">
                  ROUTE
                </p>
                <p className="text-sm font-semibold group-hover:text-sky-600 dark:group-hover:text-sky-200">
                  /events
                </p>
                <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-white/40 mt-0.5 sm:mt-1">
                  Browse calendar →
                </p>
              </Link>
              <Link
                href="/team"
                className="group rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] p-3 sm:p-4 hover:border-violet-400/50 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all active:scale-[0.98]"
              >
                <p className="font-mono text-[9px] sm:text-[10px] text-gray-400 dark:text-white/35 mb-1 sm:mb-2">
                  ROUTE
                </p>
                <p className="text-sm font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-200">
                  /team
                </p>
                <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-white/40 mt-0.5 sm:mt-1">
                  Meet core →
                </p>
              </Link>
            </div>
          </motion.div>

          <div className="lg:col-span-7 flex flex-col order-2 lg:order-1">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.16em] sm:tracking-[0.22em] text-sky-600 dark:text-sky-400/90 mb-3 sm:mb-4"
            >
              CSI · NMAMIT
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-display text-[clamp(2.15rem,9.5vw,4.75rem)] font-extrabold leading-[0.98] tracking-tight mb-4 sm:mb-6"
            >
              {user ? (
                <>
                  <span className="text-gray-400 dark:text-white/40">// welcome</span>
                  <br />
                  {user.name?.split(' ')[0] || 'member'}
                  <span className="text-sky-500 dark:text-sky-400">_</span>
                </>
              ) : (
                <>
                  Build.
                  <br />
                  <span className="bg-gradient-to-r from-sky-500 via-blue-500 to-violet-500 dark:from-sky-300 dark:via-blue-400 dark:to-violet-400 bg-clip-text text-transparent">
                    Ship.
                  </span>
                  <br />
                  Belong.
                </>
              )}
            </motion.h1>

            <AnimatePresence mode="wait">
              <motion.p
                key={active.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-sm sm:text-lg text-gray-500 dark:text-white/55 max-w-lg mb-5 sm:mb-7 leading-relaxed"
              >
                {active.line}
              </motion.p>
            </AnimatePresence>

            <div
              role="tablist"
              aria-label="CSI focus modules"
              onKeyDown={onChipKey}
              className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-6 sm:mb-8"
            >
              {FOCI.map((f, i) => {
                const Icon = f.icon
                const selected = f.id === focus
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    ref={el => {
                      chipRefs.current[i] = el
                    }}
                    onClick={() => selectFocus(f.id)}
                    className={`relative overflow-hidden rounded-xl border p-2.5 sm:p-3 text-left transition-all touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 active:scale-[0.98] ${
                      selected
                        ? 'border-sky-400/60 bg-sky-500/10 dark:bg-sky-500/15 shadow-[0_0_24px_-6px_rgba(56,189,248,0.45)]'
                        : 'border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] hover:border-gray-300 dark:hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <Icon
                        size={15}
                        className={selected ? 'text-sky-600 dark:text-sky-300' : 'text-gray-400 dark:text-white/45'}
                      />
                      <span className="font-mono text-[9px] sm:text-[10px] text-gray-400 dark:text-white/30">
                        {f.tag}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] sm:text-xs font-semibold leading-tight ${
                        selected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-white/65'
                      }`}
                    >
                      {f.label}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-6 sm:mb-10">
              {user ? (
                <>
                  <Link
                    href="/events"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-5 sm:px-6 py-3.5 text-sm font-bold text-white dark:text-gray-950 hover:opacity-90 transition-opacity w-full sm:w-auto touch-manipulation"
                  >
                    Open events
                    <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/profile"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 px-5 sm:px-6 py-3.5 text-sm font-semibold text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors w-full sm:w-auto touch-manipulation"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    disabled={authLoading}
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-5 sm:px-6 py-3.5 text-sm font-bold text-white dark:text-gray-950 hover:opacity-90 transition-opacity disabled:opacity-60 w-full sm:w-auto touch-manipulation"
                  >
                    {authLoading ? 'Signing in…' : 'Get started'}
                    <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
                  <Link
                    href="/recruit"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 px-5 sm:px-6 py-3.5 text-sm font-semibold text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors w-full sm:w-auto touch-manipulation"
                  >
                    Join chapter
                  </Link>
                </>
              )}
            </div>

            <div className="mt-auto grid grid-cols-3 gap-px overflow-hidden rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-200 dark:bg-white/10">
              {[
                { k: '500+', v: 'members' },
                { k: '50+', v: 'events/yr' },
                { k: '10+', v: 'years' },
              ].map(s => (
                <div
                  key={s.v}
                  className="bg-white dark:bg-[#0a0b12] px-1.5 py-3 sm:px-5 sm:py-5 text-center hover:bg-zinc-50 dark:hover:bg-[#0e1018] transition-colors"
                >
                  <p className="font-display text-lg sm:text-2xl font-bold tracking-tight">{s.k}</p>
                  <p className="mt-0.5 sm:mt-1 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-400 dark:text-white/35">
                    {s.v}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-gray-200 dark:border-white/10 bg-white/60 dark:bg-black/40 py-2.5 sm:py-3 overflow-hidden">
        <div className="flex w-max animate-marquee whitespace-nowrap will-change-transform">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="mx-4 sm:mx-6 font-mono text-[10px] sm:text-sm tracking-[0.16em] sm:tracking-[0.2em] text-gray-400 dark:text-white/35"
            >
              <span className="text-sky-500/80">◆</span> {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Hero
