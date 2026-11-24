import { textWidth, type PdfFont } from './pdf/metrics'
import { PdfDocument, type PdfPage } from './pdf/writer'
import { toLink, type ResumeData, type ResumeEntry, type ResumeLink, type ResumeSection } from './resume'

// Draws the resume model (lib/resume.ts) as a US Letter PDF: black text on
// white, top to bottom, starting a new page whenever the next line would not
// fit. Nothing here knows about the content; it only lays out strings.

// 0.6 in margins and 10 pt body text: within the ranges in
// docs/RESUME_GUIDE.md (0.5-0.75 in, 10 pt or more), and as compact as they allow.
const PAGE = { width: 612, height: 792, margin: 43 }
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2
const RIGHT = PAGE.width - PAGE.margin
const SIZE = { name: 20, tagline: 11, heading: 10.5, title: 10.5, body: 10 }
const LINE_HEIGHT = 1.32
const SEPARATOR = '   |   '

/**
 * Breaks text into lines no wider than `maxWidth`. A word that is wider than a
 * whole line (a long URL, a string with no spaces) is split between characters
 * rather than left to run off the page. `firstLineOffset` shortens the first
 * line, for text that continues after a label; if not even one word fits
 * there, the first line comes back empty and the text starts on the second.
 */
export function wrapText(
  text: string, font: PdfFont, size: number, maxWidth: number, firstLineOffset = 0,
): string[] {
  const width = (value: string) => textWidth(value, font, size)
  const lines: string[] = []
  let line = ''
  let limit = Math.max(0, maxWidth - firstLineOffset)
  const pushLine = () => {
    lines.push(line)
    line = ''
    limit = maxWidth
  }

  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word
    if (width(candidate) <= limit) {
      line = candidate
      continue
    }
    // Close the current line; an empty first line is kept only after a label.
    if (line || (lines.length === 0 && firstLineOffset > 0)) pushLine()
    if (width(word) <= limit) {
      line = word
      continue
    }
    for (const char of word) {
      if (line && width(line + char) > limit) pushLine()
      line += char
    }
  }
  if (line) lines.push(line)
  return lines
}

class Layout {
  readonly doc = new PdfDocument(PAGE.width, PAGE.height)
  private page: PdfPage = this.doc.addPage()
  /** Top of the next line, in points from the bottom of the page. */
  private y = PAGE.height - PAGE.margin

  /** Starts a new page unless `height` more points fit on this one. */
  ensure(height: number): void {
    if (this.y - height >= PAGE.margin) return
    this.page = this.doc.addPage()
    this.y = PAGE.height - PAGE.margin
  }

  /**
   * Draws a block and, if it turned out to straddle a page break, takes it
   * back and draws it again from the top of a new page. A block taller than a
   * page still breaks, line by line, as usual.
   */
  keepTogether(draw: () => void): void {
    const top = PAGE.height - PAGE.margin
    const start = { page: this.page, y: this.y, pages: this.doc.pageCount, mark: this.page.mark() }
    draw()
    if (this.doc.pageCount === start.pages || start.y === top) return
    start.page.rewind(start.mark)
    this.doc.truncate(start.pages)
    this.page = this.doc.addPage()
    this.y = top
    draw()
  }

  gap(height: number): void {
    this.y -= height
  }

  /** Draws wrapped lines, one per row, breaking to a new page between rows as needed. */
  lines(rows: string[], font: PdfFont, size: number, x = PAGE.margin, firstLineOffset = 0): void {
    rows.forEach((row, i) => {
      const height = size * LINE_HEIGHT
      this.ensure(height)
      this.page.text(x + (i === 0 ? firstLineOffset : 0), this.y - size, row, font, size)
      this.y -= height
    })
  }

  paragraph(text: string, font: PdfFont, size: number, x = PAGE.margin): void {
    this.lines(wrapText(text, font, size, RIGHT - x), font, size, x)
  }

  /**
   * "Label  value" with the label in bold and the value running on after it,
   * its further lines starting at the margin; a label too long to share a
   * row gets its own.
   */
  labelled(label: string, value: string, size: number, spacing: number): void {
    const labelWidth = textWidth(label, 'bold', size)
    if (labelWidth + spacing > CONTENT_WIDTH * 0.6) {
      this.paragraph(label, 'bold', size)
      if (value) this.paragraph(value, 'regular', size)
      return
    }
    this.ensure(size * LINE_HEIGHT)
    this.page.text(PAGE.margin, this.y - size, label, 'bold', size)
    const rows = value ? wrapText(value, 'regular', size, CONTENT_WIDTH, labelWidth + spacing) : ['']
    this.lines(rows, 'regular', size, PAGE.margin, labelWidth + spacing)
  }

  /** A link on its own row, clickable when it fits on one line. */
  linkRow(link: ResumeLink, size: number): void {
    const prefix = `${link.label}: `
    const rows = wrapText(prefix + link.display, 'regular', size, CONTENT_WIDTH)
    if (rows.length === 1) {
      this.ensure(size * LINE_HEIGHT)
      const start = PAGE.margin + textWidth(prefix, 'regular', size)
      this.page.link(start, this.y - size - 2, textWidth(link.display, 'regular', size), size + 3, link.url)
    }
    this.lines(rows, 'regular', size)
  }

