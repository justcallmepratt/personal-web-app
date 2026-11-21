'use client'

import { useState, type FormEvent } from 'react'
import { LOGIN_EXPIRED, errorOf, fetchErrorMessage, leave, timeoutSignal } from '@/lib/client'
import { formatSentAt } from '@/lib/messages'
import {
  LIST_ITEM_MAX,
  LIST_MAX_ITEMS,
  REASON_MAX,
  fieldLabel,
  linesToList,
  sameValue,
  targetKey,
  targetOptionLabel,
  targetTitle,
  valueToText,
} from '@/lib/suggestions'
import type { NewSuggestion, Suggestion, SuggestionTarget, SuggestionValue } from '@/lib/types'
import { NavLink, NeonButton, Notice, Panel } from './ui'

const ACCEPTED_NOTICE = 'Accepted. The public site picks the change up within the hour.'
const CREATED_NOTICE = 'Suggestion created. Nothing changes on the site until you accept it.'

const inputClass =
  'w-full border border-cp-border bg-black px-3 py-2 text-cp-text placeholder:text-cp-muted focus:border-cp-teal focus:outline-none'
const labelClass = 'block text-xs uppercase tracking-[0.2em] text-cp-teal'

/** A refused accept: the field changed after the suggestion was made. */
interface Conflict {
  message: string
  currentValue: SuggestionValue
}

interface Props {
  initialSuggestions: Suggestion[]
  initialTargets: SuggestionTarget[]
  /** Set when the server could not load the page's data; shown until a refresh succeeds. */
  loadError?: string
}

