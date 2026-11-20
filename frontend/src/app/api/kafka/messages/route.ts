import type { NextRequest } from 'next/server'
import { isRateLimited } from '@/lib/contact'
import {
  KAFKA_TIMEOUT_MS, isSessionId, kafkaDemoHeaders, kafkaDemoUrl, sessionRecords,
} from '@/lib/kafka'

const reply = (success: boolean, message: string, status = 200, records: unknown[] = []) =>
  Response.json({ success, message, records }, { status, headers: { 'Cache-Control': 'no-store' } })

/** Returns the records the demo's consumer has read for one browser session. */
export async function GET(request: NextRequest) {
  const base = kafkaDemoUrl()
  if (!base) return reply(false, 'The Kafka demo is offline.', 503)

  const sid = request.nextUrl.searchParams.get('sid')
  if (!isSessionId(sid)) return reply(false, 'Invalid session.', 400)

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  if (isRateLimited(`kafka-read:${ip}`, Date.now(), 120, 60_000)) {
    return reply(false, 'Slow down: too many reads from your connection.', 429)
  }

  try {
    const res = await fetch(`${base}/api/kafka/messages`, {
      cache: 'no-store',
      headers: kafkaDemoHeaders(),
      signal: AbortSignal.timeout(KAFKA_TIMEOUT_MS),
    })
    if (!res.ok) throw new Error(`messages → ${res.status}`)
    return reply(true, 'ok', 200, sessionRecords(await res.json(), sid))
  } catch (e) {
    console.error('Kafka demo: read failed.', e)
    return reply(false, 'The Kafka demo service is not responding. Try again in a moment.', 502)
  }
}
