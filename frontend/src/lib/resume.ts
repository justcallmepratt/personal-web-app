import { api } from './api'
import { formatDateRange, formatIsoDate } from './dates'
import { absoluteUrl, siteName } from './site'
import type { Certification, Education, Experience, Leadership, Profile, Project, Research } from './types'
import {
  profile as localProfile, projects as localProjects, experience as localExperience,
  certifications as localCertifications, education as localEducation, leadership as localLeadership,
  research as localResearch,
} from '@/content'

// ── The resume ───────────────────────────────────────────────────────────────
//
//  One model, two renderers. `getResumeData()` reads the same getters as every
//  other page (so it follows the API and falls back to the repo content) and
//  turns the result into plain, already-formatted text. The /resume page
//  (components/sections/ResumeDocument.tsx) and the /resume.pdf route
//  (lib/resumePdf.ts) both draw exactly this, so they cannot drift apart and
//  neither is ever edited by hand.
//
//  Everything from the API is treated as untrusted in shape: missing fields,
//  nulls and wrong types are dropped here, an entry without a title is
//  skipped, and a section with no entries is left out altogether.
// ────────────────────────────────────────────────────────────────────────────

export interface ResumeLink {
  label: string
  url: string
  /** The address as printed: no protocol, no "www.", no trailing slash. */
  display: string
}

export interface ResumeDetail {
  label: string
  value: string
}

export interface ResumeEntry {
  id: string
  title: string
  subtitle?: string
  date?: string
  text?: string
  bullets: string[]
  details: ResumeDetail[]
  links: ResumeLink[]
}

export type ResumeSectionId =
  | 'experience' | 'education' | 'projects' | 'publications' | 'skills' | 'certifications' | 'leadership'

export interface ResumeSection {
  id: ResumeSectionId
  heading: string
  /** `entries`: title, date and body per entry. `inline`: "title  text" rows. */
  layout: 'entries' | 'inline'
  entries: ResumeEntry[]
}

export interface ResumeData {
  name: string
  tagline: string
  location: string
  links: ResumeLink[]
  sections: ResumeSection[]
}

export interface ResumeSources {
  profile: Profile | null
  experience: Experience[]
  education: Education[]
  projects: Project[]
  certifications: Certification[]
  leadership: Leadership[]
  research: Research[]
}

export const RESUME_HEADINGS: Record<ResumeSectionId, string> = {
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  publications: 'Publications',
  skills: 'Skills',
  certifications: 'Certifications',
  leadership: 'Leadership',
}

// ── Cleaning helpers ────────────────────────────────────────────────────────

/** A trimmed, single-spaced string; anything that is not a string becomes ''. */
const clean = (value: unknown): string =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''

const list = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])

const strings = (value: unknown): string[] => list<unknown>(value).map(clean).filter(Boolean)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Typed rows of a list that may be missing, null or hold junk. */
const records = <T>(value: unknown): T[] => list<unknown>(value).filter(isRecord) as T[]

const join = (parts: string[], separator = ' · ') => parts.filter(Boolean).join(separator)

const present = <T>(value: T | null | undefined): value is T => value != null

const LINK_LABELS: Record<string, string> = { linkedin: 'LinkedIn', github: 'GitHub' }

/** A link for an absolute http(s) URL; anything else (javascript:, mailto:, junk) is dropped. */
export function toLink(label: string, url: unknown): ResumeLink | null {
  const value = clean(url)
  if (!/^https?:\/\//i.test(value)) return null
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return null
  }
  const display = `${parsed.host.replace(/^www\./i, '')}${parsed.pathname.replace(/\/+$/, '')}`
  return { label: clean(label) || display, url: parsed.href, display }
}

// ── Sections ────────────────────────────────────────────────────────────────

function entry(id: string, fields: Partial<ResumeEntry> & { title: string }): ResumeEntry {
  return { bullets: [], details: [], links: [], ...fields, id }
}

function experienceEntries(items: unknown): ResumeEntry[] {
  return records<Experience>(items).flatMap((e, i) => {
    const role = clean(e.role)
    const title = role || clean(e.company)
    if (!title) return []
    const technologies = strings(e.technologies)
    return [entry(`experience-${i}`, {
      title,
      subtitle: join([role ? clean(e.company) : '', clean(e.location)]) || undefined,
      date: formatDateRange(e.startDate, e.endDate, e.current) ?? undefined,
      text: clean(e.description) || undefined,
      bullets: strings(e.highlights),
      details: technologies.length ? [{ label: 'Technologies', value: technologies.join(', ') }] : [],
    })]
  })
}

function educationEntries(items: unknown): ResumeEntry[] {
  return records<Education>(items).flatMap((e, i) => {
    const degree = clean(e.degree)
    const title = degree || clean(e.institution)
    if (!title) return []
    const details: ResumeDetail[] = []
    if (clean(e.minor)) details.push({ label: 'Minor', value: clean(e.minor) })
    if (clean(e.honours)) details.push({ label: 'Honours', value: clean(e.honours) })
    return [entry(`education-${i}`, {
      title,
      subtitle: join([degree ? clean(e.institution) : '', clean(e.school)]) || undefined,
      date: formatIsoDate(e.year) ?? undefined,
      details,
    })]
  })
}

/** The most projects the resume prints, so that it stays on one page. */
export const MAX_RESUME_PROJECTS = 3

/**
 * The featured projects, in order, or the first few when none is featured.
 * The site lists every project; the resume keeps to the strongest.
 */
function resumeProjects(items: unknown): Project[] {
  const all = records<Project>(items).filter((p) => clean(p.title))
  const featured = all.filter((p) => p.featured === true)
  return (featured.length ? featured : all).slice(0, MAX_RESUME_PROJECTS)
}

