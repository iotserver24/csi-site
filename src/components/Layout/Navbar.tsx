'use client'

// Navbar-modernized.jsx — 2026-level redesign
// Drop-in replacement for src/components/Layout/Navbar.jsx
// Keeps all existing logic, upgrades visual layer only.

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, X, Home, Calendar, Users, User,
  LogIn, LogOut, Sun, Moon, Sparkles,
  ChevronDown, ChevronRight, Shield
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [scrolled, setScrolled] = useState<boolean>(false)
  const [profileDropdown, setProfileDropdown] = useState<boolean>(false)
  const pathname = usePathname()
  const { user, signInWithGoogle, logout, authLoading, getUserRoleDisplay, isUserCoreMember } = useAuth()
  const { theme, toggleTheme, mounted } = useTheme()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ticking = false
    const onScroll = (): void => {
      if (!ticking) {
        requestAnimationFrame(() => { setScrolled(window.scrollY > 24); ticking = false })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setIsOpen(false); setProfileDropdown(false) }, [pathname])

  useEffect(() => {
    const handle = (e: MouseEvent): void => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setProfileDropdown(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/events', label: 'Events', icon: Calendar },
    { path: '/team', label: 'Team', icon: Users },
  ]
  const isActive = (p: string): boolean => pathname === p

  // Full-screen terminal experiment — no site chrome
  if (pathname === '/1') return null

  return (
    <>
      {/* ── Main nav bar ─────────────────────────────────────────────────── */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 w-full transition-all duration-500
          ${scrolled
            ? 'bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100/80 dark:border-gray-800 shadow-sm shadow-black/5 dark:shadow-black/20'
            : 'bg-white/70 dark:bg-gray-950/50 backdrop-blur-md sm:bg-transparent sm:dark:bg-transparent sm:backdrop-blur-none border-b border-gray-200/60 dark:border-white/5 sm:border-transparent'
          }`}
      >
        <div className="w-full px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="relative shrink-0">
                <Image src="/csi-logo.png" alt="CSI" width={28} height={28} className="h-7 w-7 sm:h-8 sm:w-8 transition-all duration-300" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm sm:text-[15px] font-bold text-gray-900 dark:text-white leading-none">CSI NMAMIT</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-500 leading-none mt-0.5 tracking-wide">Computer Society of India</p>
              </div>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(({ path, label }) => (
                <Link
                  key={path}
                  href={path}
                  className={`relative px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200
                    ${isActive(path)
                      ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/60'
                    }`}
                >
                  {label}
                  {isActive(path) && (
                    <motion.div
                      layoutId="nav-dot"
                      className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              ))}

              {/* Join CTA */}
              <Link
                href="/recruit"
                className="ml-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold
                           bg-gray-900 dark:bg-white text-white dark:text-gray-900
                           hover:bg-gray-700 dark:hover:bg-gray-100
                           transition-colors duration-200"
              >
                <Sparkles size={13} />
                Join CSI
              </Link>
            </div>

            {/* Desktop right actions */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white
                           hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                {mounted ? (
                  <AnimatePresence mode="wait">
                    {theme === 'dark'
                      ? <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><Sun size={17} /></motion.div>
                      : <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Moon size={17} /></motion.div>
                    }
                  </AnimatePresence>
                ) : (
                  <Sun size={17} />
                )}
              </button>

              {/* Auth */}
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileDropdown(!profileDropdown)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl
                               border border-transparent hover:border-gray-200 dark:hover:border-gray-700
                               hover:bg-gray-50 dark:hover:bg-gray-800/60
                               transition-all duration-200"
                  >
                    <div className="relative">
                      <Image
                        src={user.photoURL ?? '/default-avatar.svg'}
                        alt={user.name ?? ''}
                        width={32}
                        height={32}
                        unoptimized
                        className={`h-8 w-8 rounded-full ring-2
                          ${isUserCoreMember() ? 'ring-yellow-400' : 'ring-cyber-blue/50'}`}
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-950" />
                    </div>
                    <span className="text-[13px] font-medium text-gray-800 dark:text-gray-200 max-w-[96px] truncate">
                      {user.name?.split(' ')[0]}
                    </span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${profileDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {profileDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 mt-2 w-60
                                   bg-white dark:bg-gray-900
                                   border border-gray-100 dark:border-gray-800
                                   rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40
                                   overflow-hidden"
                      >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                          <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-500 truncate">{user.email}</p>
                          {isUserCoreMember() && (
                            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold tracking-wide
                                             text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20
                                             px-2 py-0.5 rounded-full border border-yellow-200/50 dark:border-yellow-800/30">
                              <Shield size={9} /> {getUserRoleDisplay()}
                            </span>
                          )}
                        </div>
                        {/* Links */}
                        <div className="py-1">
                          <Link
                            href={isUserCoreMember() ? '/core-profile' : '/profile'}
                            onClick={() => setProfileDropdown(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-[13px]
                                       text-gray-700 dark:text-gray-300
                                       hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary-500
                                       transition-colors group"
                          >
                            <User size={15} className="text-gray-400 group-hover:text-primary-500 transition-colors" />
                            My Profile
                            <ChevronRight size={13} className="ml-auto text-gray-300 group-hover:text-primary-500 transition-colors" />
                          </Link>
                        </div>
                        {/* Sign out */}
                        <div className="border-t border-gray-100 dark:border-gray-800 py-1">
                          <button
                            onClick={() => { logout(); setProfileDropdown(false) }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px]
                                       text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30
                                       transition-colors"
                          >
                            <LogOut size={15} /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  disabled={authLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold
                             border border-gray-200 dark:border-gray-700
                             text-gray-700 dark:text-gray-300
                             hover:border-primary-500 hover:text-primary-500
                             transition-all duration-200 disabled:opacity-50"
                >
                  <LogIn size={14} />
                  {authLoading ? 'Signing in…' : 'Sign In'}
                </button>
              )}
            </div>

            {/* Mobile actions */}
            <div className="lg:hidden flex items-center gap-1">
              <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {mounted ? (
                  theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />
                ) : (
                  <Moon size={18} />
                )}
              </button>
              {user && (
                <Image src={user.photoURL ?? '/default-avatar.svg'} alt={user.name ?? ''}
                  width={28} height={28} unoptimized
                  className={`h-7 w-7 rounded-full ring-2 ${isUserCoreMember() ? 'ring-yellow-400' : 'ring-cyber-blue/50'}`} />
              )}
              <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-1">
                <AnimatePresence mode="wait">
                  {isOpen
                    ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X size={19} /></motion.div>
                    : <motion.div key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu size={19} /></motion.div>
                  }
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile overlay ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen(false)} />
        )}
      </AnimatePresence>

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 w-72 z-50 lg:hidden overflow-y-auto
                       bg-white dark:bg-gray-950 border-l border-gray-100 dark:border-gray-800 shadow-2xl"
          >
            <div className="p-6 pt-20 space-y-6">
              {/* User info */}
              {user && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900">
                  <Image src={user.photoURL ?? '/default-avatar.svg'} alt={user.name ?? ''}
                    width={40} height={40} unoptimized
                    className={`h-10 w-10 rounded-full ring-2 ${isUserCoreMember() ? 'ring-yellow-400' : 'ring-cyber-blue/50'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <div className="space-y-0.5">
                {navLinks.map(({ path, label, icon: Icon }) => (
                  <Link key={path} href={path} onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors
                      ${isActive(path)
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                      }`}
                  >
                    <Icon size={17} />
                    {label}
                  </Link>
                ))}
              </div>

              {/* Join */}
              <Link href="/recruit" onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[14px] font-semibold
                           bg-gray-900 dark:bg-white text-white dark:text-gray-900
                           hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors">
                <Sparkles size={14} /> Join CSI
              </Link>

              {/* User profile / signout */}
              {user ? (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-0.5">
                  <Link href={isUserCoreMember() ? '/core-profile' : '/profile'} onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <User size={17} /> My Profile
                  </Link>
                  <button onClick={() => { logout(); setIsOpen(false) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                    <LogOut size={17} /> Sign Out
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button onClick={() => { signInWithGoogle(); setIsOpen(false) }} disabled={authLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold
                               border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300
                               hover:border-primary-500 hover:text-primary-500 transition-all disabled:opacity-50">
                    <LogIn size={16} /> {authLoading ? 'Signing in…' : 'Sign In'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
