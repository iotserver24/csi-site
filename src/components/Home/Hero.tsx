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

  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % 1000), 1000)
    return () => clearInterval(id)
  }, [])

  // Auto-rotate focus gently when idle (paused on interaction)
  const idleRef = useRef(true)
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
      className="relative overflow-hidden bg-[#05060a] text-white pt-24 pb-0"
    >
      {/* Layered tech background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 15% 20%, rgba(37,99,235,0.35) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 85% 70%, rgba(168,85,247,0.22) 0%, transparent 50%), radial-gradient(ellipse 40% 30% at 50% 100%, rgba(14,165,233,0.15) 0%, transparent 40%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-40 transition-[background] duration-200"
          style={glowStyle}
        />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.35) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse 70% 70% at 50% 40%, black 20%, transparent 75%)',
          }}
        />
        {/* Giant watermark */}
        <div className="absolute -right-8 top-24 select-none font-display text-[clamp(6rem,22vw,14rem)] font-extrabold leading-none tracking-tighter text-white/[0.03]">
          CSI
        </div>
      </div>

      <div className="container-custom relative z-10 pb-10 sm:pb-14">
        {/* Status bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 font-mono text-[11px] text-white/55 backdrop-blur-md"
        >
          <div className="flex items-center gap-3">
            <Terminal size={13} className="text-emerald-400" />
            <span className="text-emerald-400/90">system.online</span>
            <span className="text-white/20">//</span>
            <span>csi-nmamit · chapter runtime</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-white/40">
              uptime {String(tick).padStart(3, '0')}s
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
              membership open 26–27
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-white/40">
              <Command size={11} />K palette
            </span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-stretch">
          {/* Left: copy + modules */}
          <div className="lg:col-span-7 flex flex-col">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-sky-400/90 mb-4"
            >
              Computer Society of India · NMAMIT
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-display text-[clamp(2.75rem,7vw,4.75rem)] font-extrabold leading-[0.95] tracking-tight mb-6"
            >
              {user ? (
                <>
                  <span className="text-white/40">// welcome</span>
                  <br />
                  {user.name?.split(' ')[0] || 'member'}
                  <span className="text-sky-400">_</span>
                </>
              ) : (
                <>
                  Build.
                  <br />
                  <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
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
                className="text-base sm:text-lg text-white/55 max-w-lg mb-7 leading-relaxed"
              >
                {active.line}
              </motion.p>
            </AnimatePresence>

            {/* Module selector — looks like a control panel */}
            <div
              role="tablist"
              aria-label="CSI focus modules"
              onKeyDown={onChipKey}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8"
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
                    className={`relative overflow-hidden rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                      selected
                        ? 'border-sky-400/50 bg-sky-500/15 shadow-[0_0_24px_-6px_rgba(56,189,248,0.5)]'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon size={16} className={selected ? 'text-sky-300' : 'text-white/45'} />
                      <span className="font-mono text-[10px] text-white/30">{f.tag}</span>
                    </div>
                    <p className={`text-xs font-semibold ${selected ? 'text-white' : 'text-white/65'}`}>
                      {f.label}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              {user ? (
                <>
                  <Link
                    href="/events"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-gray-950 hover:bg-sky-100 transition-colors"
                  >
                    Open events
                    <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/profile"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
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
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-gray-950 hover:bg-sky-100 transition-colors disabled:opacity-60"
                  >
                    {authLoading ? 'Signing in…' : 'Initialize access'}
                    <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
                  <Link
                    href="/recruit"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    Join chapter
                  </Link>
                </>
              )}
            </div>

            {/* Live stats strip */}
            <div className="mt-auto grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
              {[
                { k: '500+', v: 'members' },
                { k: '50+', v: 'events / yr' },
                { k: '10+', v: 'years live' },
              ].map(s => (
                <div
                  key={s.v}
                  className="bg-[#0a0b12] px-3 py-4 sm:px-5 sm:py-5 text-center hover:bg-[#0e1018] transition-colors"
                >
                  <p className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">{s.k}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/35">{s.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: media console */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="lg:col-span-5 flex flex-col gap-3"
          >
            <div className="relative flex-1 min-h-[280px] sm:min-h-[340px] rounded-3xl overflow-hidden border border-white/10 bg-[#0a0b12] shadow-2xl shadow-black/50">
              {/* Window chrome */}
              <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 py-2.5 bg-black/40 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                </div>
                <span className="font-mono text-[10px] text-white/45">
                  module://{active.id}
                </span>
                <ArrowUpRight size={12} className="text-white/35" />
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
              <div className="absolute inset-0 bg-gradient-to-t from-[#05060a] via-[#05060a]/30 to-transparent" />

              <div className="absolute bottom-0 inset-x-0 z-10 p-5 sm:p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-sky-300/80 mb-1">
                  {active.tag} · {active.label}
                </p>
                <p className="font-display text-xl sm:text-2xl font-bold leading-snug">{active.blurb}</p>
              </div>
            </div>

            {/* Secondary console cards */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/events"
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 hover:border-sky-400/40 hover:bg-sky-500/10 transition-all"
              >
                <p className="font-mono text-[10px] text-white/35 mb-2">ROUTE</p>
                <p className="text-sm font-semibold text-white group-hover:text-sky-200">/events</p>
                <p className="text-[11px] text-white/40 mt-1">Browse calendar →</p>
              </Link>
              <Link
                href="/team"
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 hover:border-violet-400/40 hover:bg-violet-500/10 transition-all"
              >
                <p className="font-mono text-[10px] text-white/35 mb-2">ROUTE</p>
                <p className="text-sm font-semibold text-white group-hover:text-violet-200">/team</p>
                <p className="text-[11px] text-white/40 mt-1">Meet core →</p>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Marquee belt */}
      <div className="relative border-t border-white/10 bg-black/40 py-3 overflow-hidden">
        <div className="flex w-max animate-marquee whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="mx-6 font-mono text-xs sm:text-sm tracking-[0.2em] text-white/35"
            >
              <span className="text-sky-500/70">◆</span> {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Hero
