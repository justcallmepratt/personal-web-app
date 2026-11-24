import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import ResumePage, { metadata } from '@/app/resume/page'
import * as pdfRoute from '@/app/resume.pdf/route'
import ResumeDocument from '@/components/sections/ResumeDocument'
import { api } from '@/lib/api'
import { getResumeData, localResumeData, type ResumeData } from '@/lib/resume'
import { RESUME_PATH, RESUME_PDF_PATH } from '@/lib/site'
import { experience } from '@/content'
import { pdfSource, pdfText } from '../helpers/pdf'

// getResumeData is wrapped so one test can make it fail outright; every other
// test runs the real function.
vi.mock('@/lib/resume', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/resume')>()
  return { ...actual, getResumeData: vi.fn(actual.getResumeData) }
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

const HEADINGS = ['Experience', 'Education', 'Projects', 'Skills', 'Certifications', 'Leadership']

const apiDown = () => {
  vi.stubEnv('BACKEND_URL', 'http://backend.test')
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError')))
  vi.spyOn(console, 'warn').mockImplementation(() => {})
}

const h2s = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)

describe('/resume page', () => {
  it('shows the name as the only h1 and every section in order', async () => {
    render(await ResumePage())
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pratham Sachan')
    expect(h2s()).toEqual(HEADINGS)
  })

  it('keeps heading levels in order: h1, then h2 sections, then h3 entries', async () => {
    const { container } = render(await ResumePage())
    const levels = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => Number(h.tagName[1]))
    expect(levels[0]).toBe(1)
    levels.slice(1).forEach((level, i) => {
      expect(level).toBeGreaterThanOrEqual(2)
      expect(level - levels[i]).toBeLessThanOrEqual(1)
    })
    for (const role of experience) {
      expect(screen.getByRole('heading', { level: 3, name: role.role })).toBeInTheDocument()
    }
  })

  it('labels each section with its heading', async () => {
    render(await ResumePage())
    for (const heading of HEADINGS) {
      expect(screen.getByRole('region', { name: heading })).toBeInTheDocument()
    }
    const education = within(screen.getByRole('region', { name: 'Education' }))
    expect(education.getByRole('heading', { level: 3, name: "Bachelor's in Computer Science" })).toBeInTheDocument()
    expect(education.getByText(/University of Massachusetts Amherst/)).toBeInTheDocument()
    expect(education.getByText('Business Management')).toBeInTheDocument()
    // The graduation date is unconfirmed, so no year is printed.
    expect(education.queryByText(/\b(19|20)\d{2}\b/)).not.toBeInTheDocument()
  })

  it('shows tagline, location and LinkedIn, and no phone, email or address', async () => {
    const { container } = render(await ResumePage())
    expect(screen.getByText('Backend Software Developer at Raymond James')).toBeInTheDocument()
    const contact = within(screen.getByRole('list', { name: 'Contact' }))
    expect(contact.getByText('Tampa, FL')).toBeInTheDocument()
    const linkedin = contact.getByRole('link', { name: 'LinkedIn: linkedin.com/in/prathamsachan (opens in a new tab)' })
    expect(linkedin).toHaveAttribute('href', 'https://linkedin.com/in/prathamsachan')
    expect(linkedin).toHaveAttribute('rel', 'noreferrer')
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i)
    expect(text).not.toMatch(/\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/)
    expect(text).not.toMatch(/undefined|null|Invalid Date|NaN/)
    expect(container.querySelector('a[href^="mailto:"], a[href^="tel:"]')).toBeNull()
  })

  it('links to the generated PDF', async () => {
    render(await ResumePage())
    expect(screen.getByRole('link', { name: /download pdf/i })).toHaveAttribute('href', '/resume.pdf')
    expect(RESUME_PDF_PATH).toBe('/resume.pdf')
  })

  it('still renders, from the repo content, when the API is down or slow', async () => {
    apiDown()
    render(await ResumePage())
    expect(fetch).toHaveBeenCalled()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pratham Sachan')
    expect(h2s()).toEqual(HEADINGS)
  })

  it('still renders when building the resume fails altogether', async () => {
    vi.mocked(getResumeData).mockRejectedValueOnce(new Error('boom'))
    render(await ResumePage())
    expect(h2s()).toEqual(HEADINGS)
  })

  it('omits a section that has nothing in it instead of showing it empty', async () => {
    vi.spyOn(api, 'getCertifications').mockResolvedValue([])
    vi.spyOn(api, 'getLeadership').mockResolvedValue([])
    vi.spyOn(api, 'getProjects').mockRejectedValue(new Error('boom'))
    render(await ResumePage())
    expect(h2s()).toEqual(['Experience', 'Education', 'Skills'])
    expect(screen.queryByRole('region', { name: 'Certifications' })).not.toBeInTheDocument()
  })

  it('has its own title, description and canonical URL', () => {
    expect(metadata.title).toBe('Resume')
    expect(metadata.alternates?.canonical).toBe('/resume')
    expect(metadata.openGraph?.url).toBe(RESUME_PATH)
    expect((metadata.description as string).length).toBeGreaterThan(20)
  })
})

