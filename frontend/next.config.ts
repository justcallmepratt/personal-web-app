import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Standalone output is what frontend/Dockerfile runs; Vercel ignores it.
  output: 'standalone',
}

export default nextConfig
