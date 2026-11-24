export interface Skill {
  name: string
  category: 'Frontend' | 'Backend' | 'DevOps' | 'Business & Leadership' | 'Other'
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

/** A degree or diploma. Repo content only: the API has no endpoint for it yet. */
export interface Education {
  id: number
  /** The qualification as it should be read, e.g. "B.S. in Computer Science". */
  degree: string
  institution: string
  /** College or school within the institution. */
  school?: string
  minor?: string
  /** Graduation date, ISO, as precise as is known: '2024' or '2024-05'. Leave out until confirmed. */
  year?: string
  honours?: string
  /** Link to the programme or a verification page. */
  url?: string
  /** Picture of the diploma: a path under public/ or an https URL. None are published yet. */
  imageUrl?: string
  sortOrder?: number
}

/** A leadership or volunteer role. Repo content only: the API has no endpoint for it yet. */
export interface Leadership {
  id: number
  role: string
  organization: string
  /** ISO dates, as precise as is known: '2023' or '2023-01'. */
  startDate?: string
  endDate?: string
  /** True only when the owner has confirmed the role is ongoing. */
  current?: boolean
  description?: string
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

/** A research paper or substantial write-up by the owner. Repo content only: the API has no endpoint for it. */
export interface Research {
  id: number
  title: string
  /** Course, school or setting it was written for, when known. */
  context?: string
  /** ISO date, as precise as is known: '2020' or '2020-05'. */
  date?: string
  /** One or two plain sentences on the question and the finding. */
  summary: string
  /** Named co-authors only; leave out when unknown. */
  coAuthors?: string[]
  /** Public link to the paper, when there is one. */
  url?: string
  /** `false` keeps the paper off the resume; it is still listed on /research. */
  resume?: boolean
  sortOrder: number
}
