// Reads back what lib/pdf/writer.ts wrote, so tests can assert on the text a
// PDF really contains instead of on the raw bytes. It understands only that
// writer's output: uncompressed content streams with one "BT … Tj ET" per run.

export interface PdfTextRun {
  page: number
  font: 'regular' | 'bold'
  size: number
  x: number
  y: number
  text: string
}

export const pdfSource = (bytes: Uint8Array): string => Buffer.from(bytes).toString('latin1')

/** Undoes the literal-string escapes and decodes the WinAnsi bytes. */
function decodeLiteral(literal: string): string {
  const bytes: number[] = []
  for (let i = 0; i < literal.length; i++) {
    if (literal[i] !== '\\') {
      bytes.push(literal.charCodeAt(i))
    } else if (/[0-7]/.test(literal[i + 1])) {
      bytes.push(parseInt(literal.slice(i + 1, i + 4), 8))
      i += 3
    } else {
      bytes.push(literal.charCodeAt(i + 1))
      i += 1
    }
  }
  return new TextDecoder('windows-1252').decode(new Uint8Array(bytes))
}

export function pdfContentStreams(bytes: Uint8Array): string[] {
  return [...pdfSource(bytes).matchAll(/stream\n([\s\S]*?)\nendstream/g)].map((m) => m[1])
}

export function pdfTextRuns(bytes: Uint8Array): PdfTextRun[] {
  const run = /BT \/(F[12]) ([\d.]+) Tf ([\d.-]+) ([\d.-]+) Td \(((?:\\.|[^\\()])*)\) Tj ET/g
  return pdfContentStreams(bytes).flatMap((stream, page) =>
    [...stream.matchAll(run)].map((m) => ({
      page,
      font: m[1] === 'F2' ? ('bold' as const) : ('regular' as const),
      size: Number(m[2]),
      x: Number(m[3]),
      y: Number(m[4]),
      text: decodeLiteral(m[5]),
    })),
  )
}

/** All text of the document, one run per line. */
export const pdfText = (bytes: Uint8Array): string => pdfTextRuns(bytes).map((r) => r.text).join('\n')

export const pdfPageCount = (bytes: Uint8Array): number =>
  (pdfSource(bytes).match(/\/Type \/Page\b(?!s)/g) ?? []).length
