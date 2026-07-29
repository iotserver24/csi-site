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

/** Runs before paint so light/dark matches localStorage and avoids flash */
const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    if (t !== 'light' && t !== 'dark') {
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    var r = document.documentElement;
    if (t === 'dark') r.classList.add('dark');
    else r.classList.remove('dark');
    r.style.colorScheme = t;
  } catch (e) {}
})();
`

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
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
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
