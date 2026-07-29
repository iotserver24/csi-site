'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'

interface HighlightItem {
  id: number
  image: string
  title: string
}

const highlights: HighlightItem[] = [
  { id: 1, image: '/highlights/event (1).jpg', title: 'Campus tech night' },
  { id: 2, image: '/highlights/event (2).jpg', title: 'Hackathon floor' },
  { id: 3, image: '/highlights/event (3).jpg', title: 'Workshop session' },
  { id: 4, image: '/highlights/event (4).jpg', title: 'Hands-on lab' },
  { id: 5, image: '/highlights/event (5).jpg', title: 'Guest talk' },
  { id: 6, image: '/highlights/event (6).jpg', title: 'Team huddle' },
  { id: 7, image: '/highlights/event (7).jpg', title: 'Demo day' },
  { id: 8, image: '/highlights/event (8).jpg', title: 'Community meetup' },
  { id: 9, image: '/highlights/event (9).jpg', title: 'Closing ceremony' },
]

const Highlights: React.FC = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.08 })
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)

  const open = (index: number) => setCurrentIndex(index)
  const close = () => setCurrentIndex(null)
  const prev = () => setCurrentIndex(i => (i === null ? 0 : (i + highlights.length - 1) % highlights.length))
  const next = () => setCurrentIndex(i => (i === null ? 0 : (i + 1) % highlights.length))

  const selected = currentIndex !== null ? highlights[currentIndex] : null

  return (
    <section className="py-20 sm:py-28 relative bg-[#07080d] text-white border-t border-white/5" ref={ref}>
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 sm:mb-14"
        >
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-300/90 mb-3">
              // capture reel
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              Event highlights
            </h2>
          </div>
          <p className="text-white/45 max-w-sm md:text-right text-sm leading-relaxed">
            Moments from workshops, hackathons, and chapter events across campus.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 auto-rows-[160px] sm:auto-rows-[220px]">
          {highlights.map((item, index) => (
            <motion.button
              type="button"
              key={item.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: index * 0.03 }}
              className={`relative overflow-hidden rounded-2xl group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950
                ${index === 0 ? 'md:col-span-2' : ''}`}
              onClick={() => open(index)}
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 flex items-end justify-between gap-2">
                <h3 className="text-white text-sm sm:text-base font-semibold">{item.title}</h3>
                <Maximize2 size={16} className="text-white/80 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {selected && currentIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-24 bg-black/90 backdrop-blur-sm"
              onClick={close}
            >
              <motion.div
                initial={{ scale: 0.96 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.96 }}
                className="relative max-w-5xl w-full"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={close}
                  className="absolute -top-12 right-0 sm:top-4 sm:right-4 z-10 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  aria-label="Close"
                >
                  <X size={22} />
                </button>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  aria-label="Previous"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  aria-label="Next"
                >
                  <ChevronRight size={22} />
                </button>
                <div className="relative w-full aspect-[16/10] max-h-[75vh] rounded-xl overflow-hidden bg-black">
                  <Image
                    src={selected.image}
                    alt={selected.title}
                    fill
                    sizes="90vw"
                    className="object-contain"
                  />
                </div>
                <p className="mt-3 text-center text-white font-medium">{selected.title}</p>
                <p className="text-center text-white/50 text-xs mt-1">
                  {currentIndex + 1} / {highlights.length}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

export default Highlights
