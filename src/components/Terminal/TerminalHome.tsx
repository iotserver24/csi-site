'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api-client'
import type { Event } from '../../types'
import { formatEventDate } from '../../utils/eventUtils'

type BootLine = { text: string; ok?: boolean; dim?: boolean; delay: number }

const BOOT_LINES: BootLine[] = [
  { text: 'CSI NMAMIT bootloader v2.6.27', dim: true, delay: 0 },
  { text: 'Copyright (c) Computer Society of India · NMAMIT chapter', dim: true, delay: 120 },
  { text: '', delay: 200 },
  { text: 'Restarting system…', delay: 280 },
  { text: '[    0.000] kernel: csi-core 6.1.0-nmamit', dim: true, delay: 420 },
  { text: '[    0.041] init: mounting virtual filesystems', dim: true, delay: 560 },
  { text: '[  OK  ] Mounted /chapter', ok: true, delay: 720 },
  { text: '[  OK  ] Started network.target', ok: true, delay: 860 },
  { text: '[  OK  ] Loaded firebase.auth', ok: true, delay: 1000 },
  { text: '[  OK  ] Connected events.postgres', ok: true, delay: 1180 },
  { text: '[  OK  ] Loaded module workshops.service', ok: true, delay: 1340 },
  { text: '[  OK  ] Loaded module hackathons.service', ok: true, delay: 1480 },
  { text: '[  OK  ] Loaded module community.service', ok: true, delay: 1620 },
  { text: '[  OK  ] Membership season 2026-27 · open', ok: true, delay: 1780 },
  { text: '', delay: 1900 },
  { text: 'System restart complete.', delay: 2040 },
  { text: 'Dropping into interactive shell…', dim: true, delay: 2200 },
]

