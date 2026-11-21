import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToRegexp } from 'next/dist/compiled/path-to-regexp'
import { kafkaRedirects, siteRedirects } from '@/lib/redirects'
import { publicRoutes } from '@/lib/site'

/** First matching redirect's destination, the way Next.js picks one. */
function resolve(pathname: string): string | undefined {
  return siteRedirects.find((r) => pathToRegexp(r.source).test(pathname))?.destination
}

describe('kafka redirects', () => {
  it.each(['/kafka', '/kafka/', '/kafka/anything', '/kafka/a/b/c', '/kafka/api', '/kafka/api/unknown'])(
    'sends %s to the demo page',
    (pathname) => {
      expect(resolve(pathname)).toBe('/projects/kafka')
    },
  )

  it('sends the micro-frontend relay addresses to the live relay routes', () => {
    expect(resolve('/kafka/api/produce')).toBe('/api/kafka/produce')
    expect(resolve('/kafka/api/messages')).toBe('/api/kafka/messages')
  })

  it.each(['/projects/kafka', '/api/kafka/produce', '/api/kafka/messages', '/kafkaesque', '/projects', '/'])(
    'leaves %s alone',
    (pathname) => {
      expect(resolve(pathname)).toBeUndefined()
    },
  )

  it('is permanent and never redirects to a path that redirects again', () => {
    for (const redirect of kafkaRedirects) {
      expect(redirect.permanent).toBe(true)
      expect(resolve(redirect.destination)).toBeUndefined()
    }
  })

  it('does not shadow any public route', () => {
    for (const route of publicRoutes) expect(resolve(route)).toBeUndefined()
  })
})

describe('microfrontends.json', () => {
  interface MicrofrontendsConfig {
    applications: Record<string, { routing?: { paths: string[] }[] }>
  }
  const config = JSON.parse(
    readFileSync(path.resolve(__dirname, '../../../microfrontends.json'), 'utf8'),
  ) as MicrofrontendsConfig

  it('keeps frontend as the default application (no routing of its own)', () => {
    expect(config.applications.frontend).toBeDefined()
    expect(config.applications.frontend.routing).toBeUndefined()
  })

  it('routes /admin and everything under it to the admin project, and nothing else', () => {
    const paths = config.applications.admin?.routing?.flatMap((r) => r.paths) ?? []
    expect(paths.sort()).toEqual(['/admin', '/admin/:path*'])
  })

  it('routes nothing to a kafka project while this app redirects /kafka', () => {
    expect(config.applications.kafka).toBeUndefined()
    const routed = Object.values(config.applications).flatMap((app) => app.routing?.flatMap((r) => r.paths) ?? [])
    expect(routed.filter((p) => p === '/kafka' || p.startsWith('/kafka/'))).toEqual([])
  })
})
