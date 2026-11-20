import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import CertificationsPage, { metadata } from '@/app/certifications/page'
import CertificationsList, { formatCertDate } from '@/components/sections/CertificationsList'
import { api } from '@/lib/api'
import { certifications } from '@/content'
import type { Certification } from '@/lib/types'

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
    for (const c of certifications) {
      expect(screen.getByRole('heading', { level: 2, name: c.name })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('listitem')).toHaveLength(certifications.length)
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

  it('has its own title, description and canonical URL', () => {
    expect(metadata.title).toBe('Certifications')
    expect(metadata.alternates?.canonical).toBe('/certifications')
    expect(metadata.openGraph?.url).toBe('/certifications')
    expect((metadata.description as string).length).toBeGreaterThan(20)
  })
})
