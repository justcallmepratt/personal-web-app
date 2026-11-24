import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Inbox from '@/components/Inbox'
import { jsonResponse, message, mockFetch, timedOut, unreachable } from '../helpers'

const assign = vi.fn()
beforeEach(() => {
  assign.mockReset()
  vi.stubGlobal('location', { ...window.location, assign })
})

const two = [
  message({ id: 2, subject: 'Job offer', name: 'Grace', read: false }),
  message({ id: 1, subject: 'Old news', name: 'Linus', read: true, body: 'Read already' }),
]

describe('Inbox', () => {
  it('lists messages with the unread count', () => {
    render(<Inbox initialMessages={two} />)
    expect(screen.getByText('1 unread · 2 total')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /job offer/i })).toHaveTextContent('Unread')
    expect(screen.getByRole('button', { name: /old news/i })).not.toHaveTextContent('Unread')
    expect(screen.getByText('Select a message to read it.')).toBeInTheDocument()
  })

  it('shows an empty state for an empty inbox', () => {
    render(<Inbox initialMessages={[]} />)
    expect(screen.getByText('No messages yet.')).toBeInTheDocument()
    expect(screen.getByText('0 unread · 0 total')).toBeInTheDocument()
  })

  it('shows the message detail when one is selected', async () => {
    render(<Inbox initialMessages={two} />)
    await userEvent.click(screen.getByRole('button', { name: /job offer/i }))

    const detail = screen.getByRole('article')
    expect(within(detail).getByRole('heading', { name: 'Job offer' })).toBeInTheDocument()
    expect(within(detail).getByText(/First line/)).toBeInTheDocument()
    expect(within(detail).getByRole('link', { name: 'ada@example.com' })).toHaveAttribute(
      'href',
      'mailto:ada@example.com',
    )
    expect(within(detail).getByText(/2026-11-20 10:15/)).toBeInTheDocument()
  })

  it('renders message text as text, not markup', async () => {
    render(<Inbox initialMessages={[message({ body: '<img src=x onerror=alert(1)>' })]} />)
    await userEvent.click(screen.getByRole('button', { name: /hello/i }))
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(document.querySelector('img')).toBeNull()
  })

  it('marks a message read and back to unread through this app', async () => {
    const fetchMock = mockFetch((url) =>
      jsonResponse(message({ id: 2, subject: 'Job offer', read: String(url).endsWith('read=true') })))
    render(<Inbox initialMessages={two} />)
    await userEvent.click(screen.getByRole('button', { name: /job offer/i }))

    await userEvent.click(screen.getByRole('button', { name: 'Mark as read' }))
    expect(await screen.findByText('0 unread · 2 total')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/admin/api/messages/2/read?read=true',
      expect.objectContaining({ method: 'PATCH', signal: expect.any(AbortSignal) }),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Mark as unread' }))
    expect(await screen.findByText('1 unread · 2 total')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith('/admin/api/messages/2/read?read=false', expect.anything())
  })

  it('removes a message the API no longer has and says so', async () => {
    mockFetch(() => jsonResponse({ error: 'That message no longer exists.', kind: 'not_found' }, 404))
    render(<Inbox initialMessages={two} />)
    await userEvent.click(screen.getByRole('button', { name: /job offer/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Mark as read' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('That message no longer exists.')
    expect(screen.queryByRole('button', { name: /job offer/i })).not.toBeInTheDocument()
    expect(screen.getByText('0 unread · 1 total')).toBeInTheDocument()
  })

  it('sends the browser to the login page when the session expires mid-session', async () => {
    mockFetch(() => jsonResponse({ error: 'expired', kind: 'unauthorized' }, 401))
    render(<Inbox initialMessages={two} />)
    await userEvent.click(screen.getByRole('button', { name: /job offer/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Mark as read' }))

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/admin/login?reason=expired'))
  })

  it('also handles an expired session on refresh', async () => {
    mockFetch(() => jsonResponse({ error: 'expired', kind: 'unauthorized' }, 401))
    render(<Inbox initialMessages={two} />)
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    await waitFor(() => expect(assign).toHaveBeenCalledWith('/admin/login?reason=expired'))
  })

  it('keeps the list and shows the reason when a toggle fails', async () => {
    mockFetch(() => jsonResponse({ error: 'The API took too long to answer.', kind: 'timeout' }, 504))
    render(<Inbox initialMessages={two} />)
    await userEvent.click(screen.getByRole('button', { name: /job offer/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Mark as read' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The API took too long to answer.')
    expect(screen.getByText('1 unread · 2 total')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark as read' })).toBeEnabled()
  })

  it('reports a network failure on toggle', async () => {
    mockFetch(unreachable)
    render(<Inbox initialMessages={two} />)
    await userEvent.click(screen.getByRole('button', { name: /job offer/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Mark as read' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach the admin app/i)
  })

  it('shows a server load error and recovers on refresh', async () => {
    mockFetch(() => jsonResponse(two))
    render(<Inbox initialMessages={[]} loadError="The API could not be reached. It may be down or restarting." />)

    expect(screen.getByRole('alert')).toHaveTextContent('The API could not be reached.')
    expect(screen.getByText('Messages could not be loaded.')).toBeInTheDocument()
    expect(screen.getByText('Not loaded')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    expect(await screen.findByText('1 unread · 2 total')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows the reason when refresh fails, including an unreadable error body', async () => {
    mockFetch(() => new Response('<html>', { status: 502 }))
    render(<Inbox initialMessages={two} />)
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Request failed (HTTP 502).')
    expect(screen.getByText('1 unread · 2 total')).toBeInTheDocument()
  })

  it('says so when a request to this app times out', async () => {
    const fetchMock = mockFetch(timedOut)
    render(<Inbox initialMessages={two} />)
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/took too long/i)
    expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled()
  })

  it('signs out through this app and leaves, even if the request fails', async () => {
    const fetchMock = mockFetch(unreachable)
    render(<Inbox initialMessages={two} />)
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/admin/login'))
    expect(fetchMock).toHaveBeenCalledWith(
      '/admin/api/session',
      expect.objectContaining({ method: 'DELETE', signal: expect.any(AbortSignal) }),
    )
  })

  it('labels messages with missing fields', async () => {
    render(<Inbox initialMessages={[message({ name: null, email: null, subject: null, body: null, sentAt: null })]} />)
    await userEvent.click(screen.getByRole('button', { name: /no subject/i }))
    expect(screen.getAllByText(/unknown sender/i).length).toBeGreaterThan(0)
    expect(screen.getByText('(empty message)')).toBeInTheDocument()
    expect(screen.getAllByText(/unknown date/i).length).toBeGreaterThan(0)
  })
})
