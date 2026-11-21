// Text encoding and glyph widths for the two fonts the resume PDF uses.
//
// Helvetica and Helvetica-Bold are among the 14 standard PDF fonts: every
// viewer supplies them, so no font file is embedded and the PDF stays a few
// kilobytes. Text is written in WinAnsiEncoding (Windows-1252), one byte per
// character. The widths below are needed only to wrap and right-align text.
//
// WIDTHS[font][code - 32] is the advance of WinAnsi code 32..255 in 1/1000 em,
// taken from Adobe's Core 14 AFM files (Helvetica.afm, Helvetica-Bold.afm:
// Copyright (c) 1985, 1987, 1989, 1990, 1997 Adobe Systems Incorporated. All
// Rights Reserved. The AFM files may be used, copied and distributed for any
// purpose and without charge, with or without modification, provided the
// copyright notices are retained). 0 marks a code WinAnsi leaves undefined.

export type PdfFont = 'regular' | 'bold'

const WIDTHS: Record<PdfFont, readonly number[]> = {
  regular: [
    278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,
    1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,
    333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,0,
    556,0,222,556,333,1000,556,556,333,1000,667,333,1000,0,611,0,0,222,222,333,333,350,556,1000,333,1000,500,333,944,0,500,500,
    278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,
    667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,
    556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500,
  ],
  bold: [
    278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,
    975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,
    333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,0,
    556,0,278,556,500,1000,556,556,333,1000,667,333,1000,0,611,0,0,278,278,500,500,350,556,1000,333,1000,556,333,944,0,500,556,
    278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,
    722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,
    556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556,
  ],
}

/** Unicode code points that Windows-1252 keeps in 0x80–0x9F (dashes, curly quotes, bullet, …). */
const CP1252: Readonly<Record<number, number>> = {
  0x20ac: 128, 0x201a: 130, 0x0192: 131, 0x201e: 132, 0x2026: 133, 0x2020: 134, 0x2021: 135,
  0x02c6: 136, 0x2030: 137, 0x0160: 138, 0x2039: 139, 0x0152: 140, 0x017d: 142,
  0x2018: 145, 0x2019: 146, 0x201c: 147, 0x201d: 148, 0x2022: 149, 0x2013: 150, 0x2014: 151,
  0x02dc: 152, 0x2122: 153, 0x0161: 154, 0x203a: 155, 0x0153: 156, 0x017e: 158, 0x0178: 159,
}

/** Plain stand-ins for a few characters WinAnsi lacks but content might use. */
const SUBSTITUTES: Readonly<Record<string, string>> = {
  '→': '->', '←': '<-', '⇒': '=>', '≥': '>=', '≤': '<=', '≠': '!=', '−': '-', '‐': '-', '‑': '-',
  '′': "'", '″': '"', '✓': 'x', '✔': 'x',
}

const INVISIBLE = /[\u0300-\u036f\u200b-\u200f\u2028-\u202e\u2060\ufe00-\ufe0f\ufeff]/

function codeFor(codePoint: number): number | null {
  // Tabs, newlines and other controls become a space: a PDF text line has none.
  if (codePoint < 32 || codePoint === 127) return 32
  if (codePoint < 127 || (codePoint >= 160 && codePoint <= 255)) return codePoint
  return CP1252[codePoint] ?? null
}

/**
 * Text as WinAnsi: a string whose every char code (32..255) is one PDF byte.
 * A character outside the encoding is replaced by a plain stand-in, by its
 * unaccented form, or as a last resort by "?", so no input can break the file.
 */
export function encodeWinAnsi(text: string): string {
  let out = ''
  for (const char of text) {
    const code = codeFor(char.codePointAt(0) as number)
    if (code !== null) {
      out += String.fromCharCode(code)
      continue
    }
    if (INVISIBLE.test(char)) continue
    let replacement = ''
    for (const part of SUBSTITUTES[char] ?? char.normalize('NFKD')) {
      const partCode = codeFor(part.codePointAt(0) as number)
      if (partCode !== null) replacement += String.fromCharCode(partCode)
    }
    out += replacement.trim() ? replacement : '?'
  }
  return out
}

/** Width in points of text set in `font` at `size`. */
export function textWidth(text: string, font: PdfFont, size: number): number {
  const widths = WIDTHS[font]
  let units = 0
  for (const char of encodeWinAnsi(text)) units += widths[char.charCodeAt(0) - 32] ?? 0
  return (units * size) / 1000
}
