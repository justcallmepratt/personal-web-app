import type { NextConfig } from 'next'
import { withMicrofrontends } from '@vercel/microfrontends/next/config'

// Every route lives under src/app/admin, so the app answers on /admin/* without
// `basePath`. Vercel Microfrontends does not support Next.js apps that set
// basePath; it gives each app its own asset prefix instead (withMicrofrontends).
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    // Only reachable on the project's own domain; on the shared domain "/" is
    // served by the default app.
    return [{ source: '/', destination: '/admin', permanent: false }]
  },
}

// withMicrofrontends needs the group's microfrontends.json, which Vercel
// supplies once this project is in a microfrontends group. Until then (local
// dev, CI, the first standalone deployment) build as a plain Next.js app.
function configure(): NextConfig {
  try {
    return withMicrofrontends(nextConfig)
  } catch (e) {
    const subtype = (e as { subtype?: string } | null)?.subtype
    if (subtype !== 'inference_failed') throw e
    console.warn('admin: no microfrontends.json found; building as a standalone app.')
    return nextConfig
  }
}

export default configure()
