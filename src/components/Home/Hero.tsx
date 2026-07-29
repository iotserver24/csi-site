'use client'

import { useRef, useEffect, useState, useCallback, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Code2, Mic2, Sparkles, Trophy, Users } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usePointerGlow } from './usePointerGlow'

const FOCI = [
  {
    id: 'workshops',
    label: 'Workshops',
    icon: Code2,
    line: 'Hands-on sessions that leave you with skills you can ship.',
    image: '/hero.jpg',
    caption: 'Learn by doing',
    blurb: 'Web, cloud, AI, security — tools you’ll actually use.',
  },
  {
    id: 'hackathons',
    label: 'Hackathons',
    icon: Trophy,
    line: 'Timed builds, teammates, demos. Pressure that teaches.',
    image: '/highlights/event (2).jpg',
    caption: 'Ship under pressure',
    blurb: 'Ideas leave the slide deck and hit a demo stage.',
  },
  {
    id: 'talks',
    label: 'Talks',
    icon: Mic2,
    line: 'Alumni and industry voices on careers and craft.',
    image: '/highlights/event (5).jpg',
    caption: 'Hear from builders',
    blurb: 'Real paths, real products, real engineering judgment.',
  },
  {
    id: 'community',
    label: 'Community',
    icon: Users,
    line: 'Seniors, juniors, and peers who show up for each other.',
    image: '/team.jpg',
    caption: 'Find your people',
    blurb: 'Mentorship and collaborators for the next project.',
  },
] as const

type FocusId = (typeof FOCI)[number]['id']

const CountUp = ({ end, suffix = '', duration = 1000 }: { end: number; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = Math.max(1, Math.ceil(end / (duration / 16)))
    const timer = setInterval(() => {
      start += step
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else setCount(start)
    }, 16)
    return () => clearInterval(timer)
  }, [inView, end, duration])

  return (
    <span ref={ref} className="font-display">
      {count}
      {suffix}
    </span>
  )
}

