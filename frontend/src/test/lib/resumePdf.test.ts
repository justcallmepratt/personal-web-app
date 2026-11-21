// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { encodeWinAnsi, textWidth } from '@/lib/pdf/metrics'
import { PdfDocument } from '@/lib/pdf/writer'
import { localResumeData, type ResumeData, type ResumeEntry } from '@/lib/resume'
import { renderResumePdf, wrapText } from '@/lib/resumePdf'
import { pdfPageCount, pdfSource, pdfText, pdfTextRuns } from '../helpers/pdf'

const PAGE = { width: 612, height: 792, margin: 54 }
const NOW = new Date('2026-11-21T10:30:00Z')
const SITE = 'https://justcallmepratt.dev'

const entry = (fields: Partial<ResumeEntry> & { title: string }): ResumeEntry =>
  ({ id: fields.title, bullets: [], details: [], links: [], ...fields })

const bare: ResumeData = { name: 'Test Person', tagline: '', location: '', links: [], sections: [] }

/** Every run must sit inside the margins: nothing may run off the page. */
function expectInsideMargins(pdf: Uint8Array) {
  const runs = pdfTextRuns(pdf)
  expect(runs.length).toBeGreaterThan(0)
  for (const run of runs) {
    expect(run.x).toBeGreaterThanOrEqual(PAGE.margin)
    expect(run.x + textWidth(run.text, run.font, run.size)).toBeLessThanOrEqual(PAGE.width - PAGE.margin + 0.01)
    expect(run.y).toBeGreaterThan(PAGE.margin)
    expect(run.y).toBeLessThan(PAGE.height - PAGE.margin)
  }
}

