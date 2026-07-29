'use client'

/**
 * Apple-style scroll-scrub hero
 * Video → image sequence → sticky full-bleed canvas → scroll maps to frame index.
 * Copy sits above the sequence (z-index), not inside the canvas.
 * Pattern: preload frames → sticky pin → progress = scrollInSection / scrollRange → draw frame.
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

/** Must match public/scroll-frames/frame-XXX.webp count */
const FRAME_COUNT = 75
const frameSrc = (i: number) =>
  `/scroll-frames/frame-${String(i).padStart(3, '0')}.webp`

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

const ScrollHero: React.FC = () => {
  const { user, signInWithGoogle, authLoading } = useAuth()

  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesRef = useRef<HTMLImageElement[]>([])
  const drawnRef = useRef(-1)
  const targetRef = useRef(0)
  const tickingRef = useRef(false)
  const readyRef = useRef(false)

  const [ready, setReady] = useState(false)
  const [loadPct, setLoadPct] = useState(0)
  const [progress, setProgress] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReducedMotion(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  /** Cover-fit draw of frame index onto canvas */
  const paint = (index: number) => {
    const canvas = canvasRef.current
    const img = imagesRef.current[index]
    if (!canvas || !img?.naturalWidth) return false

    const parent = canvas.parentElement
    const cssW = parent?.clientWidth || canvas.clientWidth
    const cssH = parent?.clientHeight || canvas.clientHeight
    if (!cssW || !cssH) return false

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const bw = Math.round(cssW * dpr)
    const bh = Math.round(cssH * dpr)
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw
      canvas.height = bh
    }

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return false

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const scale = Math.max(cssW / img.naturalWidth, cssH / img.naturalHeight)
    const dw = img.naturalWidth * scale
    const dh = img.naturalHeight * scale
    const dx = (cssW - dw) / 2
    const dy = (cssH - dh) / 2
    ctx.drawImage(img, dx, dy, dw, dh)
    drawnRef.current = index
    return true
  }

  // Preload entire sequence (Apple / Scrollsequence pattern)
  useEffect(() => {
    if (reducedMotion) {
      readyRef.current = true
      setReady(true)
      return
    }

    let cancelled = false
    const imgs: HTMLImageElement[] = []
    imagesRef.current = imgs
    let loaded = 0

    const bump = () => {
      if (cancelled) return
      loaded += 1
      setLoadPct(Math.round((loaded / FRAME_COUNT) * 100))

      // First good frame → paint immediately so UI isn't empty
      if (loaded === 1 || (imgs[0]?.naturalWidth && drawnRef.current < 0)) {
        paint(0)
      }

      if (loaded >= FRAME_COUNT) {
        readyRef.current = true
        setReady(true)
        paint(targetRef.current)
      }
    }

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image()
      img.decoding = 'async'
      // sequential decode hint for smoother scrub after load
      img.src = frameSrc(i)
      img.onload = bump
      img.onerror = bump
      imgs.push(img)
    }

    return () => {
      cancelled = true
    }
  }, [reducedMotion])

  // Scroll → frame (single source of truth; rAF coalesced)
  useEffect(() => {
    if (reducedMotion) return

    const readProgress = () => {
      const section = sectionRef.current
      if (!section) return 0
      const total = section.offsetHeight - window.innerHeight
      if (total <= 0) return 0
      const scrolled = clamp(-section.getBoundingClientRect().top, 0, total)
      return scrolled / total
    }

    const tick = () => {
      tickingRef.current = false
      const p = readProgress()
      targetRef.current = Math.min(
        FRAME_COUNT - 1,
        Math.floor(p * FRAME_COUNT)
      )
      setProgress(p)

      if (targetRef.current !== drawnRef.current) {
        // Prefer exact frame; if still loading, nearest loaded
        let idx = targetRef.current
        if (!imagesRef.current[idx]?.naturalWidth) {
          for (let d = 1; d < FRAME_COUNT; d++) {
            if (imagesRef.current[idx - d]?.naturalWidth) {
              idx = idx - d
              break
            }
            if (imagesRef.current[idx + d]?.naturalWidth) {
              idx = idx + d
              break
            }
          }
        }
        paint(idx)
      }
    }

    const onScrollOrResize = () => {
      if (tickingRef.current) return
      tickingRef.current = true
      requestAnimationFrame(tick)
    }

    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize, { passive: true })
    tick()

    return () => {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [reducedMotion, ready])

  // Copy beats tied to scroll (text ABOVE frames)
  const phase =
    progress < 0.22 ? 0 : progress < 0.55 ? 1 : progress < 0.82 ? 2 : 3

  const phaseOpacity = (id: number) => {
    if (reducedMotion) return id === 0 ? 1 : 0
    // soft crossfade windows
    const centers = [0.08, 0.38, 0.68, 0.92]
    const dist = Math.abs(progress - centers[id])
    return clamp(1 - dist * 4.2, 0, 1)
  }

  return (
    <section
      ref={sectionRef}
      // Tall track = more scroll distance → smoother “live” scrub
      className={reducedMotion ? 'relative min-h-[90vh]' : 'relative h-[320vh]'}
      aria-label="CSI scroll animation"
    >
      {/* Sticky stage: frames full-bleed, UI layered on top */}
      <div
        className={
          reducedMotion
            ? 'relative min-h-[90vh] w-full bg-black'
            : 'sticky top-0 h-screen w-full overflow-hidden bg-black'
        }
      >
        {/* LAYER 0 — frame sequence (the “video”) */}
        {reducedMotion ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/hero.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full block"
            aria-hidden
          />
        )}

        {/* LAYER 1 — readability scrim (keeps text crisp over bright frames) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.75) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(37,99,235,0.25) 0%, transparent 60%)',
          }}
        />

        {/* Loading gate */}
        {!ready && !reducedMotion && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 text-white">
            <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-sky-400 transition-all duration-150"
                style={{ width: `${loadPct}%` }}
              />
            </div>
            <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">
              Loading animation · {loadPct}%
            </p>
          </div>
        )}

        {/* LAYER 2 — UI / text ABOVE the sequence */}
        <div className="relative z-10 flex h-full flex-col">
          <div className="container-custom relative flex flex-1 flex-col justify-center pt-28 pb-20">
            {/* Phase 0 — intro + CTAs */}
            <div
              className="max-w-2xl transition-opacity duration-200"
              style={{
                opacity: phaseOpacity(0),
                pointerEvents: phase === 0 ? 'auto' : 'none',
              }}
            >
              <div className="mb-5 inline-flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur-md">
                  <Sparkles size={13} className="text-sky-300" />
                  <span className="text-xs font-semibold tracking-wide text-white/90">
                    CSI NMAMIT · NMAM Institute of Technology
                  </span>
                </span>
                <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                    Membership open
                  </span>
                </span>
              </div>

              <h1 className="mb-4 text-4xl font-bold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-6xl">
                {user ? (
                  <>
                    Welcome back,{' '}
                    <span className="bg-gradient-to-r from-sky-300 to-violet-300 bg-clip-text text-transparent">
                      {user.name?.split(' ')[0] || 'member'}
                    </span>
                  </>
                ) : (
                  <>
                    Build skills.
                    <br />
                    Ship projects.
                    <br />
                    <span className="bg-gradient-to-r from-sky-300 to-violet-300 bg-clip-text text-transparent">
                      Grow with CSI.
                    </span>
                  </>
                )}
              </h1>

              <p className="mb-8 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
                Computer Society of India student chapter at NMAMIT — workshops,
                hackathons, talks, and a community of people who actually build.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                {user ? (
                  <>
                    <Link
                      href="/events"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-gray-900 transition-opacity hover:opacity-90"
                    >
                      Explore events
                      <ArrowRight size={18} />
                    </Link>
                    <Link
                      href="/profile"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/15"
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
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-gray-900 transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {authLoading ? 'Signing in…' : 'Get started'}
                      <ArrowRight size={18} />
                    </button>
                    <Link
                      href="/recruit"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/15"
                    >
                      Join CSI
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Phase 1–3 — story lines (centered, pure overlay) */}
            {(
              [
                {
                  id: 1,
                  kicker: 'Hands-on campus tech',
                  title: 'Workshops that ship real skills.',
                },
                {
                  id: 2,
                  kicker: 'Build under pressure',
                  title: 'Hackathons. Demos. Teammates who care.',
                },
                {
                  id: 3,
                  kicker: '2026–27 season',
                  title: 'Your chapter. Your community. Join CSI.',
                },
              ] as const
            ).map(beat => (
              <div
                key={beat.id}
                className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center transition-opacity duration-200"
                style={{ opacity: phaseOpacity(beat.id) }}
                aria-hidden={phaseOpacity(beat.id) < 0.08}
              >
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">
                  {beat.kicker}
                </p>
                <p className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {beat.title}
                </p>
              </div>
            ))}
          </div>

          {/* Scroll affordance + scrub progress */}
          {!reducedMotion && (
            <div className="absolute bottom-7 left-0 right-0 z-20 flex flex-col items-center gap-3">
              <div
                className="flex flex-col items-center gap-1 text-white/55 transition-opacity duration-200"
                style={{ opacity: phaseOpacity(0) }}
              >
                <span className="text-[10px] font-medium uppercase tracking-[0.2em]">
                  Scroll to play
                </span>
                <ChevronDown size={18} className="animate-bounce" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-[3px] w-44 overflow-hidden rounded-full bg-white/15 sm:w-56">
                  <div
                    className="h-full rounded-full bg-white transition-[width] duration-75 ease-out"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <span className="tabular-nums text-[10px] text-white/40">
                  {String(Math.min(FRAME_COUNT, Math.floor(progress * FRAME_COUNT) + 1)).padStart(2, '0')}
                  <span className="text-white/25"> / {FRAME_COUNT}</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default ScrollHero
