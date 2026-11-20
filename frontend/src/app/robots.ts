import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site'

// No request-time APIs are used, so this is generated once at build time.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
