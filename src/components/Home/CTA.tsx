 'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const CTA: React.FC = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section className="py-24 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-surface-dark" />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle at center bottom, rgba(59,130,246,0.8) 0%, transparent 70%)',
        }}
      />

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 
                          rounded-full border border-white/10 bg-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-none" />
            <span className="text-[11px] font-medium tracking-widest uppercase text-gray-400">
              2025–26 Applications Open
            </span>
          </div>

          <h2 className="heading-2 mb-4 text-white">
            Ready to Join the Tech Revolution?
          </h2>

          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
            Become a part of CSI NMAMIT and unlock endless opportunities to learn, grow, and excel in the world of technology.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/recruit"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-white text-gray-900 font-semibold hover:bg-gray-100 transition-all duration-200 translate-y-0 hover:-translate-y-[1px]"
            >
              <span>Join CSI Now</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg border border-gray-600 text-gray-300 font-semibold hover:border-gray-400 hover:text-white transition-all duration-200 translate-y-0 hover:-translate-y-[1px]"
            >
              Explore Events
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default CTA
