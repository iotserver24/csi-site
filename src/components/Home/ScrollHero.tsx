'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const FRAME_COUNT = 72
const FRAME_PAD = 3
const frameSrc = (i: number) =>
  `/scroll-frames/frame-${String(i).padStart(FRAME_PAD, '0')}.webp`

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

const ScrollHero: React.FC = () => {
  const { user, signInWithGoogle, authLoading } = useAuth()
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesRef = useRef<(HTMLImageElement | null)[]>([])
  const frameRef = useRef(0)
  const rafRef = useRef(0)
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const [loadPct, setLoadPct] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  // prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReducedMotion(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Prefer requested frame; fall back to nearest loaded frame so we never blank out
    let img = imagesRef.current[index]
    if (!img?.complete || !img.naturalWidth) {
      for (let d = 1; d < FRAME_COUNT; d++) {
        const a = imagesRef.current[index - d]
        const b = imagesRef.current[index + d]
        if (a?.complete && a.naturalWidth) {
          img = a
          break
        }
        if (b?.complete && b.naturalWidth) {
          img = b
          break
        }
      }
    }
    if (!img?.complete || !img.naturalWidth) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 0
    const h = canvas.clientHeight || canvas.parentElement?.clientHeight || 0
    if (w === 0 || h === 0) return

    const needW = Math.round(w * dpr)
    const needH = Math.round(h * dpr)
    if (canvas.width !== needW || canvas.height !== needH) {
      canvas.width = needW
      canvas.height = needH
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // cover-fit
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
    const dw = img.naturalWidth * scale
    const dh = img.naturalHeight * scale
    const dx = (w - dw) / 2
    const dy = (h - dh) / 2
    ctx.drawImage(img, dx, dy, dw, dh)
  }, [])

  // Preload frames
  useEffect(() => {
    if (reducedMotion) {
      setReady(true)
      return
    }

    let cancelled = false
    const images: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null)
    imagesRef.current = images
    let loaded = 0

    const onOne = () => {
      if (cancelled) return
      loaded += 1
      setLoadPct(Math.round((loaded / FRAME_COUNT) * 100))
      if (loaded >= FRAME_COUNT) {
        setReady(true)
        drawFrame(0)
      } else if (loaded === 1) {
        // first frame ASAP for paint
        drawFrame(0)
      }
    }

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image()
      img.decoding = 'async'
      img.src = frameSrc(i)
      img.onload = onOne
      img.onerror = onOne
      images[i] = img
    }

    return () => {
      cancelled = true
    }
  }, [reducedMotion, drawFrame])

  // Scroll → frame
  useEffect(() => {
    if (reducedMotion) return

    const onScroll = () => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0
        const section = sectionRef.current
        if (!section) return

        const rect = section.getBoundingClientRect()
        const scrollable = section.offsetHeight - window.innerHeight
        if (scrollable <= 0) return

        // how far we've scrolled through the pin section
        const scrolled = clamp(-rect.top, 0, scrollable)
        const p = scrolled / scrollable
        const idx = Math.round(p * (FRAME_COUNT - 1))

        setProgress(p)
        frameRef.current = idx
        drawFrame(idx)
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [reducedMotion, drawFrame, ready])

  // Redraw on resize when ready
  useEffect(() => {
    if (!ready || reducedMotion) return
    const onResize = () => drawFrame(frameRef.current)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [ready, reducedMotion, drawFrame])

  const introOpacity = reducedMotion ? 1 : clamp(1 - progress * 2.2, 0, 1)
  const midOpacity = reducedMotion
    ? 0
    : progress > 0.28 && progress < 0.72
      ? clamp(1 - Math.abs(progress - 0.5) * 5, 0, 1)
      : 0
  const endOpacity = reducedMotion ? 0 : clamp((progress - 0.72) / 0.22, 0, 1)
  const perspective = reducedMotion ? 0 : (progress - 0.5) * 8

  return (
    <section
      ref={sectionRef}
      className={`relative ${reducedMotion ? 'min-h-[88vh]' : 'h-[220vh]'}`}
      aria-label="CSI cinematic intro"
    >
      <div
        className={`${reducedMotion ? 'relative' : 'sticky top-0'} h-screen min-h-[560px] w-full overflow-hidden bg-gray-950`}
      >
        {/* Frame canvas / fallback */}
        <div
          className="absolute inset-0"
          style={{
            transform: reducedMotion
              ? undefined
              : `perspective(1200px) rotateX(${perspective * 0.15}deg) scale(${1 + progress * 0.04})`,
            transformOrigin: 'center center',
          }}
        >
          {reducedMotion ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/hero.jpg"
              alt="CSI NMAMIT community"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full"
              aria-hidden
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/70" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(59,130,246,0.35) 0%, transparent 55%)',
            }}
          />
        </div>

        {/* Loading */}
        {!ready && !reducedMotion && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-950 text-white">
            <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-primary-500 transition-all duration-200"
                style={{ width: `${loadPct}%` }}
              />
            </div>
            <p className="mt-3 text-xs tracking-widest uppercase text-white/50">Loading sequence</p>
          </div>
        )}

        {/* Overlays */}
        <div className="relative z-10 flex h-full flex-col">
          <div className="container-custom flex flex-1 flex-col justify-center pt-24 pb-16">
            {/* Intro copy */}
            <div
              className="max-w-2xl transition-opacity duration-150"
              style={{ opacity: introOpacity, pointerEvents: introOpacity < 0.15 ? 'none' : 'auto' }}
            >
              <div className="mb-5 inline-flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur">
                  <Sparkles size={13} className="text-primary-300" />
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

              <h1 className="mb-4 text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
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
                Computer Society of India student chapter at NMAMIT — workshops, hackathons, talks,
                and a community of people who actually build.
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
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3 font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
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
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3 font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
                    >
                      Join CSI
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mid beat */}
            <div
              className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center transition-opacity duration-150"
              style={{ opacity: midOpacity }}
              aria-hidden={midOpacity < 0.05}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-300 mb-3">
                Campus tech culture
              </p>
              <p className="mx-auto max-w-xl text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Learn by building — with peers who care about the craft.
              </p>
            </div>

            {/* End beat */}
            <div
              className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center transition-opacity duration-150"
              style={{ opacity: endOpacity }}
              aria-hidden={endOpacity < 0.05}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300 mb-3">
                2026–27 season
              </p>
              <p className="mx-auto max-w-xl text-2xl font-bold tracking-tight text-white sm:text-4xl">
                Workshops. Hackathons. Community.
              </p>
            </div>
          </div>

          {/* Scroll hint + progress */}
          {!reducedMotion && (
            <div className="absolute bottom-6 left-0 right-0 z-10 flex flex-col items-center gap-3">
              <div
                className="flex flex-col items-center gap-1 text-white/60 transition-opacity"
                style={{ opacity: introOpacity }}
              >
                <span className="text-[10px] font-medium uppercase tracking-[0.18em]">Scroll to explore</span>
                <ChevronDown size={18} className="animate-bounce" />
              </div>
              <div className="h-0.5 w-40 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-white/80 transition-[width] duration-75"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default ScrollHero
