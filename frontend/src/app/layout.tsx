import type { Metadata } from 'next'
import { Rajdhani, Orbitron, Share_Tech_Mono } from 'next/font/google'
import './globals.css'
import ScanlineOverlay from '@/components/layout/ScanlineOverlay'
import Navbar from '@/components/layout/Navbar'
import SkipLink, { MAIN_CONTENT_ID } from '@/components/layout/SkipLink'
import { rootMetadata, websiteJsonLd } from '@/lib/site'

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ui',
  display: 'swap',
})

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const shareTechMono = Share_Tech_Mono({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = rootMetadata

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${rajdhani.variable} ${orbitron.variable} ${shareTechMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cp-dark text-cp-text">
        <SkipLink />
        <ScanlineOverlay />
        <Navbar />
        {/* tabIndex -1 lets the skip link move focus here in every browser */}
        <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <footer className="border-t border-cp-border py-6 text-center text-xs uppercase tracking-widest text-cp-muted">
          © {new Date().getFullYear()} · Compiled in Night City
        </footer>
        {/* Structured data: the site only. `<` is escaped so the JSON cannot close the script tag. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, '\\u003c') }}
        />
      </body>
    </html>
  )
}
