export interface Skill {
  name: string
  category: 'Frontend' | 'Backend' | 'DevOps' | 'Other'
  level: number
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
