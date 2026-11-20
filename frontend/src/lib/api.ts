import type {
  Profile, Project, Experience, Certification, PlannedProject, ContactPayload, ApiResponse, KafkaMessagesResponse,
} from './types'
import { profile, projects, experience, certifications, plannedProjects } from '@/content'

// ── Content source ───────────────────────────────────────────────────────────
//
//  With BACKEND_URL set (server-only): the Spring Boot API in /backend, which
//  exposes /api/profile, /api/projects and /api/experience. Pages are static
//  and re-rendered at most once per REVALIDATE_SECONDS, so the API (and a
//  Vercel function) is hit about hourly per page rather than per visitor.
//
//  Without it, or whenever the API is unreachable or errors: the typed files
//  in src/content, so the site always renders. Keep those files a reasonable
//  snapshot of the real content.
//
//  The contact form posts to this app's own /api/contact route handler, which
//  relays to the API. This is the one seam to change if the data moves.
// ────────────────────────────────────────────────────────────────────────────
const REVALIDATE_SECONDS = 3600
// A cold or hung backend must not hold a render open; fall back instead.
const API_TIMEOUT_MS = 5000

async function load<T>(path: string, local: () => T): Promise<T> {
  const base = process.env.BACKEND_URL
  if (!base) return local()
  try {
    const res = await fetch(`${base}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    })
    if (!res.ok) throw new Error(`API ${path} → ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    console.warn(`Content API unavailable, serving repo content instead. ${e}`)
    return local()
  }
}

const bySortOrder = <T extends { sortOrder?: number }>(items: T[]) =>
  [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

export const api = {
  getProfile:    ()               => load<Profile>('/api/profile', () => profile),
  getProjects:   (featured?: boolean) =>
    load<Project[]>(`/api/projects${featured ? '?featured=true' : ''}`, () =>
      bySortOrder(featured ? projects.filter((p) => p.featured) : projects)),
  getExperience: ()               => load<Experience[]>('/api/experience', () => bySortOrder(experience)),
  // The Spring API has no certifications endpoint yet, so this always reads the
  // repo content. When one exists, wrap it in load() like the getters above.
  getCertifications: (): Promise<Certification[]> => Promise.resolve(bySortOrder(certifications)),
  // Ideas with no code yet. Repo content only, like certifications, and kept
  // apart from getProjects() so they can never show up as shipped or featured.
  getPlannedProjects: (): Promise<PlannedProject[]> => Promise.resolve([...plannedProjects]),

  sendContact: (body: ContactPayload): Promise<ApiResponse> =>
    fetch('/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    }).then((r) => r.json()),

  // Live Kafka demo, relayed by this app's /api/kafka routes (see lib/kafka.ts).
  kafkaProduce: (body: { sid: string; key: string; message: string }): Promise<ApiResponse> =>
    fetch('/api/kafka/produce', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    }).then((r) => r.json()),

  kafkaMessages: (sid: string): Promise<KafkaMessagesResponse> =>
    fetch(`/api/kafka/messages?sid=${sid}`, { cache: 'no-store' }).then((r) => r.json()),
}
