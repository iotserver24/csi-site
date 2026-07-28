'use client'

import { AuthProvider } from '../src/contexts/AuthContext'
import { ThemeProvider } from '../src/contexts/ThemeContext'
import { Toaster } from 'sonner'

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="bottom-right" theme="dark" richColors closeButton />
        {children}
      </AuthProvider>
    </ThemeProvider>
  )
}
