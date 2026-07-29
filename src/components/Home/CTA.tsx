'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const CTA: React.FC = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 })

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden bg-[#05060a]" ref={ref}>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 50% 100%, rgba(37,99,235,0.35) 0%, transparent 55%), radial-gradient(ellipse 40% 40% at 20% 0%, rgba(168,85,247,0.2) 0%, transparent 50%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur-md px-6 py-12 sm:px-12 sm:py-16"
        >
          <div className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
            <span className="font-mono text-[11px] font-medium tracking-widest uppercase text-emerald-300/90">
              2026–27 membership open
            </span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 leading-[1.05]">
            Ready to ship with
            <br />
            CSI NMAMIT?
          </h2>
          <p className="text-white/50 mb-9 leading-relaxed max-w-lg mx-auto">
            Join the chapter for workshops, hackathons, and a campus community that actually builds.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/recruit"
              className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-gray-950 font-bold hover:bg-sky-100 transition-colors"
            >
              Join CSI
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-colors"
            >
              Browse events
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default CTA