function projectEntries(items: unknown): ResumeEntry[] {
  return resumeProjects(items).map((p, i) => {
    const title = clean(p.title)
    // `tags` are labels ("Prototype"), not technologies, so they are not a fallback.
    const stack = strings(p.stack)
    // A demo on this site is stored as a path; print it as a full address.
    const demo = clean(p.demoUrl)
    const links = [
      toLink('Source', p.repoUrl),
      toLink('Demo', demo.startsWith('/') && !demo.startsWith('//') ? absoluteUrl(demo) : demo),
    ].filter(present)
    return entry(`project-${i}`, {
      title,
      text: clean(p.description) || undefined,
      details: stack.length ? [{ label: 'Stack', value: stack.join(', ') }] : [],
      links,
    })
  })
}

const SKILL_ORDER = ['Backend', 'Frontend', 'DevOps', 'Business & Leadership', 'Other']

function skillEntries(profile: Profile | null): ResumeEntry[] {
  const groups = new Map<string, string[]>()
  for (const skill of records<Profile['skills'][number]>(profile?.skills)) {
    const name = clean(skill.name)
    if (!name) continue
    const category = clean(skill.category) || 'Other'
    const names = groups.get(category) ?? []
    if (!names.includes(name)) names.push(name)
    groups.set(category, names)
  }
  const rank = (category: string) => {
    const index = SKILL_ORDER.indexOf(category)
    return index === -1 ? SKILL_ORDER.length : index
  }
  return [...groups.entries()]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([category, names], i) => entry(`skills-${i}`, { title: category, text: names.join(', ') }))
}

function certificationEntries(items: unknown): ResumeEntry[] {
  return records<Certification>(items).flatMap((c, i) => {
    const title = clean(c.name)
    if (!title) return []
    const id = clean(c.credentialId)
    return [entry(`certification-${i}`, {
      title,
      text: join([clean(c.issuer), formatIsoDate(c.date) ?? '', id ? `Credential ID ${id}` : '']) || undefined,
    })]
  })
}

/** Papers marked `resume: false` stay on /research only. */
function publicationEntries(items: unknown): ResumeEntry[] {
  return records<Research>(items).flatMap((r, i) => {
    const title = clean(r.title)
    if (!title || r.resume === false) return []
    const url = clean(r.url)
    const link = toLink('Paper', url.startsWith('/') && !url.startsWith('//') ? absoluteUrl(url) : url)
    return [entry(`publication-${i}`, {
      title,
      subtitle: clean(r.context) || undefined,
      date: formatIsoDate(r.date) ?? undefined,
      links: link ? [link] : [],
    })]
  })
}

function leadershipEntries(items: unknown): ResumeEntry[] {
  return records<Leadership>(items).flatMap((l, i) => {
    const role = clean(l.role)
    const title = role || clean(l.organization)
    if (!title) return []
    return [entry(`leadership-${i}`, {
      title,
      subtitle: (role && clean(l.organization)) || undefined,
      date: formatDateRange(l.startDate, l.endDate, l.current) ?? undefined,
      text: clean(l.description) || undefined,
    })]
  })
}

/** Pure: turns whatever the getters returned into the printable resume. */
export function buildResume(sources: ResumeSources): ResumeData {
  const profile = isRecord(sources.profile) ? (sources.profile as unknown as Profile) : null
  const socials = isRecord(profile?.socials) ? profile.socials : {}
  const links = Object.entries(socials)
    .map(([key, url]) => toLink(LINK_LABELS[key.toLowerCase()] ?? key, url))
    .filter(present)

  const section = (id: ResumeSectionId, layout: ResumeSection['layout'], entries: ResumeEntry[]): ResumeSection =>
    ({ id, heading: RESUME_HEADINGS[id], layout, entries })

  return {
    // Deliberately no email, phone or street address: none is ever published.
    name: clean(profile?.name) || siteName,
    tagline: clean(profile?.tagline),
    location: clean(profile?.location),
    links,
    sections: [
      section('experience', 'entries', experienceEntries(sources.experience)),
      section('education', 'entries', educationEntries(sources.education)),
      section('projects', 'entries', projectEntries(sources.projects)),
      section('publications', 'entries', publicationEntries(sources.research)),
      section('skills', 'inline', skillEntries(profile)),
      section('certifications', 'inline', certificationEntries(sources.certifications)),
      section('leadership', 'entries', leadershipEntries(sources.leadership)),
    ].filter((s) => s.entries.length > 0),
  }
}

/** The resume from the repo content alone: what is shown if nothing else works. */
export function localResumeData(): ResumeData {
  return buildResume({
    profile: localProfile,
    experience: localExperience,
    education: localEducation,
    projects: localProjects,
    certifications: localCertifications,
    leadership: localLeadership,
    research: localResearch,
  })
}

/**
 * The resume from the live content source. Each getter already falls back to
 * the repo content when the API is down or slow; a getter that still throws
 * only empties its own section instead of failing the page or the PDF.
 */
export async function getResumeData(): Promise<ResumeData> {
  const [profile, experience, education, projects, certifications, leadership, research] = await Promise.all([
    api.getProfile().catch(() => localProfile),
    api.getExperience().catch(() => []),
    api.getEducation().catch(() => []),
    api.getProjects().catch(() => []),
    api.getCertifications().catch(() => []),
    api.getLeadership().catch(() => []),
    api.getResearch().catch(() => []),
  ])
  return buildResume({ profile, experience, education, projects, certifications, leadership, research })
}

/** "Pratham-Sachan-Resume.pdf": ASCII only, so it is safe in a header as is. */
export function resumeFilename(name: string): string {
  const slug = clean(name)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return slug ? `${slug}-Resume.pdf` : 'Resume.pdf'
}
