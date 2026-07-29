import '../src/index.css'
import type { ReactNode } from 'react'
import Providers from './providers'
import Navbar from '../src/components/Layout/Navbar'
import Footer from '../src/components/Layout/Footer'
import ScrollToTop from '../src/components/UI/ScrollToTop'
import CommandPalette from '../src/components/UI/CommandPalette'

export const metadata = {
  title: 'CSI NMAMIT',
  description: 'Computer Society of India, NMAMIT chapter.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Syne:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <div className="relative min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow relative z-10">{children}</main>
            <Footer />
            <ScrollToTop />
            <CommandPalette />
          </div>
        </Providers>
      </body>
    </html>
  )
}
