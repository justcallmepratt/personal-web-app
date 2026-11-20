'use client'

import { useState } from 'react'
import { formatSentAt } from '@/lib/messages'
import type { ErrorBody, Message } from '@/lib/types'
import { NeonButton, Notice, Panel } from './ui'

const NETWORK_ERROR = 'Could not reach the admin app. Check your connection and try again.'
const LOGIN_EXPIRED = '/admin/login?reason=expired'

/** Full-page navigation: the session is gone, so drop all client state with it. */
const leave = (to: string) => window.location.assign(to)

async function errorOf(res: Response): Promise<ErrorBody> {
  const body = (await res.json().catch(() => null)) as Partial<ErrorBody> | null
  return {
    kind: body?.kind ?? 'error',
    error: body?.error ?? `Request failed (HTTP ${res.status}).`,
  }
}

interface Props {
  initialMessages: Message[]
  /** Set when the server could not load the inbox; shown until a refresh succeeds. */
  loadError?: string
}

export default function Inbox({ initialMessages, loadError }: Props) {
  const [messages, setMessages] = useState(initialMessages)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(loadError ?? null)
  const [loaded, setLoaded] = useState(!loadError)
  const [busy, setBusy] = useState(false)

  const selected = messages.find((m) => m.id === selectedId) ?? null
  const unread = messages.filter((m) => !m.read).length

  async function refresh() {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch('/admin/api/messages', { cache: 'no-store' })
      if (res.status === 401) return leave(LOGIN_EXPIRED)
      if (!res.ok) {
        setError((await errorOf(res)).error)
      } else {
        setMessages((await res.json()) as Message[])
        setLoaded(true)
        setError(null)
      }
    } catch {
      setError(NETWORK_ERROR)
    }
    setBusy(false)
  }

  async function toggleRead(id: number) {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch(`/admin/api/messages/${id}/read`, { method: 'PATCH' })
      if (res.status === 401) return leave(LOGIN_EXPIRED)
      if (res.ok) {
        const updated = (await res.json()) as Message
        setMessages((list) => list.map((m) => (m.id === updated.id ? updated : m)))
        setError(null)
      } else {
        const failure = await errorOf(res)
        if (failure.kind === 'not_found') {
          // Deleted elsewhere: take it out of the list rather than leave a dead row.
          setMessages((list) => list.filter((m) => m.id !== id))
          setSelectedId(null)
        }
        setError(failure.error)
      }
    } catch {
      setError(NETWORK_ERROR)
    }
    setBusy(false)
  }

  async function signOut() {
    // Best effort: even if this request fails, leave the inbox.
    await fetch('/admin/api/session', { method: 'DELETE' }).catch(() => undefined)
    leave('/admin/login')
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-widest text-cp-teal">
            INBOX
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] text-cp-muted" aria-live="polite">
            {loaded ? `${unread} unread · ${messages.length} total` : 'Not loaded'}
          </p>
        </div>
        <div className="flex gap-3">
          <NeonButton onClick={refresh} disabled={busy}>
            {busy ? 'Working…' : 'Refresh'}
          </NeonButton>
          <NeonButton accent="red" onClick={signOut}>
            Sign out
          </NeonButton>
        </div>
      </header>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Panel title="Messages">
          {!loaded ? (
            <p className="text-sm text-cp-muted">Messages could not be loaded.</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-cp-muted">No messages yet.</p>
          ) : (
            <ul className="-m-4 divide-y divide-cp-border">
              {messages.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(m.id)}
                    aria-current={m.id === selectedId ? 'true' : undefined}
                    className={`block w-full cursor-pointer px-4 py-3 text-left hover:bg-cp-border/40 ${
                      m.id === selectedId ? 'bg-cp-border/60' : ''
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2 text-xs text-cp-muted">
                      <span className="truncate">{m.name || m.email || 'Unknown sender'}</span>
                      <span className="shrink-0">{formatSentAt(m.sentAt)}</span>
                    </span>
                    <span
                      className={`mt-1 flex items-center gap-2 truncate text-sm ${
                        m.read ? 'text-cp-text/70' : 'font-bold text-cp-yellow'
                      }`}
                    >
                      {!m.read && (
                        <span className="shrink-0 border border-cp-yellow px-1 text-[10px] uppercase tracking-widest">
                          Unread
                        </span>
                      )}
                      <span className="truncate">{m.subject || '(no subject)'}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Message" accent="yellow">
          {selected ? (
            <article className="space-y-4">
              <div>
                <h2 className="text-lg text-cp-yellow">{selected.subject || '(no subject)'}</h2>
                <p className="text-xs text-cp-muted">
                  From {selected.name || 'Unknown sender'}
                  {selected.email && (
                    <>
                      {' · '}
                      <a className="text-cp-teal hover:underline" href={`mailto:${selected.email}`}>
                        {selected.email}
                      </a>
                    </>
                  )}
                  {' · '}
                  {formatSentAt(selected.sentAt)}
                </p>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm">{selected.body || '(empty message)'}</p>
              <NeonButton accent="yellow" onClick={() => toggleRead(selected.id)} disabled={busy}>
                {selected.read ? 'Mark as unread' : 'Mark as read'}
              </NeonButton>
            </article>
          ) : (
            <p className="text-sm text-cp-muted">Select a message to read it.</p>
          )}
        </Panel>
      </div>
    </div>
  )
}
