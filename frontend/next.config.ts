import type { NextConfig } from 'next'
import { withMicrofrontends } from '@vercel/microfrontends/next/config'

const nextConfig: NextConfig = {
  // Standalone output is what frontend/Dockerfile runs; Vercel ignores it.
  output: 'standalone',
}

// This app is the default application of the Vercel microfrontends group:
// microfrontends.json (next to this file) says which paths go to the other
// apps, and everything else is served here. The keys in that file are Vercel
// project names.
export default withMicrofrontends(nextConfig)
