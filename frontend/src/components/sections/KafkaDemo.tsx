'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import HUDChrome from '@/components/layout/HUDChrome'
import NeonButton from '@/components/ui/NeonButton'
import TerminalInput from '@/components/ui/TerminalInput'
import { api } from '@/lib/api'
import type { KafkaRecord } from '@/lib/types'

// Mirrors KAFKA_LIMITS in lib/kafka.ts, which is server-only.
const MAX_KEY = 64
const MAX_MESSAGE = 280
const SID_STORAGE_KEY = 'kafka-demo-sid'

// After a send the consumer usually has the record within a second. Poll a few
// times and stop, so an open tab costs nothing while idle.
const POLL_INTERVAL_MS = 1200
const POLL_ATTEMPTS = 8

type Stage = 'idle' | 'producing' | 'in-flight' | 'consumed' | 'error'

const STAGES = [
  { id: 'producer', label: 'Producer', detail: 'KafkaTemplate · acks=all' },
  { id: 'topic', label: 'Topic', detail: 'demo-topic' },
  { id: 'consumer', label: 'Consumer', detail: '@KafkaListener · demo-group' },
  { id: 'store', label: 'Store', detail: 'PostgreSQL' },
] as const

/** How many pipeline stages are lit for each stage of a send. */
const LIT: Record<Stage, number> = { idle: 0, producing: 1, 'in-flight': 2, consumed: 4, error: 0 }

function readSid(): string | null {
  try {
    return window.sessionStorage.getItem(SID_STORAGE_KEY)
  } catch {
    return null
  }
}

function newSid(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  const sid = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  try {
    window.sessionStorage.setItem(SID_STORAGE_KEY, sid)
  } catch {
    // Storage blocked: the session just lasts until the page is reloaded.
  }
  return sid
}