const SECTIONS = [
  {
    cmd: 'whoami',
    title: 'identity',
    body: 'CSI NMAMIT — Computer Society of India student chapter at NMAM Institute of Technology. Workshops, hackathons, talks, and a campus community that ships.',
  },
  {
    cmd: 'cat mission.txt',
    title: 'mission',
    body: 'Build skills. Ship projects. Belong. Hands-on learning over slide decks.',
  },
  {
    cmd: 'ls programs/',
    title: 'programs',
    items: [
      { name: 'workshops/', desc: '30+ labs / year · web cloud AI security' },
      { name: 'hackathons/', desc: '10+ sprints · teams · demos' },
      { name: 'talks/', desc: '20+ sessions · alumni · industry' },
      { name: 'showcases/', desc: '15+ demos · portfolio pieces' },
    ],
  },
] as const

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
  const bootEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)

  const userLabel = user?.name?.split(' ')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'guest'
  const promptHost = `${userLabel}@csi-nmamit`

  // Lock page scroll while terminal owns the viewport
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // Boot sequence
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    BOOT_LINES.forEach((line, i) => {
      timers.push(
        setTimeout(() => {
          setShownBoot(i + 1)
        }, line.delay)
      )
    })
    const finish = setTimeout(() => {
      setBootDone(true)
      setTimeout(() => setBootVisible(false), 450)
    }, 2800)
    timers.push(finish)
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    bootEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [shownBoot])

  useEffect(() => {
    const id = setInterval(() => setCursorOn(c => !c), 530)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!bootVisible) {
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
    }
  }, [bootVisible])

  const runCommand = useCallback(
    (raw: string) => {
      const c = raw.trim().toLowerCase()
      if (!c) return
      setHistory(h => [...h.slice(-12), c])

      if (c === 'help' || c === '?') {
        setHistory(h => [
          ...h,
          '__out:commands: help · whoami · events · join · login · team · clear · exit',
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
            : '__out:guest (run `login` to authenticate)',
        ])
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
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#0c0c0c] text-[#d4d4d4] font-mono text-[13px] sm:text-sm selection:bg-emerald-500/30">
      {/* BOOT — full screen, no site chrome */}
      {bootVisible && (
        <div
          className={`absolute inset-0 z-50 flex flex-col bg-black transition-opacity duration-500 ${
            bootDone ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          aria-live="polite"
          aria-busy={!bootDone}
        >
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
            <p className="text-[10px] text-white/30 mb-4 tracking-wide">CSI NMAMIT · system console · restart</p>
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

      {/* Title bar — only after boot */}
      {!bootVisible && (
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#161616] px-3 py-2.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex gap-1.5 shrink-0">
              <Link
                href="/"
                className="h-3 w-3 rounded-full bg-[#ff5f57] hover:brightness-110"
                title="Back to main site"
                aria-label="Close terminal experiment"
              />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="truncate text-[11px] text-white/50">
              csi-nmamit — zsh — {CWD}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-white/40 shrink-0">
            <span className="hidden sm:inline">experiment /1</span>
            <Link href="/" className="text-emerald-400/80 hover:text-emerald-300 underline-offset-2 hover:underline">
              exit → /
            </Link>
          </div>
        </div>
      )}

      {/* INTERACTIVE SHELL */}
      <div
        ref={shellRef}
        className={`flex-1 overflow-y-auto px-3 sm:px-6 py-4 ${bootVisible ? 'invisible' : 'visible'}`}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Banner */}
          <pre className="text-[10px] sm:text-xs leading-tight text-emerald-500/90 overflow-x-auto select-none">
{`
   ██████╗███████╗██╗    ███╗   ██╗███╗   ███╗ █████╗ ███╗   ███╗██╗████████╗
  ██╔════╝██╔════╝██║    ████╗  ██║████╗ ████║██╔══██╗████╗ ████║██║╚══██╔══╝
  ██║     ███████╗██║    ██╔██╗ ██║██╔████╔██║███████║██╔████╔██║██║   ██║
  ██║     ╚════██║██║    ██║╚██╗██║██║╚██╔╝██║██╔══██║██║╚██╔╝██║██║   ██║
  ╚██████╗███████║██║    ██║ ╚████║██║ ╚═╝ ██║██║  ██║██║ ╚═╝ ██║██║   ██║
   ╚═════╝╚══════╝╚═╝    ╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝   ╚═╝
`}
          </pre>
          <p className="text-white/45 text-xs -mt-4">
            terminal UI experiment · type <span className="text-emerald-400">help</span> ·{' '}
            <Link href="/" className="text-sky-400 hover:underline">
              classic site
            </Link>
          </p>

          {/* Motd */}
          <div className="border border-white/10 rounded-lg bg-[#121212] p-4 space-y-2">
            <p className="text-amber-400/90 text-xs"># message of the day</p>
            <p className="text-white/80">
              {user ? (
                <>
                  session restored for <span className="text-emerald-400">{user.name}</span>
                </>
              ) : (
                <>
                  Build. Ship. Belong. — membership <span className="text-emerald-400">open 2026–27</span>
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
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
                    className="px-3 py-1.5 rounded border border-white/15 text-white/70 text-xs hover:bg-white/5"
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
                    className="px-3 py-1.5 rounded border border-sky-500/40 text-sky-300 text-xs hover:bg-sky-500/10"
                  >
                    ./join
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Static “commands” as content sections */}
          {SECTIONS.map(sec => (
            <div key={sec.cmd} className="space-y-1">
              <p>
                <span className="text-emerald-400">{promptHost}</span>
                <span className="text-white/30">:</span>
                <span className="text-sky-400">{CWD}</span>
                <span className="text-white/50">$ </span>
                <span className="text-white/90">{sec.cmd}</span>
              </p>
              {'body' in sec && sec.body && (
                <p className="text-white/60 pl-0 sm:pl-2 border-l-2 border-white/10 sm:ml-1 sm:pl-3">
                  {sec.body}
                </p>
              )}
              {'items' in sec && sec.items && (
                <ul className="space-y-1 pl-0 sm:pl-2">
                  {sec.items.map(it => (
                    <li key={it.name} className="flex flex-wrap gap-x-3">
                      <span className="text-sky-400">{it.name}</span>
                      <span className="text-white/40">{it.desc}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* Events as ls output */}
          <div className="space-y-1">
            <p>
              <span className="text-emerald-400">{promptHost}</span>
              <span className="text-white/30">:</span>
              <span className="text-sky-400">{CWD}</span>
              <span className="text-white/50">$ </span>
              <span className="text-white/90">ls -la events/upcoming/</span>
            </p>
            {eventsLoading ? (
              <p className="text-white/40 animate-pulse">fetching calendar…</p>
            ) : events.length === 0 ? (
              <p className="text-white/40">
                (empty) — season queue warming up.{' '}
                <Link href="/events" className="text-sky-400 hover:underline">
                  open archive
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {events.map(ev => (
                  <Link
                    key={ev.id}
                    href="/events"
                    className="flex gap-3 items-start group hover:bg-white/[0.03] rounded px-1 -mx-1 py-1"
                  >
                    <div className="relative h-12 w-16 shrink-0 rounded overflow-hidden border border-white/10 bg-white/5">
                      {ev.image ? (
                        <Image src={ev.image} alt="" fill unoptimized className="object-cover opacity-80 group-hover:opacity-100" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-emerald-300/90 group-hover:text-emerald-200 truncate">
                        {ev.title}
                      </p>
                      <p className="text-[11px] text-white/35">
                        {ev.type || 'EVENT'} ·{' '}
                        {ev.date ? formatEventDate(String(ev.date)) : ev.year || 'TBA'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="space-y-1">
            <p>
              <span className="text-emerald-400">{promptHost}</span>
              <span className="text-white/30">:</span>
              <span className="text-sky-400">{CWD}</span>
              <span className="text-white/50">$ </span>
              <span className="text-white/90">neofetch</span>
            </p>
            <div className="grid grid-cols-3 gap-2 max-w-md text-xs">
              {[
                ['Members', '500+'],
                ['Events/yr', '50+'],
                ['Uptime', '10y+'],
              ].map(([k, v]) => (
                <div key={k} className="border border-white/10 rounded px-3 py-2 bg-[#121212]">
                  <p className="text-white/35">{k}</p>
                  <p className="text-emerald-400 text-base font-semibold">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Command history output */}
          {history.map((line, i) =>
            line.startsWith('__out:') ? (
              <p key={i} className="text-white/55">
                {line.slice(6)}
              </p>
            ) : (
              <p key={i}>
                <span className="text-emerald-400">{promptHost}</span>
                <span className="text-white/30">:</span>
                <span className="text-sky-400">{CWD}</span>
                <span className="text-white/50">$ </span>
                <span>{line}</span>
              </p>
            )
          )}

          {/* Live prompt */}
          <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-x-0 gap-y-1 pb-16">
            <span className="text-emerald-400">{promptHost}</span>
            <span className="text-white/30">:</span>
            <span className="text-sky-400">{CWD}</span>
            <span className="text-white/50">$&nbsp;</span>
            <input
              ref={inputRef}
              value={cmd}
              onChange={e => setCmd(e.target.value)}
              className="flex-1 min-w-[12rem] bg-transparent outline-none text-white caret-emerald-400"
              autoComplete="off"
              spellCheck={false}
              aria-label="Terminal command"
              placeholder=""
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
    </div>
  )
}
