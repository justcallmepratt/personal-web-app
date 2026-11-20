import { describe, it, expect } from 'vitest'
import {
  DEFAULT_SITE_URL,
  absoluteUrl,
  pageMetadata,
  resolveSiteUrl,
  rootMetadata,
  siteName,
  siteUrl,
  websiteJsonLd,
} from '@/lib/site'

describe('resolveSiteUrl', () => {
  it('falls back to the production domain when unset', () => {
    expect(DEFAULT_SITE_URL).toBe('https://justcallmepratt.dev')
    expect(resolveSiteUrl(undefined)).toBe('https://justcallmepratt.dev')
  })

  it.each(['', '   ', 'not a url', 'justcallmepratt.dev', 'ftp://example.test', 'javascript:alert(1)'])(
    'falls back for the unusable value %j',
    (value) => {
      expect(resolveSiteUrl(value)).toBe(DEFAULT_SITE_URL)
    },
  )

  it('keeps a valid override and strips trailing slash, path and whitespace', () => {
    expect(resolveSiteUrl('https://example.test')).toBe('https://example.test')
    expect(resolveSiteUrl(' https://example.test/ ')).toBe('https://example.test')
    expect(resolveSiteUrl('https://example.test/some/path?x=1')).toBe('https://example.test')
    expect(resolveSiteUrl('http://localhost:3000')).toBe('http://localhost:3000')
  })
})

describe('absoluteUrl', () => {
  it('builds absolute URLs without double or trailing slashes', () => {
    expect(absoluteUrl('/')).toBe(siteUrl)
    expect(absoluteUrl()).toBe(siteUrl)
    expect(absoluteUrl('/projects')).toBe(`${siteUrl}/projects`)
    expect(absoluteUrl('projects/')).toBe(`${siteUrl}/projects`)
    expect(absoluteUrl('/sitemap.xml')).toBe(`${siteUrl}/sitemap.xml`)
  })
})

describe('rootMetadata', () => {
  it('uses the production host as metadataBase by default', () => {
    expect(rootMetadata.metadataBase?.origin).toBe('https://justcallmepratt.dev')
  })

  it('has a default title, a title template and a home canonical', () => {
    expect(rootMetadata.title).toEqual({ default: siteName, template: `%s | ${siteName}` })
    expect(rootMetadata.alternates?.canonical).toBe('/')
    expect(rootMetadata.description).toBeTruthy()
  })

  it('does not point at a static og.png any more (the image is the opengraph-image route)', () => {
    expect(JSON.stringify(rootMetadata)).not.toContain('og.png')
    expect(JSON.stringify(rootMetadata)).not.toContain('vercel.app')
  })
})

describe('pageMetadata', () => {
  const meta = pageMetadata({ title: 'Skills // Loadout', description: 'About skills.', path: '/skills' })

  it('sets title, description and canonical', () => {
    expect(meta.title).toBe('Skills // Loadout')
    expect(meta.description).toBe('About skills.')
    expect(meta.alternates?.canonical).toBe('/skills')
  })

  it('gives Open Graph and Twitter the page-specific text and URL', () => {
    expect(meta.openGraph).toMatchObject({
      title: `Skills // Loadout | ${siteName}`,
      description: 'About skills.',
      url: '/skills',
      siteName,
      type: 'website',
    })
    expect(meta.twitter).toMatchObject({
      card: 'summary_large_image',
      title: `Skills // Loadout | ${siteName}`,
      description: 'About skills.',
    })
  })

  it('omits the title on the home page so the default applies', () => {
    const home = pageMetadata({ description: 'Home.', path: '/' })
    expect('title' in home).toBe(false)
    expect(home.openGraph?.title).toBe(siteName)
  })
})

describe('websiteJsonLd', () => {
  it('is a minimal WebSite entry with no person details', () => {
    expect(websiteJsonLd['@context']).toBe('https://schema.org')
    expect(websiteJsonLd['@type']).toBe('WebSite')
    expect(websiteJsonLd.name).toBe(siteName)
    expect(websiteJsonLd.url).toBe(siteUrl)
    const keys = Object.keys(websiteJsonLd)
    for (const personal of ['author', 'email', 'telephone', 'address', 'sameAs', 'jobTitle']) {
      expect(keys).not.toContain(personal)
    }
  })
})
