import type { KafkaRecord } from './types'
import type { Result } from './rate-limit'

// Server-only helpers for the live Kafka demo (app/kafka/api/*).
//
// The demo service is the Spring Boot app from the Kafka-Producer-Consumer-Demo
// repo: POST /api/kafka/produce publishes to a topic, a @KafkaListener consumes
// it and stores each record, and GET /api/kafka/messages returns the latest 100.
//
// That service has one shared topic and no notion of visitors, so the relay
// scopes records to a browser session: it prefixes the Kafka key with the
// session id on the way in and returns only that session's records on the way
// out. Nothing a visitor types is ever shown to another visitor.

export const KAFKA_LIMITS = { key: 64, message: 280 } as const
export const KAFKA_TIMEOUT_MS = 10_000

const SESSION = /^[a-f0-9]{16}$/
// Control characters, including newlines: records are rendered as single log lines.
const CONTROL = /[\u0000-\u001f\u007f]+/g

const reject = (status: number, message: string) => ({ ok: false as const, status, message })

export const isSessionId = (v: unknown): v is string => typeof v === 'string' && SESSION.test(v)

export const kafkaDemoUrl = () => process.env.KAFKA_DEMO_URL?.replace(/\/+$/, '') || null

/**
 * Headers for calls to the demo service. With KAFKA_DEMO_TOKEN set, the service's
 * shared secret is sent along; the service rejects /api calls without it.
 */
export function kafkaDemoHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = process.env.KAFKA_DEMO_TOKEN
  return token ? { ...extra, 'X-Demo-Token': token } : extra
}

export interface ProduceInput {
  sid: string
  key: string
  message: string
}

/** Shape, session and length checks for a produce request. */
export function validateProduce(input: unknown): Result<ProduceInput> {
  if (typeof input !== 'object' || input === null) return reject(400, 'Invalid request.')
  const raw = input as Record<string, unknown>
  if (!isSessionId(raw.sid)) return reject(400, 'Invalid session.')

  const clean = (v: unknown) => (typeof v === 'string' ? v.replace(CONTROL, ' ').trim() : '')
  const message = clean(raw.message)
  const key = clean(raw.key)
  if (!message) return reject(400, 'Message cannot be empty.')
  if (message.length > KAFKA_LIMITS.message) return reject(400, 'Message is too long.')
  if (key.length > KAFKA_LIMITS.key) return reject(400, 'Key is too long.')
  return { ok: true, value: { sid: raw.sid, key, message } }
}

/** The key actually written to Kafka: the visitor's key, namespaced by session. */
export const scopedKey = (sid: string, key: string) => `${sid}:${key}`

/** Keeps only the session's records from the service's response and un-scopes their keys. */
export function sessionRecords(upstream: unknown, sid: string): KafkaRecord[] {
  if (!Array.isArray(upstream)) throw new Error('Unexpected response from the demo service.')
  const prefix = `${sid}:`
  const records: KafkaRecord[] = []
  for (const item of upstream) {
    if (typeof item !== 'object' || item === null) continue
    const m = item as Record<string, unknown>
    if (typeof m.key !== 'string' || !m.key.startsWith(prefix) || typeof m.content !== 'string') continue
    records.push({
      id: String(m.id ?? `${m.timestamp}-${records.length}`),
      key: m.key.slice(prefix.length),
      content: m.content,
      timestamp: typeof m.timestamp === 'string' ? m.timestamp : '',
      topic: typeof m.topic === 'string' ? m.topic : '',
    })
  }
  return records
}
