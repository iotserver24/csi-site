 'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const FloatingTagRing = () => {
  const tags = ['React', 'Python', 'AI/ML', 'Cloud', 'Cyber Sec', 'IoT', 'Web3', 'DevOps']
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[700px] md:h-[700px]">
        {tags.map((tag, i) => {
          const angle = (i / tags.length) * Math.PI * 2
          const r = 200
          const x = Math.cos(angle) * r
          const y = Math.sin(angle) * r
          return (
            <motion.span
              key={tag}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute text-[10px] font-semibold tracking-[0.1em] uppercase
                         px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700
                         bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm
                         text-gray-400 dark:text-gray-500"
              style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, transform: 'translate(-50%, -50%)' }}
            >
              {tag}
            </motion.span>
          )
        })}
      </div>
    </div>
  )
}

const CountUp = ({ end, suffix = '', duration = 1000 }) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = Math.ceil(end / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(start)
    }, 16)
    return () => clearInterval(timer)
  }, [inView, end, duration])

  return <span ref={ref} className="font-display">{count}{suffix}</span>
}

const Hero = () => {
  const { user, signInWithGoogle, authLoading } = useAuth()
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const parallaxY = scrollY * 0.35

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-10 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.07] dark:opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle at 25% 30%, rgba(59,130,246,0.4) 0%, transparent 50%), radial-gradient(circle at 75% 70%, rgba(168,85,247,0.3) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(0,212,255,0.2) 0%, transparent 50%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(59,130,246,0.5) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      
      {/* Static Noise Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-[0.04]">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>

      <FloatingTagRing />

      <div
        className="container-custom relative z-10 text-center max-w-4xl mx-auto"
        style={{ transform: `translateY(${parallaxY}px)` }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-3 mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <Sparkles size={14} className="text-primary-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CSI NMAMIT</span>
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tracking-wide uppercase">Applications Open</span>
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="text-display-xl font-bold mb-6 leading-tight tracking-tightest"
        >
          {user ? (
            <>Welcome back, <span className="gradient-text">{user.name}</span></>
          ) : (
            <>Where engineers{' '}<br className="hidden sm:block" />become <span className="gradient-text">builders.</span></>
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="text-body-lg text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto"
        >
          Computer Society of India, NMAMIT chapter. Workshops, hackathons, and a community that ships things.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          {user ? (
            <Link href="/events" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 transition-all duration-200 translate-y-0 hover:-translate-y-[1px]">
              <span>Explore Events</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <button
                onClick={signInWithGoogle}
                disabled={authLoading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 transition-all duration-200 translate-y-0 hover:-translate-y-[1px]"
              >
                <span>{authLoading ? 'Signing in...' : 'Get Started'}</span>
                <ArrowRight size={18} />
              </button>
              <Link href="/events" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:border-gray-400 dark:hover:text-gray-300 hover:border-gray-500 transition-all duration-200 translate-y-0 hover:-translate-y-[1px]">
                Browse Events
              </Link>
            </>
          )}
        </motion.div>

        {/* New Stats Strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-14 inline-flex divide-x divide-gray-200 dark:divide-gray-800
                     border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden
                     bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm"
        >
          {[
            { end: 500, suffix: '+', label: 'Members' },
            { end: 50,  suffix: '+', label: 'Events / yr' },
            { end: 20,  suffix: '+', label: 'Awards' },
          ].map((s) => (
            <div key={s.label} className="px-7 py-4 text-center">
              <p className="text-2xl font-bold font-display text-gray-900 dark:text-white">
                <CountUp end={s.end} suffix={s.suffix} />
              </p>
              <p className="text-[11px] text-gray-500 tracking-widest uppercase mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
    </section>
  )
}

export default Hero
