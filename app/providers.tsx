'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '../src/contexts/AuthContext'
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext'
import { Toaster } from 'sonner'

function ThemedToaster() {
  const { isDark, mounted } = useTheme()
  return (
    <Toaster
      position="bottom-right"
      theme={mounted ? (isDark ? 'dark' : 'light') : 'system'}
      richColors
      closeButton
    />
  )
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemedToaster />
        {children}
      </AuthProvider>
    </ThemeProvider>
  )
}
