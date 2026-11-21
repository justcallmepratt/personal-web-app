import type { NextConfig } from 'next'
import { withMicrofrontends } from '@vercel/microfrontends/next/config'
import { siteRedirects } from './src/lib/redirects'

const nextConfig: NextConfig = {
  // Standalone output is what frontend/Dockerfile runs; Vercel ignores it.
  output: 'standalone',
  async redirects() {
    // /kafka → /projects/kafka; see src/lib/redirects.ts.
    return siteRedirects.map((redirect) => ({ ...redirect }))
  },
}

// This app is the default application of the planned Vercel microfrontends
// group: microfrontends.json (next to this file) says which paths go to other
// Vercel projects, and everything else is served here. No other project exists
// yet, so that file lists only this app and every path is served here.
export default withMicrofrontends(nextConfig)
