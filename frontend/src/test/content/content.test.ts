import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { profile, projects, experience, certifications, education, leadership } from '@/content'

// Guards on the published content: the site is public, so the placeholder
// persona, made-up links and private contact details must not come back.

const everything = JSON.stringify({ profile, projects, experience, certifications, education, leadership })

describe('site content', () => {
  it('is the real profile, not the placeholder persona', () => {
    expect(profile.name).toBe('Pratham Sachan')
    expect(profile.location).toBe('Tampa, FL')
    expect(everything).not.toMatch(/night.?city|arasaka|militech|kang tao|netwatch|trauma team|braindance|quickhack/i)
  })

  it('has no placeholder or fake links', () => {
    expect(everything).not.toMatch(/example\.com|yourhandle|github\.com\/you\//i)
  })

  it('publishes no phone number or email address', () => {
    expect(profile.email).toBe('')
    expect(everything).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i)
    // US-style phone numbers; ISO dates such as 2024-07-01 must not trip it.
    expect(everything).not.toMatch(/\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/)
  })

  it('shows LinkedIn as the only social link', () => {
    expect(profile.socials).toEqual({ linkedin: 'https://linkedin.com/in/prathamsachan' })
  })

  it('links projects only to the owner\'s GitHub or to pages of this site', () => {
    for (const p of projects) {
      if (p.repoUrl) expect(p.repoUrl).toMatch(/^https:\/\/github\.com\/justcallmepratt\//)
      if (p.demoUrl) expect(p.demoUrl).toMatch(/^\//)
    }
  })

  it('rates no skill with a percentage', () => {
    expect(profile.skills.length).toBeGreaterThan(0)
    expect(profile.skills.every((s) => s.level === undefined)).toBe(true)
  })

  it('keeps no hand-made CV: the PDF is generated at /resume.pdf', () => {
    expect(profile.cvUrl).toBe('')
    expect(existsSync(join(process.cwd(), 'public', 'cv.pdf'))).toBe(false)
    expect(existsSync(join(process.cwd(), 'public', 'resume.pdf'))).toBe(false)
  })

  it('lists the degree without a graduation date, honours, link or image until the owner confirms them', () => {
    expect(education).toEqual([
      {
        id: 1,
        degree: 'B.S. in Computer Science',
        minor: 'Business Management',
        institution: 'University of Massachusetts Amherst',
        school: 'College of Information and Computer Sciences',
        sortOrder: 1,
      },
    ])
  })

  it('lists only the two known leadership roles, with no invented end date or description', () => {
    expect(leadership).toEqual([
      { id: 1, role: 'Co-founder and Vice President', organization: 'UMass F1 Club', startDate: '2023-01', sortOrder: 1 },
      { id: 2, role: 'Team Lead', organization: 'Robotics team', startDate: '2018-01', endDate: '2020-05', sortOrder: 2 },
    ])
  })

  it('marks exactly one role as current and leaves the unconfirmed internship end date empty', () => {
    expect(experience.filter((e) => e.current)).toHaveLength(1)
    const intern = experience.find((e) => e.role === 'Software Engineering Intern')
    expect(intern).toMatchObject({ current: false, endDate: null })
  })

  it('lists certifications with a name and issuer and no invented details', () => {
    expect(certifications.map((c) => c.name)).toEqual([
      'Microsoft Technology Associate',
      'Java Programming Masterclass',
      'TensorFlow',
    ])
    for (const c of certifications) {
      expect(c.issuer).toBeTruthy()
      expect(c.date).toBeUndefined()
      expect(c.credentialId).toBeUndefined()
      expect(c.url).toBeUndefined()
    }
  })
})