/** Offsets in the cross-reference table must point at the objects they name. */
function expectValidStructure(pdf: Uint8Array) {
  const source = pdfSource(pdf)
  expect(source.startsWith('%PDF-1.4\n')).toBe(true)
  expect(source.endsWith('%%EOF\n')).toBe(true)
  const startxref = Number(source.match(/startxref\n(\d+)\n%%EOF/)?.[1])
  expect(source.slice(startxref, startxref + 4)).toBe('xref')
  const offsets = [...source.slice(startxref).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]))
  expect(offsets.length).toBeGreaterThan(5)
  offsets.forEach((offset, i) => {
    expect(source.slice(offset, offset + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`)
  })
  for (const m of source.matchAll(/<< \/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/g)) {
    expect(m[2].length).toBe(Number(m[1]))
  }
}

describe('resume PDF from the site content', () => {
  const data = localResumeData()
  const pdf = renderResumePdf(data, { siteUrl: SITE, now: NOW })
  const text = pdfText(pdf)

  it('is a non-empty, well-formed PDF', () => {
    expect(pdf.byteLength).toBeGreaterThan(2000)
    expectValidStructure(pdf)
  })

  it('contains the owner\'s name and every section heading as real text', () => {
    const runs = pdfTextRuns(pdf)
    expect(runs[0]).toMatchObject({ text: 'Pratham Sachan', font: 'bold', page: 0 })
    for (const heading of ['EXPERIENCE', 'EDUCATION', 'PROJECTS', 'SKILLS', 'CERTIFICATIONS', 'LEADERSHIP']) {
      expect(runs).toContainEqual(expect.objectContaining({ text: heading, font: 'bold' }))
    }
    expect(data.sections).toHaveLength(6)
  })

  it('contains the content of each section', () => {
    for (const expected of [
      'Backend Software Developer at Raymond James', 'Tampa, FL', 'Jul 2024 – Present',
      'B.S. in Computer Science', 'Business Management', 'Kafka Producer & Consumer Demo',
      'Microsoft Technology Associate', 'Co-founder and Vice President', 'Jan 2018 – May 2020',
    ]) {
      expect(text).toContain(expected)
    }
  })

  it('fits on one or two pages, inside the margins', () => {
    expect(pdfPageCount(pdf)).toBeGreaterThanOrEqual(1)
    expect(pdfPageCount(pdf)).toBeLessThanOrEqual(2)
    expectInsideMargins(pdf)
  })

  it('carries title, author, language and date metadata', () => {
    const source = pdfSource(pdf)
    expect(source).toContain('/Title (Pratham Sachan - Resume)')
    expect(source).toContain('/Author (Pratham Sachan)')
    expect(source).toContain('/Subject (Backend Software Developer at Raymond James)')
    expect(source).toContain('/CreationDate (D:20261121103000Z)')
    expect(source).toContain('/Lang (en)')
    expect(source).toContain('/DisplayDocTitle true')
  })

  it('is black text in standard fonts: no colour, no images, no embedded font', () => {
    const source = pdfSource(pdf)
    expect(source).toContain('/BaseFont /Helvetica ')
    expect(source).toContain('/BaseFont /Helvetica-Bold ')
    expect(source).not.toMatch(/\/FontFile|\/XObject|\/Image/)
    expect(source).not.toMatch(/\b(rg|RG|k|K|g|G)\n/)
  })

  it('makes the header and project addresses clickable', () => {
    const source = pdfSource(pdf)
    expect(source).toContain('/URI (https://linkedin.com/in/prathamsachan)')
    expect(source).toContain('/URI (https://justcallmepratt.dev/)')
    expect(source).toContain('/URI (https://github.com/justcallmepratt/personal-web-app)')
  })

  it('publishes no email address or phone number', () => {
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i)
    expect(text).not.toMatch(/\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/)
  })

  it('is the same bytes for the same content and time', () => {
    expect(Buffer.from(renderResumePdf(data, { siteUrl: SITE, now: NOW })).equals(Buffer.from(pdf))).toBe(true)
  })
})

describe('resume PDF edge cases', () => {
  it('renders a header-only PDF when every section is empty', () => {
    const pdf = renderResumePdf(bare, { now: NOW })
    expectValidStructure(pdf)
    expect(pdfPageCount(pdf)).toBe(1)
    expect(pdfText(pdf)).toBe('Test Person')
  })

  it('renders entries that have only a title', () => {
    const pdf = renderResumePdf({
      ...bare,
      sections: [
        { id: 'experience', heading: 'Experience', layout: 'entries', entries: [entry({ title: 'Developer' })] },
        { id: 'skills', heading: 'Skills', layout: 'inline', entries: [entry({ title: 'Backend' })] },
      ],
    }, { now: NOW })
    expectValidStructure(pdf)
    expect(pdfText(pdf).split('\n')).toEqual(['Test Person', 'EXPERIENCE', 'Developer', 'SKILLS', 'Backend'])
  })

  it('lines the values of a short-label section up in one column', () => {
    const pdf = renderResumePdf({
      ...bare,
      sections: [{
        id: 'skills', heading: 'Skills', layout: 'inline',
        entries: [
          entry({ title: 'Backend', text: 'Java, Kafka. '.repeat(30) }),
          entry({ title: 'Other', text: 'C' }),
        ],
      }],
    }, { now: NOW })
    const values = pdfTextRuns(pdf).filter((run) => run.font === 'regular')
    expect(values.length).toBeGreaterThan(3)
    expect(new Set(values.map((run) => run.x)).size).toBe(1)
    expect(values[0].x).toBeGreaterThan(PAGE.margin + textWidth('Backend', 'bold', 9.5))
    expectInsideMargins(pdf)
  })

  it('wraps very long text, long unbroken strings and long labels without leaving the page', () => {
    const unbroken = 'x'.repeat(900)
    const long = 'A sentence that keeps going and going. '.repeat(40)
    const pdf = renderResumePdf({
      name: `Someone With A ${unbroken.slice(0, 200)} Name`,
      tagline: long,
      location: long,
      links: [{ label: 'Site', url: `https://example.test/${unbroken}`, display: `example.test/${unbroken}` }],
      sections: [
        {
          id: 'experience', heading: 'Experience', layout: 'entries',
          entries: [entry({
            title: long, subtitle: unbroken, date: long, text: `${long}${unbroken}`,
            bullets: [long, unbroken],
            details: [{ label: unbroken.slice(0, 150), value: long }, { label: 'Short', value: unbroken }],
            links: [{ label: 'Source', url: `https://example.test/${unbroken}`, display: `example.test/${unbroken}` }],
          })],
        },
        {
          id: 'skills', heading: 'Skills', layout: 'inline',
          entries: [entry({ title: unbroken.slice(0, 150), text: long }), entry({ title: 'Backend', text: unbroken })],
        },
      ],
    }, { siteUrl: SITE, now: NOW })
    expectValidStructure(pdf)
    expectInsideMargins(pdf)
    // Nothing was dropped: every "x" of every unbroken string is still there.
    const xs = pdfText(pdf).replace(/[^x]/g, '').length
    expect(xs).toBeGreaterThanOrEqual(200 + 900 * 6 + 150 * 2)
  })

  it('continues on further pages when the content is long, keeping every page inside the margins', () => {
    const entries = Array.from({ length: 60 }, (_, i) =>
      entry({ title: `Role ${i}`, date: 'Jan 2020 – Present', text: 'Did things. '.repeat(30), bullets: ['One', 'Two'] }))
    const pdf = renderResumePdf({
      ...bare, sections: [{ id: 'experience', heading: 'Experience', layout: 'entries', entries }],
    }, { now: NOW })
    expectValidStructure(pdf)
    expectInsideMargins(pdf)
    const pages = pdfPageCount(pdf)
    expect(pages).toBeGreaterThan(3)
    expect(new Set(pdfTextRuns(pdf).map((r) => r.page)).size).toBe(pages)
    expect(pdfText(pdf)).toContain('Role 59')
    // An entry that fits on a page is never split across two.
    const runs = pdfTextRuns(pdf)
    const titles = runs.filter((run) => /^Role \d+$/.test(run.text))
    expect(titles).toHaveLength(60)
    titles.forEach((title, i) => {
      const end = i + 1 < titles.length ? runs.indexOf(titles[i + 1]) - 1 : runs.length
      const pagesUsed = new Set(runs.slice(runs.indexOf(title), end).map((run) => run.page))
      expect([...pagesUsed]).toEqual([title.page])
    })
    // The section heading stays with its first entry.
    expect(runs.find((run) => run.text === 'EXPERIENCE')?.page).toBe(titles[0].page)
  })

  it('moves a short section to the next page rather than splitting it', () => {
    const filler = entry({ title: 'Filler', text: 'Line. '.repeat(1200) })
    const skills = Array.from({ length: 6 }, (_, i) => entry({ title: `Area ${i}`, text: 'One, two, three' }))
    const pdf = renderResumePdf({
      ...bare,
      sections: [
        { id: 'experience', heading: 'Experience', layout: 'entries', entries: [filler] },
        { id: 'skills', heading: 'Skills', layout: 'inline', entries: skills },
      ],
    }, { now: NOW })
    expectValidStructure(pdf)
    expectInsideMargins(pdf)
    const runs = pdfTextRuns(pdf)
    const heading = runs.find((run) => run.text === 'SKILLS')
    const table = runs.slice(runs.indexOf(heading as never))
    expect(new Set(table.map((run) => run.page)).size).toBe(1)
    expect(table.filter((run) => run.font === 'bold').map((run) => run.text)).toEqual([
      'SKILLS', 'Area 0', 'Area 1', 'Area 2', 'Area 3', 'Area 4', 'Area 5',
    ])
    // Nothing was drawn twice when the block was taken back and redrawn.
    expect(runs.filter((run) => run.text === 'SKILLS')).toHaveLength(1)
  })

  it('keeps characters outside the font\'s encoding from breaking the file', () => {
    const pdf = renderResumePdf({
      ...bare,
      name: 'Zoë “Zo” Łukasz → 日本 😀',
      tagline: 'Tabs\tand\nnew lines (and) back\\slashes — fine',
    }, { now: NOW })
    expectValidStructure(pdf)
    expect(pdfText(pdf).split('\n')).toEqual([
      'Zoë “Zo” ?ukasz -> ?? ?',
      'Tabs and new lines (and) back\\slashes — fine',
    ])
    // The metadata keeps the real name, as UTF-16.
    expect(pdfSource(pdf)).toMatch(/\/Title <FEFF005A006F00EB/)
  })

  it('ignores a site address that is not http(s)', () => {
    const pdf = renderResumePdf(bare, { siteUrl: 'javascript:alert(1)', now: NOW })
    expect(pdfSource(pdf)).not.toContain('/Annots')
    expect(pdfText(pdf)).toBe('Test Person')
  })
})

