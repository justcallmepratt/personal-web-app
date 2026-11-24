import { describe, it, expect } from 'vitest'
import type { Metadata } from 'next'
import robots from '@/app/robots'
import sitemap from '@/app/sitemap'
import { metadata as homeMetadata } from '@/app/page'
import { metadata as experienceMetadata } from '@/app/experience/page'
import { metadata as projectsMetadata } from '@/app/projects/layout'
import { metadata as kafkaMetadata } from '@/app/projects/kafka/page'
import { metadata as skillsMetadata } from '@/app/skills/page'
import { metadata as certificationsMetadata } from '@/app/certifications/page'
import { metadata as resumeMetadata } from '@/app/resume/page'
import { metadata as contactMetadata } from '@/app/contact/page'
import { metadata as creditsMetadata } from '@/app/credits/page'
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
      `${HOST}/projects/kafka`,
      `${HOST}/skills`,
      `${HOST}/certifications`,
      `${HOST}/research`,
      `${HOST}/resume`,
      `${HOST}/contact`,
      `${HOST}/credits`,
    ])
    expect(urls).toHaveLength(publicRoutes.length)
  })

  it('never lists API routes or the PDF copy of the resume, and has no duplicates', () => {
    expect(urls.some((u) => u.includes('/api'))).toBe(false)
    expect(urls.some((u) => u.endsWith('.pdf'))).toBe(false)
    expect(new Set(urls).size).toBe(urls.length)
  })
})

describe('per-page metadata', () => {
  const pages: Array<[string, Metadata, string | undefined]> = [
    ['/', homeMetadata, undefined],
    ['/experience', experienceMetadata, 'Experience // Career Log'],
    // /projects keeps its metadata in a layout; page.tsx exports the same title.
    ['/projects', projectsMetadata, 'Projects'],
    // Without its own metadata it inherited /projects' canonical link from the layout.
    ['/projects/kafka', kafkaMetadata, 'Kafka Live Demo'],
    ['/skills', skillsMetadata, 'Skills // Loadout'],
    ['/certifications', certificationsMetadata, 'Certifications'],
    ['/resume', resumeMetadata, 'Resume'],
    ['/contact', contactMetadata, 'Contact // Open Channel'],
    ['/credits', creditsMetadata, 'Credits // Citations'],
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

  it('no title or description carries the old persona', () => {
    expect(siteName).toBe('Pratham Sachan')
    for (const [, meta] of pages) {
      expect(JSON.stringify(meta)).not.toMatch(/night.?city/i)
    }
  })

  it('descriptions are unique across pages', () => {
    const descriptions = pages.map(([, meta]) => meta.description)
    expect(new Set(descriptions).size).toBe(descriptions.length)
  })
})
