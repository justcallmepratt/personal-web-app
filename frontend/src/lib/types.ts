export interface Skill {
  name: string
  category: 'Frontend' | 'Backend' | 'DevOps' | 'Other'
  /** 0–100 rating. Optional: the repo content lists skills without one. */
  level?: number
}

export interface Profile {
  id: number
  name: string
  tagline: string
  bio: string
  email: string
  location: string
  avatarUrl: string
  cvUrl: string
  techStack: string[]
  socials: Record<string, string>
  skills: Skill[]
  updatedAt: string
}

export interface Project {
  id: number
  title: string
  description: string
  longDescription: string
  tags: string[]
  stack: string[]
  demoUrl: string
  repoUrl: string
  imageUrl: string
  featured: boolean
  sortOrder: number
  createdAt: string
}

export interface Experience {
  id: number
  company: string
  role: string
  location: string
  startDate: string
  endDate: string | null
  current: boolean
  description: string
  highlights: string[]
  technologies: string[]
  sortOrder: number
}

/** A certification or course certificate. Repo content only: the API has no endpoint for it yet. */
export interface Certification {
  id: number
  name: string
  issuer: string
  /** ISO date, as precise as is known: '2023', '2023-05' or '2023-05-14'. */
  date?: string
  credentialId?: string
  /** Link to the credential or its verification page. */
  url?: string
  sortOrder?: number
}

/**
 * An idea with no code yet. Deliberately not a Project: it has no links, dates
 * or `featured` flag, and the Spring API never returns it.
 */
export interface PlannedProject {
  id: number
  name: string
  /** One line on what it is meant to do. */
  goal: string
}

export interface ContactPayload {
  name: string
  email: string
  subject: string
  body: string
}

export interface ApiResponse {
  success: boolean
  message: string
}

/** A record the Kafka demo's consumer has read from the topic and stored. */
export interface KafkaRecord {
  id: string
  key: string
  content: string
  /** When the consumer stored it: ISO local date-time in the service's zone (UTC). */
  timestamp: string
  topic: string
}

export interface KafkaMessagesResponse extends ApiResponse {
  records: KafkaRecord[]
}
