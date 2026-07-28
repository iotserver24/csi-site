'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const CTA: React.FC = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 })

  return (
    <section className="py-20 sm:py-24 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-surface-dark" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(59,130,246,0.25) 0%, transparent 60%)',
        }}
      />

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-medium tracking-widest uppercase text-gray-400">
              2026–27 membership open
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            Ready to build with CSI NMAMIT?
          </h2>
          <p className="text-gray-400 mb-9 leading-relaxed">
            Join the chapter for workshops, hackathons, and a campus community that ships.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/recruit"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-gray-900 font-semibold hover:bg-gray-100 transition-colors"
            >
              Join CSI
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-gray-600 text-gray-300 font-semibold hover:border-gray-400 hover:text-white transition-colors"
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
