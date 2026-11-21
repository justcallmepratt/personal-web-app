import type { Metadata } from 'next'
import { Rajdhani, Orbitron, Share_Tech_Mono } from 'next/font/google'
import './globals.css'

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ui',
  display: 'swap',
})
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const shareTechMono = Share_Tech_Mono({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-mono',
  display: 'swap',
})

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Pratham Sachan'

export const metadata: Metadata = {
  title: { default: 'Kafka Live Demo', template: `%s | ${siteName}` },
  description: 'Send a record through a real Apache Kafka broker and watch it get consumed.',
}

// The links below are plain anchors on purpose: "/" and "/projects" belong to the
// main site, a different app in the microfrontends group, so they must be full
// page loads rather than client-side route changes.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${rajdhani.variable} ${orbitron.variable} ${shareTechMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cp-dark text-cp-text">
        <header className="border-b border-cp-border">
          <nav
            aria-label="Site"
            className="max-w-6xl mx-auto px-4 flex items-center justify-between gap-4 min-h-[56px] text-xs uppercase tracking-[0.25em] font-[var(--font-mono)]"
          >
            <a href="/" className="text-cp-yellow hover:underline py-3">
              ◆ {siteName}
            </a>
            <a href="/projects" className="text-cp-text hover:text-cp-teal py-3">
              ← Projects
            </a>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-cp-border py-6 text-center text-xs uppercase tracking-widest text-cp-muted">
          © {new Date().getFullYear()} · Compiled in Tampa, FL
        </footer>
      </body>
    </html>
  )
}
