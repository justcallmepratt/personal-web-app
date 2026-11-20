import { isRateLimited } from '@/lib/contact'
import {
  KAFKA_TIMEOUT_MS, kafkaDemoHeaders, kafkaDemoUrl, scopedKey, validateProduce,
} from '@/lib/kafka'

const reply = (success: boolean, message: string, status = 200) =>
  Response.json({ success, message }, { status })

// A valid request is well under 1 KB.
const MAX_BODY_BYTES = 4096

/** Publishes one record to the demo topic through the Kafka demo service. */
export async function POST(request: Request) {
  const base = kafkaDemoUrl()
  if (!base) return reply(false, 'The Kafka demo is offline.', 503)

  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return reply(false, 'Request too large.', 413)
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return reply(false, 'Invalid request.', 400)
  }

  const input = validateProduce(json)
  if (!input.ok) return reply(false, input.message, input.status)

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  if (isRateLimited(`kafka-produce:${ip}`, Date.now(), 20, 60_000)) {
    return reply(false, 'Slow down: too many records from your connection.', 429)
  }

  const { sid, key, message } = input.value
  try {
    const res = await fetch(`${base}/api/kafka/produce`, {
      method: 'POST',
      headers: kafkaDemoHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ key: scopedKey(sid, key), message }),
      signal: AbortSignal.timeout(KAFKA_TIMEOUT_MS),
    })
    if (!res.ok) throw new Error(`produce → ${res.status}`)
    return reply(true, 'Record sent to the broker.')
  } catch (e) {
    console.error('Kafka demo: produce failed.', e)
    return reply(false, 'The Kafka demo service is not responding. Try again in a moment.', 502)
  }
}
