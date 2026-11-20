import type { Profile, Project, Experience, ContactPayload, ApiResponse } from './types'
import { profile, projects, experience } from '@/content'

// ── Content source ───────────────────────────────────────────────────────────
//
//  Default: the typed files in src/content. Pages are fully static and the
//  site has no runtime dependency on a backend or database.
//
//  Optional: set BACKEND_URL (server-only) to read from an HTTP API exposing
//  /api/profile, /api/projects and /api/experience — e.g. the Spring Boot
//  service in /backend. This is the one seam to change if the data moves.
//
//  The contact form always posts to this app's own /api/contact route handler.
// ────────────────────────────────────────────────────────────────────────────
async function load<T>(path: string, local: () => T): Promise<T> {
  const base = process.env.BACKEND_URL
  if (!base) return local()
  const res = await fetch(`${base}${path}`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

const bySortOrder = <T extends { sortOrder: number }>(items: T[]) =>
  [...items].sort((a, b) => a.sortOrder - b.sortOrder)

export const api = {
  getProfile:    ()               => load<Profile>('/api/profile', () => profile),
  getProjects:   (featured?: boolean) =>
    load<Project[]>(`/api/projects${featured ? '?featured=true' : ''}`, () =>
      bySortOrder(featured ? projects.filter((p) => p.featured) : projects)),
  getExperience: ()               => load<Experience[]>('/api/experience', () => bySortOrder(experience)),

  sendContact: (body: ContactPayload): Promise<ApiResponse> =>
    fetch('/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    }).then((r) => r.json()),
}
