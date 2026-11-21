import { describe, it, expect, vi, afterEach } from 'vitest'
import { api } from '@/lib/api'
import { formatDateRange, formatIsoDate } from '@/lib/dates'
import {
  buildResume, getResumeData, localResumeData, resumeFilename, toLink, RESUME_HEADINGS,
  type ResumeSources,
} from '@/lib/resume'
import { siteName } from '@/lib/site'
import { education, leadership, profile } from '@/content'
import type { Experience, Profile, Project } from '@/lib/types'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

const empty: ResumeSources = {
  profile: null, experience: [], education: [], projects: [], certifications: [], leadership: [],
}

const section = (data: ReturnType<typeof buildResume>, id: string) => data.sections.find((s) => s.id === id)

describe('date helpers', () => {
  it('formats at the precision written and ignores a time part', () => {
    expect(formatIsoDate('2024')).toBe('2024')
    expect(formatIsoDate('2024-07')).toBe('Jul 2024')
    expect(formatIsoDate('2024-07-01T00:00:00')).toBe('Jul 2024')
  })

  it.each([undefined, null, '', 'soon', '2024-13', 42 as never])('returns null for %j', (value) => {
    expect(formatIsoDate(value)).toBeNull()
  })

  it('builds ranges and never guesses "Present"', () => {
    expect(formatDateRange('2024-07-01', null, true)).toBe('Jul 2024 – Present')
    expect(formatDateRange('2021-06-01', '2021-08-01', false)).toBe('Jun 2021 – Aug 2021')
    expect(formatDateRange('2023-06-01', null, false)).toBe('Jun 2023')
    expect(formatDateRange('2023-01', undefined, undefined)).toBe('Jan 2023')
    expect(formatDateRange('2020', '2020', false)).toBe('2020')
    expect(formatDateRange(undefined, '2020-05', false)).toBe('May 2020')
    expect(formatDateRange(undefined, undefined, true)).toBe('Present')
    expect(formatDateRange('nonsense', null, false)).toBeNull()
  })
})

describe('resume from the repo content', () => {
  const data = localResumeData()

  it('has the header and all six sections in resume order', () => {
    expect(data.name).toBe('Pratham Sachan')
    expect(data.tagline).toBe(profile.tagline)
    expect(data.location).toBe('Tampa, FL')
    expect(data.sections.map((s) => s.id)).toEqual([
      'experience', 'education', 'projects', 'skills', 'certifications', 'leadership',
    ])
    expect(data.sections.map((s) => s.heading)).toEqual(Object.values(RESUME_HEADINGS))
  })

  it('links only what the profile publishes', () => {
    expect(data.links).toEqual([
      { label: 'LinkedIn', url: 'https://linkedin.com/in/prathamsachan', display: 'linkedin.com/in/prathamsachan' },
    ])
  })

  it('publishes no email address, phone number or street address', () => {
    const everything = JSON.stringify(data)
    expect(everything).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i)
    expect(everything).not.toMatch(/\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/)
    expect(everything).not.toMatch(/\b\d{5}(-\d{4})?\b/) // ZIP code
  })

  it('shows the degree without a date while the graduation date is unconfirmed', () => {
    expect(education[0].year).toBeUndefined()
    expect(section(data, 'education')?.entries).toEqual([
      expect.objectContaining({
        title: "Bachelor's in Computer Science",
        subtitle: 'University of Massachusetts Amherst',
        date: undefined,
        details: [],
      }),
    ])
  })

  it('dates leadership from the content and never marks it ongoing by itself', () => {
    expect(leadership.every((l) => l.current === undefined)).toBe(true)
    expect(section(data, 'leadership')?.entries.map((e) => [e.title, e.subtitle, e.date])).toEqual([
      ['Mentor for new post-college associates', 'Raymond James', undefined],
    ])
  })

  it('formats experience dates like the timeline does', () => {
    expect(section(data, 'experience')?.entries.map((e) => e.date)).toEqual([
      'Jul 2024 – Present', 'Jun 2023', 'Jun 2021 – Aug 2021',
    ])
  })

  it('groups skills by area in a fixed order', () => {
    expect(section(data, 'skills')?.entries.map((e) => e.title)).toEqual(['Backend', 'Frontend', 'DevOps', 'Other'])
    expect(section(data, 'skills')?.entries[2].text).toBe('Splunk, Dynatrace')
  })

  it('prints a demo on this site as a full address', () => {
    const kafka = section(data, 'projects')?.entries.find((e) => e.title.startsWith('Kafka'))
    expect(kafka?.links.map((l) => l.display)).toEqual([
      'github.com/justcallmepratt/Kafka-Producer-Consumer-Demo',
      'justcallmepratt.dev/projects/kafka',
    ])
  })
})

