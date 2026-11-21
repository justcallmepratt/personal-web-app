import { createHash } from 'node:crypto'
import { encodeWinAnsi, type PdfFont } from './metrics'

// A minimal PDF 1.4 writer: pages of real, selectable text in the standard
// Helvetica fonts, thin horizontal rules, clickable links and document
// metadata. That is everything a text resume needs, in under two hundred lines
// and with no dependency. It is server-only (node:crypto) and never reaches
// the browser bundle. Coordinates are PDF points with the origin bottom-left.

const FONT_NAMES: Record<PdfFont, string> = { regular: 'F1', bold: 'F2' }

const num = (value: number) => String(Math.round(value * 100) / 100)

/** A PDF literal string of WinAnsi bytes: ASCII only, the rest as octal escapes. */
function literal(encoded: string): string {
  let out = '('
  for (const char of encoded) {
    const code = char.charCodeAt(0)
    if (char === '\\' || char === '(' || char === ')') out += `\\${char}`
    else if (code < 32 || code > 126) out += `\\${code.toString(8).padStart(3, '0')}`
    else out += char
  }
  return `${out})`
}

/** A metadata string: plain when ASCII, otherwise UTF-16BE with a byte-order mark. */
function metadataString(text: string): string {
  if (/^[\x20-\x7e]*$/.test(text)) return literal(text)
  let hex = 'FEFF'
  for (let i = 0; i < text.length; i++) hex += text.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0')
  return `<${hex}>`
}

const pdfDate = (date: Date) =>
  `(D:${date.toISOString().replace(/[-:T]/g, '').slice(0, 14)}Z)`

export class PdfPage {
  private readonly ops: string[] = []
  private readonly annotations: string[] = []

  /** Draws one line of text with its baseline starting at (x, y). */
  text(x: number, y: number, text: string, font: PdfFont, size: number): void {
    const encoded = encodeWinAnsi(text)
    if (!encoded.trim()) return
    this.ops.push(`BT /${FONT_NAMES[font]} ${num(size)} Tf ${num(x)} ${num(y)} Td ${literal(encoded)} Tj ET`)
  }

  /** A horizontal black rule from x1 to x2 at height y. */
  rule(x1: number, x2: number, y: number, thickness = 0.5): void {
    this.ops.push(`${num(thickness)} w ${num(x1)} ${num(y)} m ${num(x2)} ${num(y)} l S`)
  }

  /** Makes a rectangle clickable. Only absolute http(s) addresses are accepted. */
  link(x: number, y: number, width: number, height: number, url: string): void {
    let href: string
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return
      href = parsed.href // percent-encoded and punycoded, so always ASCII
    } catch {
      return
    }
    this.annotations.push(
      `<< /Type /Annot /Subtype /Link /Rect [${num(x)} ${num(y)} ${num(x + width)} ${num(y + height)}] ` +
      `/Border [0 0 0] /A << /S /URI /URI ${literal(href)} >> >>`,
    )
  }

  /** A point to `rewind` to, for layouts that draw a block and then move it. */
  mark(): readonly [number, number] {
    return [this.ops.length, this.annotations.length]
  }

  /** Removes everything drawn since `mark`. */
  rewind(mark: readonly [number, number]): void {
    this.ops.length = mark[0]
    this.annotations.length = mark[1]
  }

  /** @internal */
  content(): string {
    return this.ops.join('\n')
  }

  /** @internal */
  annots(): string {
    return this.annotations.length ? ` /Annots [${this.annotations.join(' ')}]` : ''
  }
}

export interface PdfInfo {
  title: string
  author: string
  subject?: string
  creator?: string
  /** Creation and modification time; defaults to now. */
  date?: Date
  /** BCP 47 language of the text, e.g. "en". */
  lang?: string
}

export class PdfDocument {
  private readonly pages: PdfPage[] = []

  constructor(readonly width: number, readonly height: number) {}

  addPage(): PdfPage {
    const page = new PdfPage()
    this.pages.push(page)
    return page
  }

  /** Drops every page after the first `count`. */
  truncate(count: number): void {
    this.pages.length = Math.min(this.pages.length, Math.max(1, count))
  }

  get pageCount(): number {
    return this.pages.length
  }

  save(info: PdfInfo): Uint8Array {
    // Object numbers: 1 catalog, 2 page tree, 3-4 fonts, then a page and its
    // content stream per page, and the info dictionary last.
    const pageRef = (i: number) => 5 + i * 2
    const infoRef = 5 + this.pages.length * 2
    const lang = info.lang && /^[A-Za-z-]{2,16}$/.test(info.lang) ? ` /Lang (${info.lang})` : ''
    const font = (base: string) =>
      `<< /Type /Font /Subtype /Type1 /BaseFont /${base} /Encoding /WinAnsiEncoding >>`

    const objects: string[] = [
      `<< /Type /Catalog /Pages 2 0 R${lang} /ViewerPreferences << /DisplayDocTitle true >> >>`,
      `<< /Type /Pages /Kids [${this.pages.map((_, i) => `${pageRef(i)} 0 R`).join(' ')}] /Count ${this.pages.length} >>`,
      font('Helvetica'),
      font('Helvetica-Bold'),
    ]
    this.pages.forEach((page, i) => {
      const content = page.content()
      objects.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(this.width)} ${num(this.height)}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageRef(i) + 1} 0 R${page.annots()} >>`,
        // Content is ASCII (see literal()), so its length in chars is its length in bytes.
        `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
      )
    })
    const date = pdfDate(info.date ?? new Date())
    objects.push(
      `<< /Title ${metadataString(info.title)} /Author ${metadataString(info.author)}` +
      (info.subject ? ` /Subject ${metadataString(info.subject)}` : '') +
      (info.creator ? ` /Creator ${metadataString(info.creator)}` : '') +
      ` /Producer ${metadataString(info.creator ?? info.author)} /CreationDate ${date} /ModDate ${date} >>`,
    )

    // The second line is the customary "this file is binary" marker; its four
    // chars are single bytes in latin1, like everything else in the file.
    let body = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n'
    const offsets: number[] = []
    objects.forEach((object, i) => {
      offsets.push(body.length)
      body += `${i + 1} 0 obj\n${object}\nendobj\n`
    })
    const id = createHash('md5').update(body, 'latin1').digest('hex').toUpperCase()
    const xref = body.length
    body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
    for (const offset of offsets) body += `${String(offset).padStart(10, '0')} 00000 n \n`
    body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info ${infoRef} 0 R /ID [<${id}> <${id}>] >>\n`
    body += `startxref\n${xref}\n%%EOF\n`
    return new Uint8Array(Buffer.from(body, 'latin1'))
  }
}
