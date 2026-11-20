import { describe, it, expect } from 'vitest'
import type { Metadata } from 'next'
import robots from '@/app/robots'
import sitemap from '@/app/sitemap'
import { metadata as homeMetadata } from '@/app/page'
import { metadata as experienceMetadata } from '@/app/experience/page'
import { metadata as projectsMetadata } from '@/app/projects/layout'
import { metadata as skillsMetadata } from '@/app/skills/page'
import { metadata as contactMetadata } from '@/app/contact/page'
import { publicRoutes, siteName } from '@/lib/site'

const HOST = 'https://justcallmepratt.dev'

describe('robots.txt', () => {
  const result = robots()

  it('allows the site, blocks /api and links the sitemap on the production host', () => {
    expect(result.rules).toEqual({ userAgent: '*', allow: '/', disallow: '/api/' })
    expect(result.sitemap).toBe(`${HOST}/sitemap.xml`)
  })
})

describe('sitemap.xml', () => {
  const urls = sitemap().map((entry) => entry.url)

  it('lists exactly the public routes as absolute URLs', () => {
    expect(urls).toEqual([
      HOST,
      `${HOST}/experience`,
      `${HOST}/projects`,
      `${HOST}/skills`,
      `${HOST}/contact`,
    ])
    expect(urls).toHaveLength(publicRoutes.length)
  })

  it('never lists API routes and has no duplicates', () => {
    expect(urls.some((u) => u.includes('/api'))).toBe(false)
    expect(new Set(urls).size).toBe(urls.length)
  })
})

describe('per-page metadata', () => {
  const pages: Array<[string, Metadata, string | undefined]> = [
    ['/', homeMetadata, undefined],
    ['/experience', experienceMetadata, 'Experience // Career Log'],
    // /projects keeps its metadata in a layout; page.tsx exports the same title.
    ['/projects', projectsMetadata, 'Projects // Night City Ops'],
    ['/skills', skillsMetadata, 'Skills // Loadout'],
    ['/contact', contactMetadata, 'Contact // Open Channel'],
  ]

  it.each(pages)('%s has its own title, description, canonical and social text', (path, meta, title) => {
    expect(meta.title).toBe(title)
    expect(typeof meta.description).toBe('string')
    expect((meta.description as string).length).toBeGreaterThan(20)
    expect(meta.alternates?.canonical).toBe(path)
    expect(meta.openGraph?.url).toBe(path)
    expect(meta.openGraph?.description).toBe(meta.description)
    expect(meta.openGraph?.title).toBe(title ? `${title} | ${siteName}` : siteName)
    // Every page restates the image: a page-level openGraph replaces the root one.
    expect(meta.openGraph?.images).toEqual([expect.objectContaining({ url: '/opengraph-image', width: 1200, height: 630 })])
    expect(meta.twitter?.images).toEqual([expect.objectContaining({ url: '/opengraph-image' })])
  })

  it('descriptions are unique across pages', () => {
    const descriptions = pages.map(([, meta]) => meta.description)
    expect(new Set(descriptions).size).toBe(descriptions.length)
  })
})
