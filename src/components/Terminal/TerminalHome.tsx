'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api-client'
import type { Event } from '../../types'
import { formatEventDate } from '../../utils/eventUtils'
import { TermMedia, TermThumb } from './TermMedia'

type BootLine = { text: string; ok?: boolean; dim?: boolean; delay: number }

const BOOT_LINES: BootLine[] = [
  { text: 'CSI NMAMIT bootloader v2.6.27', dim: true, delay: 0 },
  { text: 'Copyright (c) Computer Society of India · NMAMIT chapter', dim: true, delay: 100 },
  { text: '', delay: 180 },
  { text: 'Restarting system…', delay: 260 },
  { text: '[    0.000] kernel: csi-core 6.1.0-nmamit', dim: true, delay: 400 },
  { text: '[    0.041] init: mounting virtual filesystems', dim: true, delay: 520 },
  { text: '[  OK  ] Mounted /chapter', ok: true, delay: 680 },
  { text: '[  OK  ] Started network.target', ok: true, delay: 800 },
  { text: '[  OK  ] Loaded firebase.auth', ok: true, delay: 940 },
  { text: '[  OK  ] Connected events.postgres', ok: true, delay: 1100 },
  { text: '[  OK  ] Loaded framebuffer /dev/fb0 (sixel)', ok: true, delay: 1240 },
  { text: '[  OK  ] Loaded module media.viewer', ok: true, delay: 1380 },
  { text: '[  OK  ] Loaded module workshops.service', ok: true, delay: 1520 },
  { text: '[  OK  ] Membership season 2026-27 · open', ok: true, delay: 1680 },
  { text: '', delay: 1800 },
  { text: 'System restart complete.', delay: 1940 },
  { text: 'Dropping into interactive shell…', dim: true, delay: 2100 },
]

const GALLERY = [
  { src: '/hero.jpg', path: 'media/hero.jpg', label: 'chapter_night.jpg' },
  { src: '/team.jpg', path: 'media/team.jpg', label: 'core_team.jpg' },
  { src: '/highlights/event (1).jpg', path: 'media/hl-01.jpg', label: 'campus_tech.jpg' },
  { src: '/highlights/event (2).jpg', path: 'media/hl-02.jpg', label: 'hackathon.jpg' },
  { src: '/highlights/event (3).jpg', path: 'media/hl-03.jpg', label: 'workshop.jpg' },
  { src: '/highlights/event (5).jpg', path: 'media/hl-05.jpg', label: 'guest_talk.jpg' },
  { src: '/highlights/event (7).jpg', path: 'media/hl-07.jpg', label: 'demo_day.jpg' },
  { src: '/highlights/event (9).jpg', path: 'media/hl-09.jpg', label: 'closing.jpg' },
]

const PROGRAMS = [
  { name: 'workshops/', desc: '30+ labs / year · web cloud AI security', icon: '01' },
  { name: 'hackathons/', desc: '10+ sprints · teams · demos', icon: '02' },
  { name: 'talks/', desc: '20+ sessions · alumni · industry', icon: '03' },
  { name: 'showcases/', desc: '15+ demos · portfolio pieces', icon: '04' },
]

function pickUpcoming(events: Event[]): Event[] {
  const now = Date.now()
  return events
    .filter(e => e.published !== false)
    .map(e => {
      const year = Number(e.year || String(e.date || '').slice(0, 4)) || 0
      const t = e.date
        ? e.date instanceof Date
          ? e.date.getTime()
          : Date.parse(String(e.date))
        : NaN
      const upcoming =
        e.category === 'UPCOMING' ||
        e.registrationsAvailable === true ||
        year >= 2026 ||
        (!Number.isNaN(t) && t >= now - 86400000)
      return { e, upcoming, t: Number.isNaN(t) ? year * 1e12 : t }
    })
    .filter(x => x.upcoming)
    .sort((a, b) => a.t - b.t)
    .slice(0, 4)
    .map(x => x.e)
}

const CWD = '~/chapter'

function Prompt({ host, children }: { host: string; children: React.ReactNode }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-0 font-mono text-[13px]">
      <span className="text-emerald-400">{host}</span>
      <span className="text-white/25">:</span>
      <span className="text-sky-400">{CWD}</span>
      <span className="text-white/45">$&nbsp;</span>
      <span className="text-white/90">{children}</span>
    </p>
  )
}