describe('ResumeDocument', () => {
  const bare: ResumeData = { name: 'Test Person', tagline: '', location: '', links: [], sections: [] }

  it('renders with a name alone: no empty lists, sections or buttons', () => {
    const { container } = render(<ResumeDocument data={bare} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Person')
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(container.querySelectorAll('section, ul, dl, p')).toHaveLength(0)
  })

  it('renders an entry with only a title, and every optional part when present', () => {
    render(
      <ResumeDocument
        data={{
          ...bare,
          sections: [{
            id: 'experience', heading: 'Experience', layout: 'entries',
            entries: [
              { id: 'a', title: 'Only A Title', bullets: [], details: [], links: [] },
              {
                id: 'b', title: 'Everything', subtitle: 'Acme · Remote', date: 'Jan 2020 – Present',
                text: 'Did the work.', bullets: ['First win', 'Second win'],
                details: [{ label: 'Technologies', value: 'Java, Kafka' }],
                links: [{ label: 'Source', url: 'https://example.test/repo', display: 'example.test/repo' }],
              },
            ],
          }],
        }}
      />,
    )
    const [plain, full] = screen.getAllByRole('listitem').filter((li) => li.classList.contains('resume-entry'))
    expect(plain.querySelectorAll('p, ul, dl, a')).toHaveLength(0)
    expect(within(plain).getByRole('heading', { level: 3, name: 'Only A Title' })).toBeInTheDocument()

    const entry = within(full)
    expect(entry.getByText('Acme · Remote')).toBeInTheDocument()
    expect(entry.getByText('Jan 2020 – Present')).toBeInTheDocument()
    expect(entry.getByText('Did the work.')).toBeInTheDocument()
    expect(entry.getByText('Second win')).toBeInTheDocument()
    expect(entry.getByText('Java, Kafka')).toBeInTheDocument()
    expect(entry.getByRole('link', { name: 'Source: example.test/repo (opens in a new tab)' }))
      .toHaveAttribute('href', 'https://example.test/repo')
  })

  it('lets very long unbroken text wrap instead of widening the page', () => {
    const long = 'x'.repeat(400)
    render(
      <ResumeDocument
        data={{
          ...bare, name: long, tagline: long,
          sections: [{
            id: 'skills', heading: 'Skills', layout: 'inline',
            entries: [{ id: 's', title: long, text: long, bullets: [], details: [], links: [] }],
          }],
        }}
      />,
    )
    for (const element of screen.getAllByText(long)) {
      expect(element.closest('[class*="break-"]')).not.toBeNull()
    }
  })
})

describe('/resume.pdf route', () => {
  it('is static and revalidated hourly, like the pages', () => {
    expect(pdfRoute.dynamic).toBe('force-static')
    expect(pdfRoute.revalidate).toBe(3600)
  })

  it('answers with a PDF, a sensible file name and a canonical link to the page', async () => {
    const res = await pdfRoute.GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/pdf')
    expect(res.headers.get('content-disposition')).toBe('inline; filename="Pratham-Sachan-Resume.pdf"')
    expect(res.headers.get('link')).toBe('<https://justcallmepratt.dev/resume>; rel="canonical"')

    const pdf = new Uint8Array(await res.arrayBuffer())
    expect(res.headers.get('content-length')).toBe(String(pdf.byteLength))
    expect(pdfSource(pdf).startsWith('%PDF-')).toBe(true)
    const text = pdfText(pdf)
    expect(text).toContain('Pratham Sachan')
    for (const heading of HEADINGS) expect(text).toContain(heading.toUpperCase())
  })

  it('says exactly what the page says', async () => {
    const res = await pdfRoute.GET()
    const text = pdfText(new Uint8Array(await res.arrayBuffer())).replace(/\s+/g, ' ')
    for (const section of localResumeData().sections) {
      for (const entry of section.entries) {
        // Titles are short enough never to wrap, so each is one run of text.
        expect(text).toContain(entry.title)
      }
    }
  })

  it('still answers with the PDF when the API is down or slow', async () => {
    apiDown()
    const res = await pdfRoute.GET()
    expect(fetch).toHaveBeenCalled()
    expect(res.headers.get('content-type')).toBe('application/pdf')
    expect(pdfText(new Uint8Array(await res.arrayBuffer()))).toContain('EXPERIENCE')
  })

  it('falls back to the repo content when the live resume cannot be built', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(getResumeData).mockRejectedValueOnce(new Error('boom'))
    const res = await pdfRoute.GET()
    expect(res.status).toBe(200)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('using repo content'))
    expect(pdfText(new Uint8Array(await res.arrayBuffer()))).toContain('Pratham Sachan')
  })
})

describe('print stylesheet', () => {
  const css = readFileSync(path.resolve(__dirname, '../../app/globals.css'), 'utf8')
  const print = css.slice(css.indexOf('@media print'))

  it('prints the resume as black text on white with page margins', () => {
    expect(css).toContain('@media print')
    expect(print).toMatch(/@page\s*\{[^}]*margin/)
    expect(print).toMatch(/body\s*\{[^}]*background:\s*#FFFFFF\s*!important/)
    expect(print).toMatch(/\.resume \*\s*\{[^}]*color:\s*#000000\s*!important/)
    expect(print).toMatch(/\.resume-entry\s*\{[^}]*break-inside:\s*avoid/)
    expect(print).toMatch(/\.glitch-text::before,\s*\.glitch-text::after\s*\{[^}]*content:\s*none/)
  })

  it('hides the site chrome and the download button on paper', () => {
    for (const file of ['layout/Navbar.tsx', 'layout/Footer.tsx', 'layout/ScanlineOverlay.tsx', 'sections/ResumeDocument.tsx']) {
      const source = readFileSync(path.resolve(__dirname, '../../components', file), 'utf8')
      expect(source).toContain('print:hidden')
    }
    expect(print).toMatch(/\.skip-link\s*\{[^}]*visibility:\s*hidden/)
  })
})