export default function Suggestions({ initialSuggestions, initialTargets, loadError }: Props) {
  const [suggestions, setSuggestions] = useState(initialSuggestions)
  const [targets, setTargets] = useState(initialTargets)
  const [view, setView] = useState<'pending' | 'history'>('pending')
  const [error, setError] = useState<string | null>(loadError ?? null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(!loadError)
  const [busy, setBusy] = useState(false)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [conflicts, setConflicts] = useState<Record<number, Conflict>>({})

  const pending = suggestions.filter((s) => s.status === 'pending')
  const decided = suggestions.filter((s) => s.status !== 'pending')

  /**
   * Reloads suggestions and targets together. Returns false when it failed (the
   * reason is shown) or the session is gone (the browser is leaving).
   */
  async function load(): Promise<boolean> {
    try {
      const [listRes, targetsRes] = await Promise.all([
        fetch('/admin/api/suggestions', { cache: 'no-store', signal: timeoutSignal() }),
        fetch('/admin/api/suggestions/targets', { cache: 'no-store', signal: timeoutSignal() }),
      ])
      if (listRes.status === 401 || targetsRes.status === 401) {
        leave(LOGIN_EXPIRED)
        return false
      }
      const failed = !listRes.ok ? listRes : !targetsRes.ok ? targetsRes : null
      if (failed) {
        setError((await errorOf(failed)).error)
        return false
      }
      setSuggestions((await listRes.json()) as Suggestion[])
      setTargets((await targetsRes.json()) as SuggestionTarget[])
      setLoaded(true)
      // What was true of the old list (a conflict, an open confirmation) may not be any more.
      setConflicts({})
      setConfirmingId(null)
      return true
    } catch (e) {
      setError(fetchErrorMessage(e))
      return false
    }
  }

  async function refresh() {
    if (busy) return
    setBusy(true)
    setNotice(null)
    if (await load()) setError(null)
    setBusy(false)
  }

  async function decide(id: number, decision: 'accept' | 'reject') {
    if (busy) return
    setBusy(true)
    setNotice(null)
    setConfirmingId(null)
    try {
      const res = await fetch(`/admin/api/suggestions/${id}/${decision}`, { method: 'POST', signal: timeoutSignal() })
      if (res.status === 401) return leave(LOGIN_EXPIRED)
      if (res.ok) {
        const updated = (await res.json()) as Suggestion
        setSuggestions((list) => list.map((s) => (s.id === updated.id ? updated : s)))
        setError(null)
        if (decision === 'accept') {
          // Accepting can supersede other suggestions and changes the live values the form shows.
          if (await load()) setNotice(ACCEPTED_NOTICE)
        } else {
          setConflicts((all) => Object.fromEntries(Object.entries(all).filter(([key]) => Number(key) !== id)))
          setNotice('Rejected. Nothing on the site was changed.')
        }
      } else {
        const failure = await errorOf(res)
        if (failure.kind === 'conflict') {
          // Nothing was applied. Keep the suggestion on screen with what the field holds now.
          setConflicts((all) => ({ ...all, [id]: { message: failure.error, currentValue: failure.currentValue ?? null } }))
          setError(null)
        } else if (failure.kind === 'refused' || failure.kind === 'not_found') {
          // This list is out of date (decided elsewhere, or deleted): bring it up to date.
          await load()
          setError(failure.error)
        } else {
          setError(failure.error)
        }
      }
    } catch (e) {
      setError(fetchErrorMessage(e))
    }
    setBusy(false)
  }

  function onCreated(created: Suggestion) {
    setSuggestions((list) => [created, ...list.filter((s) => s.id !== created.id)])
    setView('pending')
    setError(null)
    setNotice(CREATED_NOTICE)
  }

  async function signOut() {
    // Best effort: even if this request fails, leave the page.
    await fetch('/admin/api/session', { method: 'DELETE', signal: timeoutSignal() }).catch(() => undefined)
    leave('/admin/login')
  }

  const shown = view === 'pending' ? pending : decided

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-widest text-cp-teal">
            SUGGESTIONS
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] text-cp-muted" aria-live="polite">
            {loaded ? `${pending.length} pending · ${decided.length} decided` : 'Not loaded'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <NavLink href="/admin">Inbox</NavLink>
          <NeonButton onClick={refresh} disabled={busy}>
            {busy ? 'Working…' : 'Refresh'}
          </NeonButton>
          <NeonButton accent="red" onClick={signOut}>
            Sign out
          </NeonButton>
        </div>
      </header>

      <p className="text-sm text-cp-muted">
        Proposed changes to the profile, experience and projects. Nothing here is public: a change reaches the site
        only when you accept it.
      </p>

      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice tone="info">{notice}</Notice>}

      <div className="flex gap-3" role="group" aria-label="Which suggestions to show">
        <NeonButton
          accent={view === 'pending' ? 'yellow' : 'teal'}
          aria-pressed={view === 'pending'}
          onClick={() => setView('pending')}
        >
          Pending ({pending.length})
        </NeonButton>
        <NeonButton
          accent={view === 'history' ? 'yellow' : 'teal'}
          aria-pressed={view === 'history'}
          onClick={() => setView('history')}
        >
          History ({decided.length})
        </NeonButton>
      </div>

      <Panel title={view === 'pending' ? 'Waiting for your decision' : 'Decided'}>
        {!loaded ? (
          <p className="text-sm text-cp-muted">Suggestions could not be loaded.</p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-cp-muted">
            {view === 'pending' ? 'No pending suggestions.' : 'No decisions yet.'}
          </p>
        ) : (
          <ul className="space-y-6">
            {shown.map((s) => (
              <li key={s.id}>
                <SuggestionCard
                  suggestion={s}
                  conflict={conflicts[s.id]}
                  confirming={confirmingId === s.id}
                  busy={busy}
                  onAskAccept={() => setConfirmingId(s.id)}
                  onCancelAccept={() => setConfirmingId(null)}
                  onAccept={() => decide(s.id, 'accept')}
                  onReject={() => decide(s.id, 'reject')}
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="New suggestion" accent="yellow">
        {!loaded ? (
          <p className="text-sm text-cp-muted">The form needs the current content, which could not be loaded.</p>
        ) : targets.length === 0 ? (
          <p className="text-sm text-cp-muted">
            There is nothing to suggest a change to: the API returned no profile, experience or projects.
          </p>
        ) : (
          <NewSuggestionForm targets={targets} onCreated={onCreated} />
        )}
      </Panel>
    </div>
  )
}

// ── one suggestion ─────────────────────────────────────────────────────────

const STATUS_STYLE: Record<Suggestion['status'], string> = {
  pending: 'border-cp-yellow text-cp-yellow',
  accepted: 'border-cp-teal text-cp-teal',
  rejected: 'border-cp-red text-cp-red',
  superseded: 'border-cp-muted text-cp-muted',
}

/** A value as text or a list. `marked` items (added or removed) get the given label. */
function Value({ value, marked, mark }: { value: SuggestionValue; marked?: SuggestionValue; mark?: string }) {
  if (value === null || value === '') return <p className="text-sm text-cp-muted">(empty)</p>
  if (!Array.isArray(value)) return <p className="whitespace-pre-wrap break-words text-sm">{value}</p>
  if (value.length === 0) return <p className="text-sm text-cp-muted">(empty list)</p>
  const others = Array.isArray(marked) ? marked : null
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {value.map((item, i) => {
        const changed = others !== null && !others.includes(item)
        return (
          <li key={`${i}-${item}`} className="break-words">
            {item}
            {changed && mark && (
              <span className="ml-2 border border-current px-1 text-[10px] uppercase tracking-widest">{mark}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function SuggestionCard({
  suggestion: s,
  conflict,
  confirming,
  busy,
  onAskAccept,
  onCancelAccept,
  onAccept,
  onReject,
}: {
  suggestion: Suggestion
  conflict?: Conflict
  confirming: boolean
  busy: boolean
  onAskAccept: () => void
  onCancelAccept: () => void
  onAccept: () => void
  onReject: () => void
}) {
  const title = `${targetTitle(s)} · ${fieldLabel(s.field)}`
  return (
    <article aria-label={title} className="space-y-3 border border-cp-border p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base text-cp-yellow">{title}</h3>
        <span className={`border px-2 py-0.5 text-[10px] uppercase tracking-widest ${STATUS_STYLE[s.status]}`}>
          {s.status}
        </span>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <section aria-label="Before" className="border-l-2 border-cp-red pl-3">
          <h4 className="mb-1 text-[10px] uppercase tracking-[0.3em] text-cp-red">
            {s.status === 'pending' ? 'Before (when suggested)' : 'Before'}
          </h4>
          <Value value={s.currentValue} marked={s.proposedValue} mark="removed" />
        </section>
        <section aria-label="After" className="border-l-2 border-cp-teal pl-3">
          <h4 className="mb-1 text-[10px] uppercase tracking-[0.3em] text-cp-teal">
            {s.status === 'pending' ? 'After (if accepted)' : 'Proposed'}
          </h4>
          <Value value={s.proposedValue} marked={s.currentValue} mark="added" />
        </section>
      </div>

      <dl className="grid gap-x-4 gap-y-1 text-xs text-cp-muted sm:grid-cols-[auto_1fr]">
        <dt className="uppercase tracking-widest">Reason</dt>
        <dd className="break-words text-cp-text">{s.reason || '(none given)'}</dd>
        <dt className="uppercase tracking-widest">Source</dt>
        <dd>{s.source || 'unknown'}</dd>
        <dt className="uppercase tracking-widest">Suggested</dt>
        <dd>{formatSentAt(s.createdAt)}</dd>
        {s.status !== 'pending' && (
          <>
            <dt className="uppercase tracking-widest">Decided</dt>
            <dd>{formatSentAt(s.decidedAt)}</dd>
          </>
        )}
      </dl>

      {conflict && (
        <div className="space-y-2">
          <Notice tone="error">{conflict.message}</Notice>
          <section aria-label="Current value" className="border-l-2 border-cp-yellow pl-3">
            <h4 className="mb-1 text-[10px] uppercase tracking-[0.3em] text-cp-yellow">On the site now</h4>
            <Value value={conflict.currentValue} />
          </section>
        </div>
      )}

      {s.status === 'pending' &&
        (confirming ? (
          <div className="space-y-2" role="group" aria-label="Confirm accepting">
            <p className="text-sm text-cp-yellow">
              Accepting replaces the “before” value with the “after” value on the public site. Go ahead?
            </p>
            <div className="flex flex-wrap gap-3">
              <NeonButton accent="yellow" onClick={onAccept} disabled={busy}>
                Yes, apply it
              </NeonButton>
              <NeonButton onClick={onCancelAccept} disabled={busy}>
                Cancel
              </NeonButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {/* After a conflict the same accept would be refused again; a refresh clears this. */}
            <NeonButton accent="yellow" onClick={onAskAccept} disabled={busy || conflict !== undefined}>
              Accept
            </NeonButton>
            <NeonButton accent="red" onClick={onReject} disabled={busy}>
              Reject
            </NeonButton>
          </div>
        ))}
    </article>
  )
}

// ── create by hand ─────────────────────────────────────────────────────────

function NewSuggestionForm({
  targets,
  onCreated,
}: {
  targets: SuggestionTarget[]
  onCreated: (created: Suggestion) => void
}) {
  const [key, setKey] = useState(targetKey(targets[0]))
  // The list can change under the form (refresh, accept); fall back to what exists.
  const target = targets.find((t) => targetKey(t) === key) ?? targets[0]
  const [fieldName, setFieldName] = useState(target.fields[0]?.name ?? '')
  const field = target.fields.find((f) => f.name === fieldName) ?? target.fields[0]
  // Starts from the current value, so a suggestion is an edit of what is there.
  const [text, setText] = useState(valueToText(field?.value ?? null))
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function chooseTarget(nextKey: string) {
    const next = targets.find((t) => targetKey(t) === nextKey) ?? targets[0]
    setKey(targetKey(next))
    setFieldName(next.fields[0]?.name ?? '')
    setText(valueToText(next.fields[0]?.value ?? null))
    setError(null)
  }

  function chooseField(name: string) {
    setFieldName(name)
    setText(valueToText(target.fields.find((f) => f.name === name)?.value ?? null))
    setError(null)
  }

  if (!field) return <p className="text-sm text-cp-muted">This entry has no fields that can be changed.</p>

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (pending || !field) return

    const proposedValue = field.kind === 'list' ? linesToList(text) : text
    if (sameValue(proposedValue, field.kind === 'list' ? (field.value ?? []) : (field.value ?? ''))) {
      return setError('That is the same as the current value.')
    }
    if (field.kind === 'text' && field.required && !text.trim()) return setError('This field cannot be empty.')
    if (field.kind === 'text' && text.length > field.maxLength) {
      return setError(`This field is limited to ${field.maxLength} characters.`)
    }
    if (Array.isArray(proposedValue)) {
      if (proposedValue.length > LIST_MAX_ITEMS) return setError(`A list is limited to ${LIST_MAX_ITEMS} items.`)
      if (proposedValue.some((item) => item.length > LIST_ITEM_MAX)) {
        return setError(`Each item is limited to ${LIST_ITEM_MAX} characters.`)
      }
    }
    if (!reason.trim()) return setError('Say why, so the change can be judged later.')

    setPending(true)
    setError(null)
    try {
      const body: NewSuggestion = {
        targetType: target.targetType,
        targetId: target.targetId,
        field: field.name,
        proposedValue,
        reason: reason.trim(),
      }
      const res = await fetch('/admin/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: timeoutSignal(),
      })
      if (res.status === 401) return leave(LOGIN_EXPIRED)
      if (res.ok) {
        onCreated((await res.json()) as Suggestion)
        setReason('')
      } else {
        setError((await errorOf(res)).error)
      }
    } catch (e) {
      setError(fetchErrorMessage(e))
    }
    setPending(false)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1">
          <span className={labelClass}>› Change what</span>
          <select className={inputClass} value={targetKey(target)} onChange={(e) => chooseTarget(e.target.value)}>
            {targets.map((t) => (
              <option key={targetKey(t)} value={targetKey(t)}>
                {targetOptionLabel(t)}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className={labelClass}>› Field</span>
          <select className={inputClass} value={field.name} onChange={(e) => chooseField(e.target.value)}>
            {target.fields.map((f) => (
              <option key={f.name} value={f.name}>
                {fieldLabel(f.name)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section aria-label="Current value" className="border-l-2 border-cp-red pl-3">
        <h3 className="mb-1 text-[10px] uppercase tracking-[0.3em] text-cp-red">Current value</h3>
        <Value value={field.value} />
      </section>

      <label className="block space-y-1">
        <span className={labelClass}>
          › Proposed value{field.kind === 'list' ? ' (one item per line)' : ''}
        </span>
        <textarea
          className={inputClass}
          rows={field.kind === 'list' || field.maxLength > LIST_ITEM_MAX ? 6 : 2}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>› Reason</span>
        <input
          className={inputClass}
          value={reason}
          maxLength={REASON_MAX}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why this change is right"
        />
      </label>

      {error && <Notice tone="error">{error}</Notice>}

      <NeonButton type="submit" accent="yellow" disabled={pending}>
        {pending ? 'Saving…' : 'Create suggestion'}
      </NeonButton>
    </form>
  )
}