describe('buildResume edge cases', () => {
  it('omits every empty section and falls back to the site name', () => {
    const data = buildResume(empty)
    expect(data).toEqual({ name: siteName, tagline: '', location: '', links: [], sections: [] })
  })

  it('omits only the sections that are empty', () => {
    const data = buildResume({ ...empty, education, profile: { ...profile, skills: [] } })
    expect(data.sections.map((s) => s.id)).toEqual(['education'])
  })

  it('renders an entry that has only its required field', () => {
    const data = buildResume({ ...empty, experience: [{ role: 'Developer' } as Experience] })
    expect(section(data, 'experience')?.entries).toEqual([
      { id: 'experience-0', title: 'Developer', subtitle: undefined, date: undefined, text: undefined,
        bullets: [], details: [], links: [] },
    ])
  })

  it('survives nulls, wrong types and rows without a title from the API', () => {
    const junk = [
      null, 'text', 7, [], {}, { role: '   ', company: '' },
      { role: 'Engineer', company: 'Acme', highlights: null, technologies: 'Java', startDate: 20240101 },
    ] as unknown as Experience[]
    const data = buildResume({
      profile: { name: 42, socials: null, skills: 'none' } as unknown as Profile,
      experience: junk,
      education: null as never,
      projects: { not: 'an array' } as never,
      certifications: [{ issuer: 'No name' }] as never,
      leadership: [{ organization: 'Only an organisation' }] as never,
    })
    expect(data.name).toBe(siteName)
    expect(data.sections.map((s) => s.id)).toEqual(['experience', 'leadership'])
    expect(section(data, 'experience')?.entries).toHaveLength(1)
    expect(section(data, 'experience')?.entries[0]).toMatchObject({
      title: 'Engineer', subtitle: 'Acme', date: undefined, bullets: [], details: [],
    })
    expect(section(data, 'leadership')?.entries[0]).toMatchObject({
      title: 'Only an organisation', subtitle: undefined,
    })
  })

  it('collapses stray whitespace and line breaks', () => {
    const data = buildResume({ ...empty, experience: [{ role: '  Lead\n\tDeveloper ', description: 'a\n\nb' } as Experience] })
    expect(section(data, 'experience')?.entries[0]).toMatchObject({ title: 'Lead Developer', text: 'a b' })
  })

  it('keeps http(s) links and drops everything else', () => {
    const data = buildResume({
      ...empty,
      profile: {
        ...profile,
        socials: {
          linkedin: 'https://www.linkedin.com/in/someone/',
          GitHub: 'https://github.com/someone',
          script: 'javascript:alert(1)',
          mail: 'mailto:someone@example.test',
          broken: 'https://',
          blank: '',
        },
      },
    })
    expect(data.links).toEqual([
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/someone/', display: 'linkedin.com/in/someone' },
      { label: 'GitHub', url: 'https://github.com/someone', display: 'github.com/someone' },
    ])
    expect(toLink('x', undefined)).toBeNull()
  })

  it('never turns a protocol-relative or script demo URL into a link', () => {
    const project = (demoUrl: string) => ({ title: 'P', demoUrl, repoUrl: '' }) as Project
    const data = buildResume({ ...empty, projects: [project('//evil.example.test'), project('javascript:alert(1)')] })
    expect(section(data, 'projects')?.entries.flatMap((e) => e.links)).toEqual([])
  })

  it('lists a project stack only when there is one: tags are labels, not a stack', () => {
    const data = buildResume({
      ...empty,
      projects: [
        { title: 'A', stack: ['Java', '', 'Kafka'], tags: ['Demo'] } as unknown as Project,
        { title: 'B', stack: [], tags: ['Prototype'] } as unknown as Project,
        { title: 'C' } as Project,
      ],
    })
    expect(section(data, 'projects')?.entries.map((e) => e.details)).toEqual([
      [{ label: 'Stack', value: 'Java, Kafka' }], [], [],
    ])
  })

  it('puts unknown skill areas last and removes duplicate names', () => {
    const skills = [
      { name: 'Rust', category: 'Systems' }, { name: 'Java', category: 'Backend' },
      { name: 'Java', category: 'Backend' }, { name: '', category: 'Backend' }, { name: 'Vim' },
    ] as Profile['skills']
    const data = buildResume({ ...empty, profile: { ...profile, skills } })
    expect(section(data, 'skills')?.entries.map((e) => [e.title, e.text])).toEqual([
      ['Backend', 'Java'], ['Other', 'Vim'], ['Systems', 'Rust'],
    ])
  })

  it('shows a certification date and credential ID only when present', () => {
    const data = buildResume({
      ...empty,
      certifications: [
        { id: 1, name: 'Plain', issuer: 'Issuer' },
        { id: 2, name: 'Full', issuer: 'Issuer', date: '2023-05', credentialId: 'ABC-1' },
      ],
    })
    expect(section(data, 'certifications')?.entries.map((e) => e.text)).toEqual([
      'Issuer', 'Issuer · May 2023 · Credential ID ABC-1',
    ])
  })
})