describe('wrapText', () => {
  const width = (line: string) => textWidth(line, 'regular', 10)

  it('keeps every line within the width and loses no word', () => {
    const text = 'The quick brown fox jumps over the lazy dog and keeps running through the field'
    const lines = wrapText(text, 'regular', 10, 120)
    expect(lines.length).toBeGreaterThan(2)
    for (const line of lines) expect(width(line)).toBeLessThanOrEqual(120)
    expect(lines.join(' ')).toBe(text)
  })

  it('splits a word that is wider than the line', () => {
    const lines = wrapText('a ' + 'w'.repeat(100), 'regular', 10, 120)
    for (const line of lines) expect(width(line)).toBeLessThanOrEqual(120)
    expect(lines.join('')).toBe('a' + 'w'.repeat(100))
  })

  it('starts on the second line when nothing fits after a label', () => {
    expect(wrapText('word another', 'regular', 10, 120, 118)).toEqual(['', 'word another'])
    expect(wrapText('word another', 'regular', 10, 120, 20)).toEqual(['word another'])
  })

  it('returns no lines for empty or blank text', () => {
    expect(wrapText('', 'regular', 10, 120)).toEqual([])
    expect(wrapText('  \n ', 'regular', 10, 120)).toEqual([])
  })
})

describe('WinAnsi encoding and metrics', () => {
  it('keeps Latin-1 and maps typographic punctuation to single bytes', () => {
    expect(encodeWinAnsi('Café')).toBe('Caf\xe9')
    expect([...encodeWinAnsi('–—’“”•…€')].map((c) => c.charCodeAt(0))).toEqual([150, 151, 146, 147, 148, 149, 133, 128])
  })

  it('substitutes, unaccents or replaces everything else', () => {
    expect(encodeWinAnsi('a→b ≥ c')).toBe('a->b >= c')
    expect(encodeWinAnsi('Dvořák')).toBe('Dvor\xe1k')
    expect(encodeWinAnsi('日本😀')).toBe('???')
    expect(encodeWinAnsi('a\u200bb\ufeff')).toBe('ab')
    expect(encodeWinAnsi('a\tb\nc\x00d')).toBe('a b c d')
  })

  it('measures with the Helvetica widths', () => {
    expect(textWidth('', 'regular', 10)).toBe(0)
    expect(textWidth('Hi', 'regular', 10)).toBeCloseTo((722 + 222) / 100)
    expect(textWidth('Hi', 'bold', 10)).toBeCloseTo((722 + 278) / 100)
    expect(textWidth('–', 'regular', 1000)).toBe(556)
    // An unsupported character is measured as the "?" it is drawn as.
    expect(textWidth('日', 'regular', 10)).toBe(textWidth('?', 'regular', 10))
  })
})