/** The service reports UTC local date-times with no zone suffix. */
function formatTime(timestamp: string): string {
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(timestamp) ? timestamp : `${timestamp}Z`)
  return Number.isNaN(d.getTime()) ? '--:--:--' : d.toLocaleTimeString()
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default function KafkaDemo({ configured }: { configured: boolean }) {
  const [key, setKey] = useState('')
  const [message, setMessage] = useState('')
  const [stage, setStage] = useState<Stage>('idle')
  const [note, setNote] = useState('')
  const [records, setRecords] = useState<KafkaRecord[]>([])

  const sid = useRef<string | null>(null)
  /** Records this session should have once the consumer catches up. */
  const expected = useRef(0)
  const polling = useRef(false)
  const alive = useRef(true)

  async function fetchRecords(): Promise<KafkaRecord[] | null> {
    if (!sid.current) return []
    try {
      const res = await api.kafkaMessages(sid.current)
      if (!alive.current) return null
      if (!res.success) {
        setNote(res.message)
        return null
      }
      setRecords(res.records)
      return res.records
    } catch {
      if (alive.current) setNote('Connection terminated. Retry.')
      return null
    }
  }

  // A reload keeps the session, so show what it already produced.
  useEffect(() => {
    alive.current = true
    const stored = configured ? readSid() : null
    if (stored) {
      sid.current = stored
      void fetchRecords().then((r) => {
        // Max, not set: a record sent before this resolved is already counted.
        if (r) expected.current = Math.max(expected.current, r.length)
      })
    }
    return () => {
      alive.current = false
    }
  }, [configured])

  async function pollUntilConsumed() {
    if (polling.current) return
    polling.current = true
    let seen: KafkaRecord[] | null = null
    for (let i = 0; i < POLL_ATTEMPTS && alive.current; i++) {
      await sleep(POLL_INTERVAL_MS)
      seen = await fetchRecords()
      if (!seen || seen.length >= expected.current) break
    }
    polling.current = false
    if (!alive.current) return
    if (seen && seen.length >= expected.current) {
      setStage('consumed')
      setNote('Consumed and stored.')
    } else if (seen) {
      // Don't keep waiting for records that never showed up.
      expected.current = seen.length
      setStage('error')
      setNote('Sent, but the consumer has not picked it up yet. Try Refresh.')
    } else {
      setStage('error')
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!configured || stage === 'producing') return
    setStage('producing')
    setNote('')
    sid.current ??= newSid()
    try {
      const res = await api.kafkaProduce({ sid: sid.current, key, message })
      if (!res.success) {
        setStage('error')
        setNote(res.message || 'Send failed.')
        return
      }
    } catch {
      setStage('error')
      setNote('Connection terminated. Retry.')
      return
    }
    setMessage('')
    setStage('in-flight')
    setNote('Acknowledged by the broker. Waiting for the consumer…')
    expected.current += 1
    void pollUntilConsumed()
  }

  async function onRefresh() {
    setNote('')
    const r = await fetchRecords()
    if (r) expected.current = Math.max(expected.current, r.length)
  }

  const lit = LIT[stage]

  return (
    <div className="space-y-6">
      {!configured && (
        <p role="status" className="text-cp-yellow font-[var(--font-mono)] text-sm">
          {'// Broker offline: the live demo is not connected right now. The code is in the repo below. //'}
        </p>
      )}

      <HUDChrome accent="yellow" title="pipeline.map">
        <ol className="grid grid-cols-2 md:grid-cols-4 gap-3" aria-label="Message pipeline">
          {STAGES.map((s, i) => {
            const on = i < lit
            return (
              <li
                key={s.id}
                data-testid={`stage-${s.id}`}
                data-lit={on}
                className={`border px-3 py-3 transition-colors ${
                  on ? 'border-cp-teal text-cp-teal' : 'border-cp-border text-cp-muted'
                }`}
                style={on ? { boxShadow: '0 0 12px #55EAD444' } : undefined}
              >
                <div className="text-xs uppercase tracking-[0.2em] font-[var(--font-mono)]">
                  {String(i + 1).padStart(2, '0')} {s.label}
                </div>
                <div className="text-[11px] mt-1 text-cp-text/70 break-words">{s.detail}</div>
              </li>
            )
          })}
        </ol>
      </HUDChrome>

      <div className="grid lg:grid-cols-2 gap-6">
        <HUDChrome accent="teal" title="producer.tx">
          <form onSubmit={onSubmit} className="space-y-4">
            <TerminalInput
              label="Key (optional)"
              maxLength={MAX_KEY}
              placeholder="order-42"
              value={key}
              disabled={!configured}
              onChange={(e) => setKey(e.target.value)}
            />
            <TerminalInput
              label="Message"
              required
              maxLength={MAX_MESSAGE}
              placeholder="Hello, Kafka"
              value={message}
              disabled={!configured}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex items-center gap-4 flex-wrap">
              <NeonButton type="submit" accent="teal" disabled={!configured || stage === 'producing'}>
                {stage === 'producing' ? 'Producing…' : 'Produce'}
              </NeonButton>
              {note && (
                <span
                  role="status"
                  className={`text-xs uppercase tracking-widest ${stage === 'error' ? 'text-cp-red' : 'text-cp-teal'}`}
                >
                  » {note}
                </span>
              )}
            </div>
          </form>
        </HUDChrome>

        <HUDChrome accent="red" title="consumer.rx">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs uppercase tracking-[0.2em] text-cp-text/70">
              {records.length} record{records.length === 1 ? '' : 's'} · this session only
            </span>
            <button
              type="button"
              onClick={onRefresh}
              disabled={!configured}
              className="text-xs uppercase tracking-[0.2em] text-cp-yellow hover:underline disabled:opacity-40 min-h-[44px] px-2 cursor-pointer"
            >
              ↻ Refresh
            </button>
          </div>
          {records.length === 0 ? (
            <p className="text-cp-muted font-[var(--font-mono)] text-sm">{'// Nothing consumed yet //'}</p>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-y-auto font-[var(--font-mono)] text-sm">
              {records.map((r) => (
                <li key={r.id} className="border-l-2 border-cp-red pl-3 break-words">
                  <span className="text-cp-muted">{formatTime(r.timestamp)}</span>{' '}
                  {r.key && <span className="text-cp-yellow">[{r.key}]</span>}{' '}
                  <span className="text-cp-text">{r.content}</span>
                </li>
              ))}
            </ul>
          )}
        </HUDChrome>
      </div>
    </div>
  )
}
