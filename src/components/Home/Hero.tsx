'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

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

const Hero: React.FC = () => {
  const { user, signInWithGoogle, authLoading } = useAuth()

  return (
    <section className="relative min-h-[92vh] flex items-center pt-28 pb-16 overflow-hidden">
      {/* Soft background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950" />
        <div
          className="absolute inset-0 opacity-40 dark:opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.18) 0%, transparent 42%), radial-gradient(circle at 80% 30%, rgba(168,85,247,0.14) 0%, transparent 40%)',
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
          {/* Copy */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-6"
            >
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <Sparkles size={13} className="text-primary-500" />
                <span className="text-xs font-semibold tracking-wide text-gray-700 dark:text-gray-300">
                  CSI NMAMIT · NMAM Institute of Technology
                </span>
              </span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50">
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 tracking-wide uppercase">
                  Membership open
                </span>
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] text-gray-900 dark:text-white mb-5"
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

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base sm:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Computer Society of India student chapter at NMAMIT — workshops, hackathons, talks, and a community of people who actually build.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
            >
              {user ? (
                <>
                  <Link
                    href="/events"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:opacity-90 transition-opacity"
                  >
                    Explore events
                    <ArrowRight size={18} />
                  </Link>
                  <Link
                    href="/profile"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    My profile
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    disabled={authLoading}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {authLoading ? 'Signing in…' : 'Get started'}
                    <ArrowRight size={18} />
                  </button>
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
                  className="rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 backdrop-blur px-3 py-4 text-center"
                >
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    <CountUp end={s.end} suffix={s.suffix} />
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 tracking-wider uppercase mt-1">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl shadow-black/10 dark:shadow-black/40">
              <Image
                src="/hero.jpg"
                alt="CSI NMAMIT community"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/70 mb-1">Student chapter</p>
                <p className="text-lg sm:text-xl font-semibold leading-snug">
                  Learn by building — with peers who care about the craft.
                </p>
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