describe('PdfDocument', () => {
  it('writes one page object per page and accepts only http(s) links', () => {
    const doc = new PdfDocument(200, 100)
    const first = doc.addPage()
    first.text(10, 50, 'Hello', 'regular', 10)
    first.text(10, 40, '   ', 'regular', 10) // blank: nothing drawn
    first.link(10, 48, 30, 12, 'https://example.test/a b')
    first.link(10, 48, 30, 12, 'javascript:alert(1)')
    first.link(10, 48, 30, 12, 'not a url')
    doc.addPage().rule(10, 190, 50)
    const pdf = doc.save({ title: 'T', author: 'A', date: NOW })

    expectValidStructure(pdf)
    expect(doc.pageCount).toBe(2)
    expect(pdfPageCount(pdf)).toBe(2)
    expect(pdfTextRuns(pdf)).toEqual([{ page: 0, font: 'regular', size: 10, x: 10, y: 50, text: 'Hello' }])
    const source = pdfSource(pdf)
    expect(source.match(/\/Subtype \/Link/g)).toHaveLength(1)
    expect(source).toContain('/URI (https://example.test/a%20b)')
    expect(source).toContain('/MediaBox [0 0 200 100]')
    expect(source).not.toContain('/Lang')
    expect(source).not.toContain('/Subject')
  })
})
