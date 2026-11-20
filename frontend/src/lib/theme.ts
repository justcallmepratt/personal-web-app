// Accent colours for inline styles (glows and borders need raw hex values).
// Keep in sync with the tokens in src/app/globals.css.
//
// `line` is for borders, fills and glows. `text` is for text and must reach
// WCAG AA 4.5:1 on the darkest and lightest site backgrounds (#000 to #111318).
// Only red differs: the deep red is 3.0-3.4:1, so text uses the neon red.

export type Accent = 'red' | 'yellow' | 'teal'

export const accents: Record<Accent, { line: string; text: string }> = {
  red: { line: '#C5003C', text: '#FF2E57' },
  yellow: { line: '#F3E600', text: '#F3E600' },
  teal: { line: '#55EAD4', text: '#55EAD4' },
}
