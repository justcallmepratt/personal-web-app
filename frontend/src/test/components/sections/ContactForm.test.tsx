import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ContactForm from '@/components/sections/ContactForm'

describe('ContactForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders all form fields', () => {
    render(<ContactForm />)
    expect(screen.getByText(/handle/i)).toBeInTheDocument()
    expect(screen.getByText(/net address/i)).toBeInTheDocument()
    expect(screen.getByText(/subject/i)).toBeInTheDocument()
    expect(screen.getByText(/payload/i)).toBeInTheDocument()
  })

  it('submit with empty fields does not call fetch', async () => {
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    render(<ContactForm />)
    // HTML5 required prevents submission without values; fetch should not be called
    const submitBtn = screen.getByRole('button', { name: /send burst/i })
    await userEvent.click(submitBtn)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('successful submission shows success message', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, message: 'Message received.' }),
    })
    vi.stubGlobal('fetch', mockFetch)
    render(<ContactForm />)

    // Use querySelectorAll to select inputs in DOM order (handle, email, subject)
    // and the textarea (payload)
    const inputs = document.querySelectorAll<HTMLElement>('input, textarea')
    await userEvent.type(inputs[0], 'Alice')
    await userEvent.type(inputs[1], 'alice@example.com')
    await userEvent.type(inputs[2], 'Hello')
    await userEvent.type(inputs[3], 'World message body here')

    await userEvent.click(screen.getByRole('button', { name: /send burst/i }))

    await waitFor(() => {
      expect(screen.queryByText(/message received/i)).toBeTruthy()
    })
  })

  it('has an empty polite live region before anything is sent, and labelled fields', () => {
    render(<ContactForm />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toBeEmptyDOMElement()
    expect(screen.getByLabelText(/handle/i)).toBeRequired()
    expect(screen.getByLabelText(/net address/i)).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText(/subject/i)).toBeRequired()
    expect(screen.getByLabelText(/payload/i)).toBeRequired()
  })

  it('announces the result of a submission in the live region', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: false, message: 'Channel offline.' }),
    }))
    render(<ContactForm />)
    await userEvent.type(screen.getByLabelText(/handle/i), 'Cara')
    await userEvent.type(screen.getByLabelText(/net address/i), 'cara@example.com')
    await userEvent.type(screen.getByLabelText(/subject/i), 'Hi')
    await userEvent.type(screen.getByLabelText(/payload/i), 'A message body')
    await userEvent.click(screen.getByRole('button', { name: /send burst/i }))

    await waitFor(() => {
      // The same element that existed before the submit now holds the message.
      expect(screen.getByRole('status')).toHaveTextContent('Error: Channel offline.')
    })
  })

  it('failed submission shows error message', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: false, message: 'Send failed.' }),
    })
    vi.stubGlobal('fetch', mockFetch)
    render(<ContactForm />)

    const inputs = document.querySelectorAll<HTMLElement>('input, textarea')
    await userEvent.type(inputs[0], 'Bob')
    await userEvent.type(inputs[1], 'bob@example.com')
    await userEvent.type(inputs[2], 'Test')
    await userEvent.type(inputs[3], 'Test body content here')

    await userEvent.click(screen.getByRole('button', { name: /send burst/i }))

    await waitFor(() => {
      expect(screen.queryByText(/send failed/i)).toBeTruthy()
    })
  })
})
