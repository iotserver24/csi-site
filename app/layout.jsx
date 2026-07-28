import '../src/index.css'
import Providers from './providers'
import Navbar from '../src/components/Layout/Navbar'
import Footer from '../src/components/Layout/Footer'
import ScrollToTop from '../src/components/UI/ScrollToTop'
import CommandPalette from '../src/components/UI/CommandPalette'

export const metadata = {
  title: 'CSI NMAMIT',
  description: 'Computer Society of India, NMAMIT chapter.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