const MagneticPrimary = ({
  children,
  className,
  onClick,
  disabled,
  as: As = 'button',
  href,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  as?: 'button' | 'a'
  href?: string
}) => {
  const ref = useRef<HTMLElement | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fine = window.matchMedia('(pointer: fine)')
    const sync = () => setEnabled(!reduce.matches && fine.matches)
    sync()
    reduce.addEventListener('change', sync)
    fine.addEventListener('change', sync)
    return () => {
      reduce.removeEventListener('change', sync)
      fine.removeEventListener('change', sync)
    }
  }, [])

  const onMove = (e: React.PointerEvent) => {
    if (!enabled || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const x = e.clientX - (r.left + r.width / 2)
    const y = e.clientY - (r.top + r.height / 2)
    setOffset({ x: Math.max(-8, Math.min(8, x * 0.18)), y: Math.max(-8, Math.min(8, y * 0.18)) })
  }

  const reset = () => setOffset({ x: 0, y: 0 })

  const style = {
    transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
    transition: enabled ? 'transform 0.12s ease-out' : undefined,
  }

  if (As === 'a' && href) {
    return (
      <Link
        href={href}
        ref={ref as React.RefObject<HTMLAnchorElement>}
        className={className}
        style={style}
        onPointerMove={onMove}
        onPointerLeave={reset}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      type="button"
      ref={ref as React.RefObject<HTMLButtonElement>}
      className={className}
      style={style}
      onClick={onClick}
      disabled={disabled}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      {children}
    </button>
  )
}

const Hero: React.FC = () => {
  const { user, signInWithGoogle, authLoading } = useAuth()
  const [focus, setFocus] = useState<FocusId>('workshops')
  const { hostRef, onPointerMove, glowStyle } = usePointerGlow(true)
  const active = FOCI.find(f => f.id === focus) ?? FOCI[0]
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([])

  const onChipKey = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const idx = FOCI.findIndex(f => f.id === focus)
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        const next = (idx + 1) % FOCI.length
        setFocus(FOCI[next].id)
        chipRefs.current[next]?.focus()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = (idx - 1 + FOCI.length) % FOCI.length
        setFocus(FOCI[prev].id)
        chipRefs.current[prev]?.focus()
      }
    },
    [focus]
  )

  return (
    <section
      ref={hostRef as React.RefObject<HTMLElement>}
      onPointerMove={onPointerMove}
      className="relative min-h-[90vh] flex items-center pt-28 pb-16 overflow-hidden"
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950" />
        <div
          className="absolute inset-0 opacity-50 dark:opacity-30 pointer-events-none transition-[background] duration-150"
          style={glowStyle}
        />
        <div
          className="absolute inset-0 opacity-40 dark:opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.16) 0%, transparent 42%), radial-gradient(circle at 80% 30%, rgba(168,85,247,0.12) 0%, transparent 40%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(100,116,139,0.9) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          <div className="lg:col-span-7 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-5"
            >
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <Sparkles size={13} className="text-primary-500" />
                <span className="text-xs font-semibold tracking-wide text-gray-700 dark:text-gray-300">
                  CSI NMAMIT · Command center
                </span>
              </span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50">
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 tracking-wide uppercase">
                  Membership open
                </span>
              </span>
            </motion.div>

            {/* Focus chips */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.04 }}
              role="tablist"
              aria-label="Explore what CSI runs"
              onKeyDown={onChipKey}
              className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6"
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
                    onClick={() => setFocus(f.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 ${
                      selected
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md'
                        : 'bg-white/80 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-primary-400/50 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon size={14} />
                    {f.label}
                  </button>
                )
              })}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] text-gray-900 dark:text-white mb-4"
            >
              {user ? (
                <>
                  Welcome back,{' '}
                  <span className="gradient-text">{user.name?.split(' ')[0] || 'member'}</span>
                </>
              ) : (
                <>
                  Build skills.
                  <br />
                  Ship projects.
                  <br />
                  <span className="gradient-text">Grow with CSI.</span>
                </>
              )}
            </motion.h1>

            <AnimatePresence mode="wait">
              <motion.p
                key={active.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                className="text-base sm:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                {active.line}
              </motion.p>
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
            >
              {user ? (
                <>
                  <MagneticPrimary
                    as="a"
                    href="/events"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:opacity-90"
                  >
                    Explore events
                    <ArrowRight size={18} />
                  </MagneticPrimary>
                  <Link
                    href="/profile"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    My profile
                  </Link>
                </>
              ) : (
                <>
                  <MagneticPrimary
                    onClick={signInWithGoogle}
                    disabled={authLoading}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:opacity-90 disabled:opacity-60"
                  >
                    {authLoading ? 'Signing in…' : 'Get started'}
                    <ArrowRight size={18} />
                  </MagneticPrimary>
                  <Link
                    href="/recruit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    Join CSI
                  </Link>
                </>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28 }}
              className="mt-10 grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0"
            >
              {[
                { end: 500, suffix: '+', label: 'Members' },
                { end: 50, suffix: '+', label: 'Events / yr' },
                { end: 10, suffix: '+', label: 'Years' },
              ].map(s => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 backdrop-blur px-3 py-4 text-center transition-colors hover:border-primary-400/40 dark:hover:border-primary-500/30"
                >
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    <CountUp end={s.end} suffix={s.suffix} />
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 tracking-wider uppercase mt-1">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Interactive visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl shadow-black/10 dark:shadow-black/40 group">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.image}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={active.image}
                    alt={active.caption}
                    fill
                    priority={active.id === 'workshops'}
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/70 mb-1">{active.caption}</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={active.blurb}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-lg sm:text-xl font-semibold leading-snug"
                  >
                    {active.blurb}
                  </motion.p>
                </AnimatePresence>
              </div>
              {/* Focus pill on image */}
              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 px-3 py-1.5">
                <active.icon size={13} className="text-sky-300" />
                <span className="text-[11px] font-semibold text-white/90">{active.label}</span>
              </div>
            </div>
            <div className="absolute -z-10 -inset-4 rounded-[2rem] bg-gradient-to-br from-primary-500/20 via-transparent to-cyber-purple/20 blur-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Hero
