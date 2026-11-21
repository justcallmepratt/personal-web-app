import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import CertificationsPage, { metadata } from '@/app/certifications/page'
import CertificationsList, { formatCertDate } from '@/components/sections/CertificationsList'
import { api } from '@/lib/api'
import EducationList from '@/components/sections/EducationList'
import { certifications, education } from '@/content'
import type { Certification, Education } from '@/lib/types'

afterEach(() => vi.restoreAllMocks())

describe('CertificationsList', () => {
  it('renders an entry that has only a name and an issuer', () => {
    render(<CertificationsList items={[{ id: 1, name: 'Some Cert', issuer: 'Some Issuer' }]} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Some Cert' })).toBeInTheDocument()
    expect(screen.getByText('Some Issuer')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByText(/Credential ID/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Invalid|undefined|null/)).not.toBeInTheDocument()
  })

  it('renders date, credential ID and link when present', () => {
    const full: Certification = {
      id: 2, name: 'Full Cert', issuer: 'Issuer', date: '2023-05-14',
      credentialId: 'ABC-123', url: 'https://example.test/verify/ABC-123',
    }
    render(<CertificationsList items={[full]} />)
    expect(screen.getByText('May 2023')).toBeInTheDocument()
    expect(screen.getByText('Credential ID: ABC-123')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'VIEW CREDENTIAL: Full Cert (opens in a new tab)' })
    expect(link).toHaveAttribute('href', 'https://example.test/verify/ABC-123')
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })

  it('does not render a link for a non-http URL', () => {
    render(<CertificationsList items={[{ id: 3, name: 'X', issuer: 'Y', url: 'javascript:alert(1)' }]} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})

describe('CertificationsList heading level', () => {
  it('uses h3 when asked to, for a list under a section heading', () => {
    render(<CertificationsList items={[{ id: 1, name: 'Some Cert', issuer: 'Some Issuer' }]} headingLevel={3} />)
    expect(screen.getByRole('heading', { level: 3, name: 'Some Cert' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })
})

describe('EducationList', () => {
  it('renders an entry that has only a degree and an institution', () => {
    render(<EducationList items={[{ id: 1, degree: 'B.S. in Testing', institution: 'Test University' }]} />)
    expect(screen.getByRole('heading', { level: 3, name: 'B.S. in Testing' })).toBeInTheDocument()
    expect(screen.getByText('Test University')).toBeInTheDocument()
    // The card's label stands in for the missing year.
    expect(screen.getByText('Degree')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByText(/Minor|Honours|Invalid|undefined|null/)).not.toBeInTheDocument()
  })

  it('renders school, minor, year, honours, link and image when present', () => {
    const full: Education = {
      id: 2, degree: 'M.S. in Testing', institution: 'Test University', school: 'College of Tests',
      minor: 'Assertions', year: '2024-05', honours: 'cum laude',
      url: 'https://example.test/programme', imageUrl: '/diplomas/ms.jpg',
    }
    render(<EducationList items={[full]} />)
    expect(screen.getByText('May 2024')).toBeInTheDocument()
    expect(screen.getByText('College of Tests')).toBeInTheDocument()
    expect(screen.getByText('Minor: Assertions')).toBeInTheDocument()
    expect(screen.getByText('Honours: cum laude')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'VIEW DETAILS: M.S. in Testing (opens in a new tab)' })
    expect(link).toHaveAttribute('href', 'https://example.test/programme')
    expect(link).toHaveAttribute('rel', 'noreferrer')
    const image = screen.getByRole('img', { name: 'Diploma: M.S. in Testing, Test University' })
    expect(image).toHaveAttribute('src', '/diplomas/ms.jpg')
    expect(image).toHaveAttribute('loading', 'lazy')
  })

  it('shows a year-only date as written and ignores an unreadable one', () => {
    render(
      <EducationList
        items={[
          { id: 1, degree: 'A', institution: 'X', year: '2024' },
          { id: 2, degree: 'B', institution: 'Y', year: 'soon' },
        ]}
      />,
    )
    expect(screen.getByText('2024')).toBeInTheDocument()
    expect(screen.queryByText('soon')).not.toBeInTheDocument()
    expect(screen.getByText('Degree')).toBeInTheDocument()
  })

  it('does not render a link or image for an unsafe address', () => {
    render(
      <EducationList
        items={[{
          id: 3, degree: 'X', institution: 'Y',
          url: 'javascript:alert(1)', imageUrl: '//evil.example.test/x.png',
        }]}
      />,
    )
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

describe('formatCertDate', () => {
  it.each([
    ['2023', '2023'],
    ['2023-05', 'May 2023'],
    ['2023-05-14', 'May 2023'],
    ['2023-01-01', 'Jan 2023'],
  ])('formats %s as %s', (input, expected) => {
    expect(formatCertDate(input)).toBe(expected)
  })

  it.each([undefined, '', 'soon', '2023-13', '05/2023'])('returns null for %j', (input) => {
    expect(formatCertDate(input)).toBeNull()
  })
})

describe('/certifications page', () => {
  it('lists every certification from the content file under one h1', async () => {
    render(await CertificationsPage())
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const section = within(screen.getByRole('region', { name: 'Certifications' }))
    for (const c of certifications) {
      expect(section.getByRole('heading', { level: 3, name: c.name })).toBeInTheDocument()
    }
    expect(section.getAllByRole('listitem')).toHaveLength(certifications.length)
  })

  it('shows the degrees from the content file in an Education section below', async () => {
    render(await CertificationsPage())
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Certifications', 'Education'])
    const section = within(screen.getByRole('region', { name: 'Education' }))
    for (const e of education) {
      expect(section.getByRole('heading', { level: 3, name: e.degree })).toBeInTheDocument()
      expect(section.getByText(e.institution)).toBeInTheDocument()
    }
    expect(section.getAllByRole('listitem')).toHaveLength(education.length)
    // No images are published yet.
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('shows an empty state when there is nothing to list or the getter fails', async () => {
    vi.spyOn(api, 'getCertifications').mockResolvedValueOnce([])
    const { unmount } = render(await CertificationsPage())
    expect(screen.getByText(/No certifications loaded/)).toBeInTheDocument()
    unmount()

    vi.spyOn(api, 'getCertifications').mockRejectedValueOnce(new Error('boom'))
    render(await CertificationsPage())
    expect(screen.getByText(/No certifications loaded/)).toBeInTheDocument()
  })

  it('leaves the Education section out when there are no degrees or the getter fails', async () => {
    vi.spyOn(api, 'getEducation').mockResolvedValueOnce([])
    const { unmount } = render(await CertificationsPage())
    expect(screen.queryByRole('heading', { name: 'Education' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Certifications' })).toBeInTheDocument()
    unmount()

    vi.spyOn(api, 'getEducation').mockRejectedValueOnce(new Error('boom'))
    render(await CertificationsPage())
    expect(screen.queryByRole('heading', { name: 'Education' })).not.toBeInTheDocument()
  })

  it('has its own title, description and canonical URL', () => {
    expect(metadata.title).toBe('Certifications')
    expect(metadata.alternates?.canonical).toBe('/certifications')
    expect(metadata.openGraph?.url).toBe('/certifications')
    expect((metadata.description as string).length).toBeGreaterThan(20)
  })
})
