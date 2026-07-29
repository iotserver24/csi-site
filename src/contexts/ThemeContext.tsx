'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
  isDark: boolean
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    // Safe fallback so navbar never crashes if provider is missing
    return {
      theme: 'light' as Theme,
      toggleTheme: () => {},
      setTheme: () => {},
      isDark: false,
      mounted: false,
    }
  }
  return ctx
}

function applyThemeClass(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
  try {
    localStorage.setItem('theme', theme)
  } catch {
    /* ignore */
  }
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let initial: Theme = 'light'
    try {
      const saved = localStorage.getItem('theme')
      if (saved === 'dark' || saved === 'light') initial = saved
      else if (window.matchMedia('(prefers-color-scheme: dark)').matches) initial = 'dark'
    } catch {
      /* ignore */
    }
    setThemeState(initial)
    applyThemeClass(initial)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    applyThemeClass(theme)
  }, [theme, mounted])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    applyThemeClass(t)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      applyThemeClass(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme,
      isDark: theme === 'dark',
      mounted,
    }),
    [theme, toggleTheme, setTheme, mounted]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
