import { LOAD_ERRORS } from './messages'
import type { FailureKind, Suggestion, SuggestionTarget, SuggestionValue } from './types'

// Shared by the suggestions page (server) and its client component.

/** What the suggestions page shows when it could not load on the server. */
export const SUGGESTION_LOAD_ERRORS: Record<Exclude<FailureKind, 'unauthorized'>, string> = {
  ...LOAD_ERRORS,
  not_found: 'The API has no suggestions endpoint at the expected address. It may be running an older version.',
}

// The API's limits (SuggestionFields / SuggestionService), mirrored so a mistake
// is caught before a round trip. The API remains the authority.
export const LONG_TEXT_MAX = 10000
export const LIST_ITEM_MAX = 255
export const LIST_MAX_ITEMS = 50
export const REASON_MAX = 500

const TYPE_NAMES: Record<string, string> = { profile: 'Profile', experience: 'Experience', project: 'Project' }

/** "Experience · Engineer at Acme", "Profile", or a fallback when the row is gone. */
export function targetTitle(s: Pick<Suggestion, 'targetType' | 'targetId' | 'targetLabel'>): string {
  const type = TYPE_NAMES[s.targetType] ?? s.targetType
  if (s.targetLabel === null) return `${type} #${s.targetId} (no longer exists)`
  return s.targetType === 'profile' ? type : `${type} · ${s.targetLabel}`
}

export function targetOptionLabel(t: SuggestionTarget): string {
  return t.targetType === 'profile' ? 'Profile' : `${TYPE_NAMES[t.targetType]} · ${t.label}`
}

export const targetKey = (t: Pick<SuggestionTarget, 'targetType' | 'targetId'>) => `${t.targetType}:${t.targetId}`

/** "techStack" → "tech stack", "longDescription" → "long description". */
export function fieldLabel(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
}

/** One item per line; blank lines and surrounding spaces are dropped. */
export function linesToList(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

/** How a value is shown in an editing box. */
export function valueToText(value: SuggestionValue): string {
  if (value === null) return ''
  return Array.isArray(value) ? value.join('\n') : value
}

export function sameValue(a: SuggestionValue, b: SuggestionValue): boolean {
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((item, i) => item === b[i])
  return a === b
}