function Box({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded border border-emerald-500/20 bg-[#0a0e0a]/90 overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between border-b border-emerald-500/15 bg-emerald-950/40 px-3 py-1.5 font-mono text-[10px] text-emerald-500/80">
        <span>┌─ {title} ─┐</span>
        <span className="text-emerald-700/70">pane</span>
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </div>
  )
}

export default function TerminalHome() {
  const { user, signInWithGoogle, authLoading } = useAuth()
  const [bootVisible, setBootVisible] = useState(true)
  const [shownBoot, setShownBoot] = useState(0)
  const [bootDone, setBootDone] = useState(false)
  const [cursorOn, setCursorOn] = useState(true)
  const [cmd, setCmd] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [focusImg, setFocusImg] = useState(0)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const bootEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)

  const userLabel = user?.name?.split(' ')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'guest'
  const promptHost = `${userLabel}@csi-nmamit`
  const activeGallery = GALLERY[focusImg] ?? GALLERY[0]

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    BOOT_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setShownBoot(i + 1), line.delay))
    })
    timers.push(
      setTimeout(() => {
        setBootDone(true)
        setTimeout(() => setBootVisible(false), 450)
      }, 2650)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    bootEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [shownBoot])

  useEffect(() => {
    const id = setInterval(() => setCursorOn(c => !c), 530)
    return () => clearInterval(id)
  }, [])

  // Auto-cycle gallery focus like a slideshow in the media pane
  useEffect(() => {
    if (bootVisible) return
    const id = setInterval(() => setFocusImg(i => (i + 1) % GALLERY.length), 5000)
    return () => clearInterval(id)
  }, [bootVisible])

  useEffect(() => {
    if (bootVisible) return
    inputRef.current?.focus()
    let cancelled = false
    api
      .get('/api/events')
      .then(body => {
        if (cancelled) return
        const rows = Array.isArray(body.events) ? (body.events as Event[]) : []
        setEvents(pickUpcoming(rows))
      })
      .catch(() => {
        if (!cancelled) setEvents([])
      })
      .finally(() => {
        if (!cancelled) setEventsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [bootVisible])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const runCommand = useCallback(
    (raw: string) => {
      const c = raw.trim().toLowerCase()
      if (!c) return
      setHistory(h => [...h.slice(-16), c])

      if (c === 'help' || c === '?') {
        setHistory(h => [
          ...h,
          '__out:cmds: help · whoami · img · gallery · events · join · login · team · clear · reboot · exit',
        ])
        return
      }
      if (c === 'clear' || c === 'cls') {
        setHistory([])
        return
      }
      if (c === 'whoami') {
        setHistory(h => [
          ...h,
          user
            ? `__out:${user.name || 'member'} · ${user.email || 'authenticated'}`
            : '__out:guest (run `login`)',
        ])
        return
      }
      if (c === 'img' || c === 'gallery' || c === 'feh' || c === 'open media') {
        setHistory(h => [...h, '__out:media pane focused — click thumbs or wait for slideshow'])
        setFocusImg(0)
        shellRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      if (c === 'login' || c === 'auth') {
        if (user) setHistory(h => [...h, '__out:already authenticated'])
        else void signInWithGoogle()
        return
      }
      if (c === 'join' || c === 'recruit') {
        window.location.href = '/recruit'
        return
      }
      if (c === 'events' || c === 'ls events') {
        window.location.href = '/events'
        return
      }
      if (c === 'team') {
        window.location.href = '/team'
        return
      }
      if (c === 'home' || c === 'exit' || c === 'cd /') {
        window.location.href = '/'
        return
      }
      if (c === 'reboot' || c === 'restart') {
        window.location.reload()
        return
      }
      setHistory(h => [...h, `__out:command not found: ${raw} — try \`help\``])
    },
    [user, signInWithGoogle]
  )

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    runCommand(cmd)
    setCmd('')
  }

  const visibleBoot = useMemo(() => BOOT_LINES.slice(0, shownBoot), [shownBoot])

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#070a07] text-[#c8e6c9] font-mono text-[13px] sm:text-sm selection:bg-emerald-500/30">
      {/* subtle terminal grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(16,185,129,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.5) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* BOOT */}
      {bootVisible && (
        <div
          className={`absolute inset-0 z-50 flex flex-col bg-black transition-opacity duration-500 ${
            bootDone ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          aria-live="polite"
          aria-busy={!bootDone}
        >
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
            <p className="text-[10px] text-emerald-700 mb-4 tracking-wide">
              CSI NMAMIT · system console · restart
            </p>
            <pre className="whitespace-pre-wrap leading-relaxed">
              {visibleBoot.map((line, i) => (
                <div key={i} className="min-h-[1.35em]">
                  {line.ok ? (
                    <span>
                      <span className="text-emerald-400">[  OK  ]</span>
                      <span className="text-white/70">{line.text.replace('[  OK  ]', '')}</span>
                    </span>
                  ) : line.dim ? (
                    <span className="text-white/40">{line.text}</span>
                  ) : (
                    <span className="text-white/85">{line.text}</span>
                  )}
                </div>
              ))}
              {!bootDone && (
                <span
                  className={`inline-block w-2 h-4 ml-0.5 align-middle bg-emerald-400 ${
                    cursorOn ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )}
              <div ref={bootEndRef} />
            </pre>
            <div className="mt-8 max-w-md">
              <div className="flex justify-between text-[10px] text-white/35 mb-1.5">
                <span>systemd[1]: restart</span>
                <span>{Math.min(100, Math.round((shownBoot / BOOT_LINES.length) * 100))}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-200"
                  style={{ width: `${Math.min(100, (shownBoot / BOOT_LINES.length) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Title bar */}
      {!bootVisible && (
        <div className="relative z-10 flex items-center justify-between gap-3 border-b border-emerald-500/20 bg-[#0c120c] px-3 py-2.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex gap-1.5 shrink-0">
              <Link
                href="/"
                className="h-3 w-3 rounded-full bg-[#ff5f57] hover:brightness-110"
                title="Back to main site"
                aria-label="Close terminal"
              />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="truncate text-[11px] text-emerald-500/60">
              csi-nmamit — tty1 — media+shell — {CWD}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-emerald-600/50 shrink-0">
            <span className="hidden sm:inline">experiment /1</span>
            <Link href="/" className="text-emerald-400/90 hover:text-emerald-300 underline-offset-2 hover:underline">
              exit → /
            </Link>
          </div>
        </div>
      )}

      {/* SHELL + MEDIA UI */}
      <div
        ref={shellRef}
        className={`relative z-10 flex-1 overflow-y-auto ${bootVisible ? 'invisible' : 'visible'}`}
      >
        <div className="mx-auto max-w-6xl px-3 sm:px-5 py-4 sm:py-6 space-y-5">
          {/* Header banner + hero media */}
          <div className="grid lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 space-y-3">
              <pre className="text-[9px] sm:text-[10px] leading-[1.15] text-emerald-500/85 overflow-x-auto select-none">
{` ██████╗███████╗██╗
██╔════╝██╔════╝██║  NMAMIT
██║     ███████╗██║  terminal UI
██║     ╚════██║██║  experiment
╚██████╗███████║██║
 ╚═════╝╚══════╝╚═╝`}
              </pre>
              <Box title="motd">
                <p className="text-emerald-100/80 text-sm leading-relaxed mb-3">
                  {user ? (
                    <>
                      session · <span className="text-emerald-300">{user.name}</span>
                    </>
                  ) : (
                    <>
                      Build. Ship. Belong. — membership{' '}
                      <span className="text-emerald-300">open 2026–27</span>
                    </>
                  )}
                </p>
                <p className="text-[11px] text-emerald-600/70 mb-3">
                  type <span className="text-emerald-400">help</span> ·{' '}
                  <span className="text-emerald-400">img</span> ·{' '}
                  <span className="text-emerald-400">events</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {user ? (
                    <>
                      <Link
                        href="/events"
                        className="px-3 py-1.5 rounded border border-emerald-500/40 text-emerald-300 text-xs hover:bg-emerald-500/10"
                      >
                        ./events
                      </Link>
                      <Link
                        href="/profile"
                        className="px-3 py-1.5 rounded border border-emerald-500/20 text-emerald-500/80 text-xs hover:bg-emerald-500/5"
                      >
                        ./profile
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => void signInWithGoogle()}
                        disabled={authLoading}
                        className="px-3 py-1.5 rounded border border-emerald-500/40 text-emerald-300 text-xs hover:bg-emerald-500/10 disabled:opacity-50"
                      >
                        {authLoading ? 'auth…' : './login'}
                      </button>
                      <Link
                        href="/recruit"
                        className="px-3 py-1.5 rounded border border-sky-500/35 text-sky-300 text-xs hover:bg-sky-500/10"
                      >
                        ./join
                      </Link>
                    </>
                  )}
                </div>
              </Box>

              <div className="grid grid-cols-3 gap-2">
                {[
                  ['500+', 'members'],
                  ['50+', 'events/yr'],
                  ['10y+', 'uptime'],
                ].map(([v, k]) => (
                  <div
                    key={k}
                    className="rounded border border-emerald-500/20 bg-[#0a0e0a] px-2 py-2.5 text-center"
                  >
                    <p className="text-emerald-300 text-base font-semibold">{v}</p>
                    <p className="text-[10px] text-emerald-700 uppercase tracking-wider">{k}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 space-y-2">
              <Prompt host={promptHost}>feh -F {activeGallery.path}</Prompt>
              <TermMedia
                src={activeGallery.src}
                alt={activeGallery.label}
                path={activeGallery.path}
                caption={`▶ ${activeGallery.label}  ·  ${focusImg + 1}/${GALLERY.length}`}
                aspect="aspect-[16/10]"
                priority
                onClick={() => setLightbox(activeGallery.src)}
              />
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {GALLERY.map((g, i) => (
                  <button
                    key={g.path}
                    type="button"
                    onClick={() => setFocusImg(i)}
                    className={`relative aspect-square overflow-hidden rounded border transition ${
                      i === focusImg
                        ? 'border-emerald-400 ring-1 ring-emerald-400/40'
                        : 'border-emerald-500/15 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={g.src}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover contrast-[1.05] saturate-[0.3] hue-rotate-[70deg]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-black/20" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Identity */}
          <div className="space-y-1">
            <Prompt host={promptHost}>whoami --verbose</Prompt>
            <Box title="identity@csi-nmamit">
              <p className="text-emerald-100/75 leading-relaxed text-sm">
                Computer Society of India student chapter at NMAMIT — workshops, hackathons, talks,
                and a campus community that ships.
              </p>
            </Box>
          </div>

          {/* Programs */}
          <div className="space-y-1">
            <Prompt host={promptHost}>ls -la programs/</Prompt>
            <div className="grid sm:grid-cols-2 gap-2">
              {PROGRAMS.map(p => (
                <div
                  key={p.name}
                  className="flex gap-3 rounded border border-emerald-500/15 bg-[#0a0e0a] px-3 py-3 hover:border-emerald-500/35 transition-colors"
                >
                  <span className="text-emerald-600 text-xs font-mono pt-0.5">{p.icon}</span>
                  <div>
                    <p className="text-sky-400 text-sm">{p.name}</p>
                    <p className="text-[11px] text-emerald-700/90">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Events with images */}
          <div className="space-y-2">
            <Prompt host={promptHost}>ls -la events/upcoming/ --images</Prompt>
            {eventsLoading ? (
              <p className="text-emerald-700 animate-pulse pl-1">fetching calendar…</p>
            ) : events.length === 0 ? (
              <Box title="events.queue">
                <p className="text-emerald-600/80 text-sm mb-2">(empty) season queue warming up</p>
                <Link href="/events" className="text-sky-400 text-xs hover:underline">
                  open full archive →
                </Link>
              </Box>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {events.map(ev => (
                  <Link key={ev.id} href="/events" className="block group">
                    <TermMedia
                      src={ev.image || '/csi-logo.png'}
                      alt={ev.title}
                      path={`events/${String(ev.id).slice(0, 12)}.img`}
                      caption={`${ev.type || 'EVENT'} · ${
                        ev.date ? formatEventDate(String(ev.date)) : ev.year || 'TBA'
                      }`}
                      aspect="aspect-[16/10]"
                      unoptimized={Boolean(ev.image)}
                      phosphor
                    />
                    <p className="mt-1.5 px-1 text-sm text-emerald-200/85 group-hover:text-emerald-100 truncate">
                      {ev.title}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Gallery grid */}
          <div className="space-y-2">
            <Prompt host={promptHost}>tree media/highlights/</Prompt>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GALLERY.map((g, i) => (
                <TermThumb
                  key={g.path}
                  src={g.src}
                  label={g.label}
                  path={g.path}
                  onClick={() => {
                    setFocusImg(i)
                    setLightbox(g.src)
                  }}
                />
              ))}
            </div>
          </div>

          {/* History */}
          {history.map((line, i) =>
            line.startsWith('__out:') ? (
              <p key={i} className="text-emerald-600/90 pl-1">
                {line.slice(6)}
              </p>
            ) : (
              <Prompt key={i} host={promptHost}>
                {line}
              </Prompt>
            )
          )}

          {/* Live prompt */}
          <form onSubmit={onSubmit} className="flex flex-wrap items-center pb-20 pt-2">
            <span className="text-emerald-400">{promptHost}</span>
            <span className="text-white/25">:</span>
            <span className="text-sky-400">{CWD}</span>
            <span className="text-white/45">$&nbsp;</span>
            <input
              ref={inputRef}
              value={cmd}
              onChange={e => setCmd(e.target.value)}
              className="flex-1 min-w-[10rem] bg-transparent outline-none text-emerald-100 caret-emerald-400"
              autoComplete="off"
              spellCheck={false}
              aria-label="Terminal command"
            />
            {!cmd && (
              <span
                className={`-ml-2 w-2 h-4 bg-emerald-400 pointer-events-none ${
                  cursorOn ? 'opacity-100' : 'opacity-0'
                }`}
                aria-hidden
              />
            )}
          </form>
        </div>
      </div>

      {/* Lightbox — still terminal styled */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/92 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={e => e.stopPropagation()}
          >
            <TermMedia
              src={lightbox}
              alt="preview"
              path="preview://fullscreen"
              caption="press esc / click outside · CRT preview"
              aspect="aspect-video"
              phosphor
            />
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="mt-3 w-full font-mono text-xs text-emerald-500 hover:text-emerald-300 border border-emerald-500/30 py-2 rounded"
            >
              [ close ]
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
