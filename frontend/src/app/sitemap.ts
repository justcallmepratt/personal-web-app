import type { MetadataRoute } from 'next'
import { absoluteUrl, publicRoutes } from '@/lib/site'

// Generated once at build time. `lastModified` is left out on purpose: the
// content source carries no trustworthy per-page modification date.
export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: absoluteUrl(route),
    priority: route === '/' ? 1 : 0.8,
  }))
}