describe('getResumeData when the API misbehaves', () => {
  const withBackend = () => {
    vi.stubEnv('BACKEND_URL', 'http://backend.test')
    vi.stubGlobal('fetch', vi.fn())
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  }

  it('uses the repo content without a backend configured', async () => {
    expect(await getResumeData()).toEqual(localResumeData())
  })

  it.each([
    ['is down', () => Promise.reject(new TypeError('fetch failed'))],
    ['times out', () => Promise.reject(new DOMException('The operation timed out.', 'TimeoutError'))],
    ['answers 500', () => Promise.resolve(new Response(null, { status: 500 }))],
    ['answers with broken JSON', () => Promise.resolve(new Response('{oops', { status: 200 }))],
  ])('renders from the repo content when the API %s', async (_label, answer) => {
    withBackend()
    vi.mocked(fetch).mockImplementation(answer as never)
    expect(await getResumeData()).toEqual(localResumeData())
    expect(fetch).toHaveBeenCalled()
  })

  it('asks the API with the hourly revalidation and a timeout', async () => {
    withBackend()
    vi.mocked(fetch).mockRejectedValue(new Error('down'))
    await getResumeData()
    for (const [, init] of vi.mocked(fetch).mock.calls) {
      expect(init).toMatchObject({ next: { revalidate: 3600 } })
      expect((init as RequestInit).signal).toBeInstanceOf(AbortSignal)
    }
  })

  it('still builds a resume when the API answers 200 with the wrong shape', async () => {
    withBackend()
    vi.mocked(fetch).mockImplementation(() => Promise.resolve(Response.json({ unexpected: true })) as never)
    const data = await getResumeData()
    expect(data.name).toBe(siteName)
    // The API-backed sections are empty and gone; the repo-only ones remain.
    expect(data.sections.map((s) => s.id)).toEqual(['education', 'certifications', 'leadership'])
  })

  it('loses only the section whose getter throws', async () => {
    vi.spyOn(api, 'getExperience').mockRejectedValue(new Error('boom'))
    vi.spyOn(api, 'getProfile').mockRejectedValue(new Error('boom'))
    const data = await getResumeData()
    expect(data.name).toBe('Pratham Sachan')
    expect(data.sections.map((s) => s.id)).toEqual(['education', 'projects', 'skills', 'certifications', 'leadership'])
  })
})

describe('resumeFilename', () => {
  it.each([
    ['Pratham Sachan', 'Pratham-Sachan-Resume.pdf'],
    ['  Zoë  "Quote" / O\'Neil\r\n', 'Zoe-Quote-O-Neil-Resume.pdf'],
    ['', 'Resume.pdf'],
    ['日本', 'Resume.pdf'],
  ])('%j becomes %s', (name, expected) => {
    expect(resumeFilename(name)).toBe(expected)
  })

  it('is always safe inside a quoted header value', () => {
    expect(resumeFilename('a"; evil=\n' + 'x'.repeat(200))).toMatch(/^[A-Za-z0-9-]{1,60}-Resume\.pdf$/)
  })
})
