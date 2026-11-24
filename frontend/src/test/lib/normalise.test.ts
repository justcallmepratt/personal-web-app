import { describe, it, expect, vi, afterEach } from 'vitest'
import { normaliseExperience, normaliseList, normaliseProfile, normaliseProject, safeUrl } from '@/lib/normalise'
import { api } from '@/lib/api'
import type { Experience, Profile, Project } from '@/lib/types'

describe('safeUrl', () => {
  it('keeps http(s) and on-site paths', () => {
    expect(safeUrl('https://github.com/x')).toBe('https://github.com/x')
    expect(safeUrl(' http://a.dev ')).toBe('http://a.dev')
    expect(safeUrl('/projects/kafka')).toBe('/projects/kafka')
  })

  it('blanks script, data, protocol-relative and non-string values', () => {
    for (const v of ['javascript:alert(1)', ' JavaScript:alert(1)', 'data:text/html,x', '//evil.test', '/\\evil.test', 'ftp://x', '', null, 3])
      expect(safeUrl(v)).toBe('')
  })
})

describe('normalisers', () => {
  it('give null lists and maps safe values and drop unsafe links', () => {
    const p = normaliseProfile({ id: 1, name: 'N', techStack: null, socials: { a: 'javascript:x', b: 'https://b.dev' }, skills: [{ name: 'Go', category: 'Cloud' }, null] } as unknown as Profile)
    expect(p.techStack).toEqual([])
    expect(p.socials).toEqual({ b: 'https://b.dev' })
    expect(p.skills).toEqual([{ name: 'Go', category: 'Other' }])
    expect(p.bio).toBe('')

    const pr = normaliseProject({ id: 2, title: 'T', tags: null, demoUrl: 'javascript:x', repoUrl: 'https://r.dev' } as unknown as Project)
    expect(pr).toMatchObject({ tags: [], stack: [], demoUrl: '', repoUrl: 'https://r.dev', imageUrl: '' })

    const e = normaliseExperience({ id: 3, company: 'C', technologies: 'Java' } as unknown as Experience)
    expect(e).toMatchObject({ highlights: [], technologies: [] })
  })

  it('turn a non-array list into an empty one and drop non-objects', () => {
    expect(normaliseList<Project>(null, normaliseProject)).toEqual([])
    expect(normaliseList<Project>([null, 'x', { id: 1 }], normaliseProject)).toHaveLength(1)
  })
})

describe('api with a bad backend payload', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('returns usable data instead of nulls and unsafe links', async () => {
    vi.stubEnv('BACKEND_URL', 'http://backend.test')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([{ id: 1, title: 'P', tags: null, stack: null, demoUrl: 'javascript:alert(1)' }]),
    }))
    const [project] = await api.getProjects()
    expect(project.tags).toEqual([])
    expect(project.demoUrl).toBe('')
  })

  it('leaves the repo content as it is', async () => {
    vi.stubEnv('BACKEND_URL', '')
    const projects = await api.getProjects()
    expect(projects.some((p) => p.demoUrl === '/projects/kafka')).toBe(true)
  })
})