  /** Items on one row separated by bars, continuing on further rows when they do not fit. */
  contactRow(items: Array<{ text: string; url?: string }>, size: number): void {
    const height = size * LINE_HEIGHT
    const separatorWidth = textWidth(SEPARATOR, 'regular', size)
    let x = PAGE.margin
    const newRow = () => {
      this.y -= height
      x = PAGE.margin
    }
    for (const item of items) {
      const width = textWidth(item.text, 'regular', size)
      if (width > CONTENT_WIDTH) {
        // Wider than the page: wrap it as plain text on rows of its own.
        if (x > PAGE.margin) newRow()
        this.paragraph(item.text, 'regular', size)
        continue
      }
      if (x > PAGE.margin && x + separatorWidth + width > RIGHT) newRow()
      this.ensure(height)
      if (x > PAGE.margin) {
        this.page.text(x, this.y - size, SEPARATOR, 'regular', size)
        x += separatorWidth
      }
      this.page.text(x, this.y - size, item.text, 'regular', size)
      if (item.url) this.page.link(x, this.y - size - 2, width, size + 3, item.url)
      x += width
    }
    if (x > PAGE.margin) newRow()
  }

  rule(thickness: number): void {
    this.page.rule(PAGE.margin, RIGHT, this.y, thickness)
  }

  heading(text: string): void {
    this.gap(9)
    // Keep a heading together with the start of its first entry.
    this.ensure(SIZE.heading * LINE_HEIGHT + 6 + (SIZE.title + SIZE.body) * LINE_HEIGHT)
    this.paragraph(text.toUpperCase(), 'bold', SIZE.heading)
    this.gap(1)
    this.rule(0.5)
    this.gap(5)
  }

  entry(item: ResumeEntry): void {
    const size = SIZE.body
    // Keep the title row together with the row after it.
    this.ensure((SIZE.title + size) * LINE_HEIGHT)

    const dateWidth = item.date ? textWidth(item.date, 'regular', size) : 0
    const dateBeside = dateWidth > 0 && dateWidth <= CONTENT_WIDTH * 0.5
    const titleWidth = dateBeside ? CONTENT_WIDTH - dateWidth - 12 : CONTENT_WIDTH
    // The title is written before the date beside it, so text extraction (and
    // an ATS reading the content stream) gets "Title  Date", not "DateTitle".
    const titleRow = { page: this.page, y: this.y }
    this.lines(wrapText(item.title, 'bold', SIZE.title, titleWidth), 'bold', SIZE.title)
    if (dateBeside) {
      titleRow.page.text(RIGHT - dateWidth, titleRow.y - SIZE.title, item.date as string, 'regular', size)
    }
    if (item.date && !dateBeside) this.paragraph(item.date, 'regular', size)

    if (item.subtitle) this.paragraph(item.subtitle, 'regular', size)
    if (item.text) this.paragraph(item.text, 'regular', size)
    for (const bullet of item.bullets) {
      this.ensure(size * LINE_HEIGHT)
      this.page.text(PAGE.margin + 6, this.y - size, '•', 'regular', size)
      this.paragraph(bullet, 'regular', size, PAGE.margin + 16)
    }
    for (const detail of item.details) this.labelled(`${detail.label}:`, detail.value, size, 4)
    for (const link of item.links) this.linkRow(link, size)
    this.gap(5)
  }

  section(section: ResumeSection): void {
    if (section.layout === 'entries') {
      // The heading stays with its first entry, and no entry is split across
      // pages unless it is longer than a page.
      const [first, ...rest] = section.entries
      this.keepTogether(() => {
        this.heading(section.heading)
        this.entry(first)
      })
      for (const item of rest) this.keepTogether(() => this.entry(item))
      return
    }
    // "Label: value" rows, each value running on right after its label. No
    // aligned value column: layout-based extractors read an aligned column as
    // a table and separate the labels from their values.
    // A short list (skills, certifications) is kept whole.
    this.keepTogether(() => {
      this.heading(section.heading)
      for (const item of section.entries) {
        this.labelled(item.text ? `${item.title}:` : item.title, item.text ?? '', SIZE.body, 4)
      }
    })
  }
}

export interface ResumePdfOptions {
  /** The site's address, printed in the header as a link. */
  siteUrl?: string
  /** Timestamp for the document metadata; defaults to the moment of generation. */
  now?: Date
}

/** The resume as PDF bytes: selectable text, with title and author metadata. */
export function renderResumePdf(data: ResumeData, options: ResumePdfOptions = {}): Uint8Array {
  const layout = new Layout()

  layout.paragraph(data.name, 'bold', SIZE.name)
  if (data.tagline) {
    layout.gap(1)
    layout.paragraph(data.tagline, 'regular', SIZE.tagline)
  }
  const site = options.siteUrl ? toLink('Website', options.siteUrl) : null
  const contact = [
    ...(data.location ? [{ text: data.location }] : []),
    ...(site ? [{ text: site.display, url: site.url }] : []),
    ...data.links.map((link) => ({ text: link.display, url: link.url })),
  ]
  if (contact.length) {
    layout.gap(2)
    layout.contactRow(contact, SIZE.body)
  }
  layout.gap(4)
  layout.rule(1)

  for (const section of data.sections) layout.section(section)

  return layout.doc.save({
    title: `${data.name} - Resume`,
    author: data.name,
    subject: data.tagline || undefined,
    creator: site?.display,
    date: options.now,
    lang: 'en',
  })
}
