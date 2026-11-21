import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Suggestions from '@/components/Suggestions'
import type { Suggestion } from '@/lib/types'
import { jsonResponse, mockFetch, suggestion, targets, timedOut, unreachable } from '../helpers'

const assign = vi.fn()
beforeEach(() => {
  assign.mockReset()
  vi.stubGlobal('location', { ...window.location, assign })
})

const pendingRole = suggestion({ id: 2 })
const pendingList = suggestion({
  id: 3,
  targetType: 'profile',
  targetId: 1,
  targetLabel: 'Profile',
  field: 'techStack',
  fieldKind: 'list',
  currentValue: ['Java', 'Postgres'],
  proposedValue: ['Java', 'Kafka'],
  reason: 'Seen in most listings',
  source: 'market-research',
})
const decidedOne = suggestion({ id: 1, status: 'rejected', decidedAt: '2026-11-20T09:00:00', proposedValue: 'Staff Engineer' })
const all = [pendingList, pendingRole, decidedOne]

const renderPage = (list: Suggestion[] = all) =>
  render(<Suggestions initialSuggestions={list} initialTargets={targets()} />)

const card = (name: RegExp) => screen.getByRole('article', { name })

/** Answers the two reload requests, and whatever `decision` returns for a POST. */
function mockApi(options: {
  list?: Suggestion[]
  decision?: () => Response
  create?: () => Response
}) {
  return mockFetch((url, init) => {
    if (init?.method === 'POST') {
      if (url === '/admin/api/suggestions') return options.create!()
      return options.decision!()
    }
    if (url === '/admin/api/suggestions/targets') return jsonResponse(targets())
    return jsonResponse(options.list ?? all)
  })
}

