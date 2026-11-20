import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ContactForm from '@/components/sections/ContactForm'
import ContactPage from '@/app/contact/page'

const ADDRESS = 'owner@example.test'

async function failSubmit() {
  vi.mocked(fetch).mockResolvedValue({
    json: () => Promise.resolve({ success: false, message: 'Contact channel is offline.' }),
  } as never)
  render(<ContactForm />)
  const inputs = document.querySelectorAll<HTMLElement>('input, textarea')
  await userEvent.type(inputs[0], 'Alice')
  await userEvent.type(inputs[1], 'a@company.com')
  await userEvent.type(inputs[2], 'Hi')
  await userEvent.type(inputs[3], 'Body')
  await userEvent.click(screen.getByRole('button', { name: /send burst/i }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/offline/i))
}

describe('direct email fallback', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

  it('error state shows a mailto link inside the live region when the address is set', async () => {
    vi.stubEnv('NEXT_PUBLIC_CONTACT_EMAIL', ADDRESS)
    await failSubmit()
    const link = screen.getByRole('link', { name: ADDRESS })
    expect(link.getAttribute('href')).toBe(`mailto:${ADDRESS}`)
    expect(screen.getByRole('status').contains(link)).toBe(true)
  })

  it('renders no link when the address is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_CONTACT_EMAIL', '')
    await failSubmit()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('renders no link when the address is malformed', async () => {
    vi.stubEnv('NEXT_PUBLIC_CONTACT_EMAIL', 'not an address')
    await failSubmit()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('contact page shows the "or email me directly" line only when set', () => {
    vi.stubEnv('NEXT_PUBLIC_CONTACT_EMAIL', ADDRESS)
    const { unmount } = render(<ContactPage />)
    expect(screen.getByRole('link', { name: ADDRESS }).getAttribute('href')).toBe(`mailto:${ADDRESS}`)
    unmount()
    vi.stubEnv('NEXT_PUBLIC_CONTACT_EMAIL', '')
    render(<ContactPage />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.queryByText(/email me directly/i)).toBeNull()
  })
})
