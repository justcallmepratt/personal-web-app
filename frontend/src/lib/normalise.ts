import type { Experience, Profile, Project, Skill } from './types'

// The Spring API's JSON is cast, not validated, when it arrives. The pages map
// over these lists and put these URLs into href, so a null list would crash a
// render and a `javascript:` URL would become a clickable link. These helpers
// give every list and map a safe value and blank any link that is not http(s)
// or a path on this site.

const SKILL_CATEGORIES: ReadonlySet<Skill['category']> = new Set([
  'Frontend', 'Backend', 'DevOps', 'AI/ML', 'Business & Leadership', 'Other',
])

/**
 * The URL when it is http(s) or a path on this site (`/projects/kafka`, not the
 * protocol-relative `//host`), otherwise an empty string, which the pages treat
 * as "no link".
 */
export function safeUrl(value: unknown): string {
  if (typeof value !== 'string') return ''
  const url = value.trim()
  return /^https?:\/\//i.test(url) || /^\/(?![/\\])/.test(url) ? url : ''
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function links(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(value)) {
    const url = safeUrl(v)
    if (url) out[k] = url
  }
  return out
}

function skills(value: unknown): Skill[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((s): s is Record<string, unknown> => isRecord(s) && typeof s.name === 'string')
    .map((s) => ({
      ...(s as unknown as Skill),
      category: SKILL_CATEGORIES.has(s.category as Skill['category']) ? (s.category as Skill['category']) : 'Other',
    }))
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function normaliseProfile(p: Profile): Profile {
  return {
    ...p,
    name: text(p.name),
    tagline: text(p.tagline),
    bio: text(p.bio),
    avatarUrl: safeUrl(p.avatarUrl),
    cvUrl: safeUrl(p.cvUrl),
    techStack: strings(p.techStack),
    socials: links(p.socials),
    skills: skills(p.skills),
  }
}

export function normaliseProject(p: Project): Project {
  return {
    ...p,
    title: text(p.title),
    description: text(p.description),
    tags: strings(p.tags),
    stack: strings(p.stack),
    demoUrl: safeUrl(p.demoUrl),
    repoUrl: safeUrl(p.repoUrl),
    imageUrl: safeUrl(p.imageUrl),
  }
}

export function normaliseExperience(e: Experience): Experience {
  return {
    ...e,
    company: text(e.company),
    role: text(e.role),
    description: text(e.description),
    highlights: strings(e.highlights),
    technologies: strings(e.technologies),
  }
}

/** A list from the API: anything that is not an array becomes empty, and non-objects are dropped. */
export function normaliseList<T>(value: unknown, one: (item: T) => T): T[] {
  return Array.isArray(value) ? value.filter(isRecord).map((item) => one(item as T)) : []
}