describe('Suggestions: pending list', () => {
  it('shows each pending suggestion with before, after, reason and source', () => {
    renderPage()
    expect(screen.getByText('2 pending · 1 decided')).toBeInTheDocument()

    const role = card(/experience · engineer at acme · role/i)
    expect(within(within(role).getByRole('region', { name: 'Before' })).getByText('Engineer')).toBeInTheDocument()
    expect(within(within(role).getByRole('region', { name: 'After' })).getByText('Senior Engineer')).toBeInTheDocument()
    expect(within(role).getByText('Promoted in 2025')).toBeInTheDocument()
    expect(within(role).getByText('manual')).toBeInTheDocument()
    expect(within(role).getByText('2026-11-21 10:15')).toBeInTheDocument()
    expect(within(role).getByRole('button', { name: 'Accept' })).toBeEnabled()
    expect(within(role).getByRole('button', { name: 'Reject' })).toBeEnabled()

    // The decided one is not in this view.
    expect(screen.queryByText('Staff Engineer')).not.toBeInTheDocument()
  })

  it('marks what a list suggestion removes and adds', () => {
    renderPage()
    const stack = card(/profile · tech stack/i)
    const before = within(stack).getByRole('region', { name: 'Before' })
    const after = within(stack).getByRole('region', { name: 'After' })

    expect(within(before).getByText('Postgres').closest('li')).toHaveTextContent('removed')
    expect(within(before).getByText('Java').closest('li')).not.toHaveTextContent('removed')
    expect(within(after).getByText('Kafka').closest('li')).toHaveTextContent('added')
    expect(within(after).getByText('Java').closest('li')).not.toHaveTextContent('added')
    expect(within(stack).getByText('market-research')).toBeInTheDocument()
  })

  it('shows the empty state when nothing is pending', () => {
    renderPage([decidedOne])
    expect(screen.getByText('No pending suggestions.')).toBeInTheDocument()
    expect(screen.getByText('0 pending · 1 decided')).toBeInTheDocument()
  })

  it('shows the empty state when there are no suggestions at all, in both views', async () => {
    renderPage([])
    expect(screen.getByText('No pending suggestions.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'History (0)' }))
    expect(screen.getByText('No decisions yet.')).toBeInTheDocument()
  })

  it('labels empty values, a deleted target and missing details', () => {
    renderPage([
      suggestion({
        id: 4,
        targetLabel: null,
        field: 'description',
        currentValue: null,
        proposedValue: '',
        reason: null,
        source: null,
        createdAt: null,
      }),
      suggestion({ id: 5, field: 'highlights', fieldKind: 'list', currentValue: [], proposedValue: ['One'] }),
    ])
    const gone = card(/experience #7 \(no longer exists\) · description/i)
    expect(within(gone).getAllByText('(empty)')).toHaveLength(2)
    expect(within(gone).getByText('(none given)')).toBeInTheDocument()
    expect(within(gone).getByText('unknown')).toBeInTheDocument()
    expect(within(gone).getByText('Unknown date')).toBeInTheDocument()
    expect(within(card(/highlights/i)).getByText('(empty list)')).toBeInTheDocument()
  })

  it('renders suggested text as text, not markup', () => {
    renderPage([suggestion({ proposedValue: '<img src=x onerror=alert(1)>' })])
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(document.querySelector('img')).toBeNull()
  })

  it('links back to the inbox', () => {
    renderPage()
    expect(screen.getByRole('link', { name: 'Inbox' })).toHaveAttribute('href', '/admin')
  })
})

describe('Suggestions: accept and reject', () => {
  it('asks for confirmation before accepting, and cancelling sends nothing', async () => {
    const fetchMock = mockApi({})
    renderPage()
    const role = card(/acme · role/i)

    await userEvent.click(within(role).getByRole('button', { name: 'Accept' }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(within(role).getByText(/replaces the “before” value/i)).toBeInTheDocument()

    await userEvent.click(within(role).getByRole('button', { name: 'Cancel' }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(within(role).getByRole('button', { name: 'Accept' })).toBeEnabled()
  })

  it('accepts after confirmation, then reloads so superseded suggestions and live values are current', async () => {
    const accepted = { ...pendingRole, status: 'accepted' as const, decidedAt: '2026-11-21T12:00:00' }
    const fetchMock = mockApi({ decision: () => jsonResponse(accepted), list: [pendingList, accepted, decidedOne] })
    renderPage()
    const role = card(/acme · role/i)

    await userEvent.click(within(role).getByRole('button', { name: 'Accept' }))
    await userEvent.click(within(role).getByRole('button', { name: 'Yes, apply it' }))

    expect(await screen.findByText('1 pending · 2 decided')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/accepted.*within the hour/i)
    expect(fetchMock).toHaveBeenCalledWith(
      '/admin/api/suggestions/2/accept',
      expect.objectContaining({ method: 'POST', signal: expect.any(AbortSignal) }),
    )
    expect(fetchMock).toHaveBeenCalledWith('/admin/api/suggestions', expect.objectContaining({ cache: 'no-store' }))
    expect(fetchMock).toHaveBeenCalledWith('/admin/api/suggestions/targets', expect.anything())
    expect(screen.queryByRole('article', { name: /acme · role/i })).not.toBeInTheDocument()
  })

  it('shows the conflict on the suggestion, with the value on the site now, and applies nothing', async () => {
    mockApi({
      decision: () =>
        jsonResponse(
          { kind: 'conflict', error: "'role' has changed since this suggestion was made, so it was not applied.", currentValue: 'Lead Engineer' },
          409,
        ),
    })
    renderPage()
    const role = card(/acme · role/i)

    await userEvent.click(within(role).getByRole('button', { name: 'Accept' }))
    await userEvent.click(within(role).getByRole('button', { name: 'Yes, apply it' }))

    expect(await within(role).findByRole('alert')).toHaveTextContent(/has changed since this suggestion was made/i)
    expect(within(within(role).getByRole('region', { name: 'Current value' })).getByText('Lead Engineer')).toBeInTheDocument()
    // Still pending, cannot be accepted again as it stands, can be rejected.
    expect(screen.getByText('2 pending · 1 decided')).toBeInTheDocument()
    expect(within(role).getByRole('button', { name: 'Accept' })).toBeDisabled()
    expect(within(role).getByRole('button', { name: 'Reject' })).toBeEnabled()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows a conflict where the field is now a list or empty', async () => {
    mockApi({ decision: () => jsonResponse({ kind: 'conflict', error: 'Changed.', currentValue: ['Java', 'Go'] }, 409) })
    renderPage()
    const stack = card(/tech stack/i)
    await userEvent.click(within(stack).getByRole('button', { name: 'Accept' }))
    await userEvent.click(within(stack).getByRole('button', { name: 'Yes, apply it' }))
    expect(await within(within(stack).getByRole('region', { name: 'Current value' })).findByText('Go')).toBeInTheDocument()

    // No currentValue in the reply at all: shown as empty.
    mockApi({ decision: () => jsonResponse({ kind: 'conflict', error: 'Changed.' }, 409) })
    const role = card(/acme · role/i)
    await userEvent.click(within(role).getByRole('button', { name: 'Accept' }))
    await userEvent.click(within(role).getByRole('button', { name: 'Yes, apply it' }))
    expect(await within(within(role).getByRole('region', { name: 'Current value' })).findByText('(empty)')).toBeInTheDocument()
  })

  it('a rejected conflict is cleared, and a refresh clears conflicts too', async () => {
    let conflict = true
    mockApi({
      decision: () =>
        conflict
          ? jsonResponse({ kind: 'conflict', error: 'Changed.', currentValue: 'Lead Engineer' }, 409)
          : jsonResponse({ ...pendingRole, status: 'rejected', decidedAt: '2026-11-21T12:00:00' }),
    })
    renderPage()
    const role = card(/acme · role/i)
    await userEvent.click(within(role).getByRole('button', { name: 'Accept' }))
    await userEvent.click(within(role).getByRole('button', { name: 'Yes, apply it' }))
    await within(role).findByRole('alert')

    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    await waitFor(() => expect(within(card(/acme · role/i)).queryByRole('alert')).not.toBeInTheDocument())
    expect(within(card(/acme · role/i)).getByRole('button', { name: 'Accept' })).toBeEnabled()

    conflict = false
    await userEvent.click(within(card(/acme · role/i)).getByRole('button', { name: 'Reject' }))
    expect(await screen.findByText('1 pending · 2 decided')).toBeInTheDocument()
  })

  it('rejects without a confirmation and says nothing was changed', async () => {
    const fetchMock = mockApi({
      decision: () => jsonResponse({ ...pendingRole, status: 'rejected', decidedAt: '2026-11-21T12:00:00' }),
    })
    renderPage()

    await userEvent.click(within(card(/acme · role/i)).getByRole('button', { name: 'Reject' }))

    expect(await screen.findByText('1 pending · 2 decided')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/rejected.*nothing on the site was changed/i)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/admin/api/suggestions/2/reject', expect.objectContaining({ method: 'POST' }))
  })

  it('brings the list up to date when the suggestion was already decided or is gone', async () => {
    const elsewhere = { ...pendingRole, status: 'superseded' as const, decidedAt: '2026-11-21T12:00:00' }
    mockApi({
      decision: () => jsonResponse({ kind: 'refused', error: 'This suggestion was already superseded.' }, 409),
      list: [pendingList, elsewhere, decidedOne],
    })
    renderPage()

    await userEvent.click(within(card(/acme · role/i)).getByRole('button', { name: 'Reject' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('This suggestion was already superseded.')
    expect(screen.getByText('1 pending · 2 decided')).toBeInTheDocument()
  })

  it('does the same for a suggestion that no longer exists', async () => {
    mockApi({
      decision: () => jsonResponse({ kind: 'not_found', error: 'That suggestion does not exist.' }, 404),
      list: [pendingList, decidedOne],
    })
    renderPage()
    await userEvent.click(within(card(/acme · role/i)).getByRole('button', { name: 'Reject' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('That suggestion does not exist.')
    expect(screen.getByText('1 pending · 1 decided')).toBeInTheDocument()
  })

  it('keeps the list and shows the reason when a decision fails', async () => {
    mockApi({ decision: () => jsonResponse({ kind: 'timeout', error: 'The API took too long to answer.' }, 504) })
    renderPage()
    const role = card(/acme · role/i)
    await userEvent.click(within(role).getByRole('button', { name: 'Accept' }))
    await userEvent.click(within(role).getByRole('button', { name: 'Yes, apply it' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The API took too long to answer.')
    expect(screen.getByText('2 pending · 1 decided')).toBeInTheDocument()
    expect(within(role).getByRole('button', { name: 'Accept' })).toBeEnabled()
  })

  it('reports a network failure and a timeout of this app', async () => {
    mockFetch(unreachable)
    renderPage()
    await userEvent.click(within(card(/acme · role/i)).getByRole('button', { name: 'Reject' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach the admin app/i)

    mockFetch(timedOut)
    await userEvent.click(within(card(/acme · role/i)).getByRole('button', { name: 'Reject' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/took too long/i))
  })

  it('says so when the change was applied but the reload afterwards failed', async () => {
    mockFetch((url, init) =>
      init?.method === 'POST'
        ? jsonResponse({ ...pendingRole, status: 'accepted', decidedAt: '2026-11-21T12:00:00' })
        : jsonResponse({ kind: 'unreachable', error: 'The API could not be reached.' }, 502),
    )
    renderPage()
    const role = card(/acme · role/i)
    await userEvent.click(within(role).getByRole('button', { name: 'Accept' }))
    await userEvent.click(within(role).getByRole('button', { name: 'Yes, apply it' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The API could not be reached.')
    // The accepted suggestion itself is shown as decided.
    expect(screen.getByText('1 pending · 2 decided')).toBeInTheDocument()
  })

  it('sends the browser to the login page when the session expired', async () => {
    mockFetch(() => jsonResponse({ kind: 'unauthorized', error: 'expired' }, 401))
    renderPage()
    await userEvent.click(within(card(/acme · role/i)).getByRole('button', { name: 'Reject' }))
    await waitFor(() => expect(assign).toHaveBeenCalledWith('/admin/login?reason=expired'))
  })
})

describe('Suggestions: history, refresh and sign out', () => {
  it('shows decided suggestions in the history view, without controls', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'History (1)' }))

    const old = card(/acme · role/i)
    expect(within(old).getByText('rejected')).toBeInTheDocument()
    expect(within(old).getByText('Staff Engineer')).toBeInTheDocument()
    expect(within(old).getByText('2026-11-20 09:00')).toBeInTheDocument()
    expect(within(old).queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByText('Senior Engineer')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Pending (2)' }))
    expect(screen.getByText('Senior Engineer')).toBeInTheDocument()
  })

  it('shows a server load error and recovers on refresh', async () => {
    mockApi({})
    render(<Suggestions initialSuggestions={[]} initialTargets={[]} loadError="The API could not be reached." />)

    expect(screen.getByRole('alert')).toHaveTextContent('The API could not be reached.')
    expect(screen.getByText('Suggestions could not be loaded.')).toBeInTheDocument()
    expect(screen.getByText('Not loaded')).toBeInTheDocument()
    expect(screen.getByText(/form needs the current content/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    expect(await screen.findByText('2 pending · 1 decided')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create suggestion' })).toBeInTheDocument()
  })

  it('shows the reason when refresh fails, whichever request failed', async () => {
    mockFetch((url) =>
      url.endsWith('/targets') ? new Response('<html>', { status: 502 }) : jsonResponse(all),
    )
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Request failed (HTTP 502).')
    expect(screen.getByText('2 pending · 1 decided')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled()

    mockFetch(timedOut)
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/took too long/i))
  })

  it('handles an expired session on refresh', async () => {
    mockFetch(() => jsonResponse({ kind: 'unauthorized', error: 'expired' }, 401))
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    await waitFor(() => expect(assign).toHaveBeenCalledWith('/admin/login?reason=expired'))
  })

  it('signs out through this app and leaves, even if the request fails', async () => {
    const fetchMock = mockFetch(unreachable)
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    await waitFor(() => expect(assign).toHaveBeenCalledWith('/admin/login'))
    expect(fetchMock).toHaveBeenCalledWith('/admin/api/session', expect.objectContaining({ method: 'DELETE' }))
  })
})

describe('Suggestions: create by hand', () => {
  const form = () => ({
    target: screen.getByLabelText(/change what/i),
    field: screen.getByLabelText(/field/i),
    value: screen.getByLabelText(/proposed value/i),
    reason: screen.getByLabelText(/reason/i),
    submit: screen.getByRole('button', { name: 'Create suggestion' }),
  })

  it('offers only the targets and fields the API allows, starting from the current value', async () => {
    renderPage([])
    const f = form()
    expect(within(f.target).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Profile',
      'Experience · Engineer at Acme',
    ])
    expect(within(f.field).getAllByRole('option').map((o) => o.textContent)).toEqual(['tagline', 'tech stack'])
    expect(f.value).toHaveValue('Engineer')

    await userEvent.selectOptions(f.field, 'techStack')
    expect(form().value).toHaveValue('Java\nPostgres')
    expect(screen.getByLabelText(/one item per line/i)).toBeInTheDocument()

    await userEvent.selectOptions(f.target, 'experience:7')
    expect(within(form().field).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'role',
      'description',
      'highlights',
    ])
    expect(form().value).toHaveValue('Engineer')
    await userEvent.selectOptions(form().field, 'description')
    expect(form().value).toHaveValue('')
    expect(within(screen.getAllByRole('region', { name: 'Current value' })[0]).getByText('(empty)')).toBeInTheDocument()
  })

  it('creates a text suggestion and shows it as pending', async () => {
    const created = suggestion({ id: 9, targetType: 'profile', targetId: 1, targetLabel: 'Profile', field: 'tagline', proposedValue: 'Backend engineer', reason: 'Clearer' })
    const fetchMock = mockApi({ create: () => jsonResponse(created) })
    renderPage([decidedOne])
    await userEvent.click(screen.getByRole('button', { name: 'History (1)' }))
    const f = form()

    await userEvent.clear(f.value)
    await userEvent.type(f.value, 'Backend engineer')
    await userEvent.type(f.reason, '  Clearer ')
    await userEvent.click(f.submit)

    expect(await screen.findByText('1 pending · 1 decided')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/nothing changes on the site until you accept it/i)
    // Back on the pending view, with the new suggestion there.
    expect(card(/profile · tagline/i)).toBeInTheDocument()
    expect(form().reason).toHaveValue('')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/admin/api/suggestions')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({
      targetType: 'profile',
      targetId: 1,
      field: 'tagline',
      proposedValue: 'Backend engineer',
      reason: 'Clearer',
    })
  })

  it('sends a list as trimmed, non-empty lines', async () => {
    const fetchMock = mockApi({ create: () => jsonResponse(suggestion({ id: 9 })) })
    renderPage([])
    await userEvent.selectOptions(form().field, 'techStack')
    await userEvent.clear(form().value)
    await userEvent.type(form().value, 'Java\n\n  Kafka  \n')
    await userEvent.type(form().reason, 'Used daily')
    await userEvent.click(form().submit)

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).proposedValue).toEqual(['Java', 'Kafka'])
  })

  it('catches an unchanged value, an empty required field, over-long input and a missing reason before sending', async () => {
    const fetchMock = mockApi({ create: () => jsonResponse(suggestion()) })
    renderPage([])

    await userEvent.type(form().reason, 'Why')
    await userEvent.click(form().submit)
    expect(screen.getByRole('alert')).toHaveTextContent('That is the same as the current value.')

    // A list whose lines only differ by blank lines and spaces is unchanged too.
    await userEvent.selectOptions(form().field, 'techStack')
    await userEvent.clear(form().value)
    await userEvent.type(form().value, ' Java \n\nPostgres')
    await userEvent.click(form().submit)
    expect(screen.getByRole('alert')).toHaveTextContent('That is the same as the current value.')

    await userEvent.clear(form().value)
    await userEvent.paste(Array.from({ length: 51 }, (_, i) => `item ${i}`).join('\n'))
    await userEvent.click(form().submit)
    expect(screen.getByRole('alert')).toHaveTextContent('A list is limited to 50 items.')

    await userEvent.clear(form().value)
    await userEvent.click(form().value)
    await userEvent.paste('x'.repeat(256))
    await userEvent.click(form().submit)
    expect(screen.getByRole('alert')).toHaveTextContent('Each item is limited to 255 characters.')

    await userEvent.selectOptions(form().target, 'experience:7')
    await userEvent.clear(form().value)
    await userEvent.click(form().submit)
    expect(screen.getByRole('alert')).toHaveTextContent('This field cannot be empty.')

    await userEvent.click(form().value)
    await userEvent.paste('x'.repeat(256))
    await userEvent.click(form().submit)
    expect(screen.getByRole('alert')).toHaveTextContent('This field is limited to 255 characters.')

    await userEvent.clear(form().value)
    await userEvent.type(form().value, 'Lead')
    await userEvent.clear(form().reason)
    await userEvent.click(form().submit)
    expect(screen.getByRole('alert')).toHaveTextContent(/say why/i)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("shows the API's refusal and keeps what was typed", async () => {
    mockApi({
      create: () => jsonResponse({ kind: 'refused', error: 'The same change is already waiting for a decision.' }, 409),
    })
    renderPage([])
    await userEvent.clear(form().value)
    await userEvent.type(form().value, 'Backend engineer')
    await userEvent.type(form().reason, 'Clearer')
    await userEvent.click(form().submit)

    expect(await screen.findByRole('alert')).toHaveTextContent('The same change is already waiting for a decision.')
    expect(form().value).toHaveValue('Backend engineer')
    expect(form().reason).toHaveValue('Clearer')
    expect(form().submit).toBeEnabled()
    expect(screen.getByText('0 pending · 0 decided')).toBeInTheDocument()
  })

  it('reports a network failure, and an expired session', async () => {
    mockFetch(unreachable)
    renderPage([])
    await userEvent.clear(form().value)
    await userEvent.type(form().value, 'Backend engineer')
    await userEvent.type(form().reason, 'Clearer')
    await userEvent.click(form().submit)
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach the admin app/i)

    mockFetch(() => jsonResponse({ kind: 'unauthorized', error: 'expired' }, 401))
    await userEvent.click(form().submit)
    await waitFor(() => expect(assign).toHaveBeenCalledWith('/admin/login?reason=expired'))
  })

  it('explains when there is nothing to suggest against', () => {
    render(<Suggestions initialSuggestions={[]} initialTargets={[]} />)
    expect(screen.getByText(/nothing to suggest a change to/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Create suggestion' })).not.toBeInTheDocument()
  })

  it('handles a target with no changeable fields', () => {
    render(
      <Suggestions
        initialSuggestions={[]}
        initialTargets={[{ targetType: 'project', targetId: 3, label: 'Site', fields: [] }]}
      />,
    )
    expect(screen.getByText(/no fields that can be changed/i)).toBeInTheDocument()
  })
})
