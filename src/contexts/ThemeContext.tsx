import { createContext, useContext, useState, useEffect } from 'react'

interface ThemeContextValue {
  theme: string
  toggleTheme: () => void
  isDark: boolean
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export const useTheme = () => useContext(ThemeContext) as ThemeContextValue

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<string>('light')
  const [mounted, setMounted] = useState<boolean>(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    setTheme(saved || sys)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const value: ThemeContextValue = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    mounted,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
