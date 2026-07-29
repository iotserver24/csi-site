'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    name: 'Rahul Sharma',
    role: 'Final Year, CSE',
    content:
      'CSI workshops and hackathons gave me real project experience — the kind that actually shows up in interviews and on a resume.',
  },
  {
    id: 2,
    name: 'Priya Patel',
    role: 'Third Year, ISE',
    content:
      'The chapter is where I found seniors who mentored me and teammates for every build. Networking felt natural, not forced.',
  },
  {
    id: 3,
    name: 'Arjun Kumar',
    role: 'Alumni · Software Engineer',
    content:
      'Problem-solving under pressure and working in teams at CSI still pay off in my day job. The foundation stuck.',
  },
]

const Testimonials: React.FC = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [currentIndex, setCurrentIndex] = useState(0)

  const next = () => setCurrentIndex(prev => (prev + 1) % testimonials.length)
  const prev = () => setCurrentIndex(prev => (prev - 1 + testimonials.length) % testimonials.length)

  return (
    <section className="py-14 sm:py-28 bg-white dark:bg-[#05060a] text-gray-900 dark:text-white border-y border-gray-100 dark:border-white/5 overflow-x-hidden" ref={ref}>
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-12"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-pink-600 dark:text-pink-300/90 mb-3">
            // signal
          </p>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Voices from CSI
          </h2>
          <p className="text-gray-500 dark:text-white/45 max-w-xl mx-auto text-sm sm:text-base">
            Members and alumni on what the chapter actually meant for them.
          </p>
        </motion.div>

        <div className="relative max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={currentIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl border border-gray-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04] p-8 sm:p-10 text-center backdrop-blur-sm"
            >
              <Quote className="w-8 h-8 text-sky-500/70 dark:text-sky-400/70 mx-auto mb-5" />
              <p className="text-base sm:text-lg text-gray-600 dark:text-white/75 leading-relaxed mb-8">
                “{testimonials[currentIndex].content}”
              </p>
              <footer>
                <p className="font-semibold">{testimonials[currentIndex].name}</p>
                <p className="font-mono text-xs text-gray-400 dark:text-white/40 mt-1">{testimonials[currentIndex].role}</p>
              </footer>
            </motion.blockquote>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={prev}
              className="p-2.5 rounded-full border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-1.5">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to testimonial ${index + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-6 bg-sky-500'
                      : 'w-1.5 bg-gray-300 dark:bg-white/20'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={next}
              className="p-2.5 rounded-full border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
