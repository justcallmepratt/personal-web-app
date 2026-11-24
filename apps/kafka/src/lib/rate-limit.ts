export type Result<T> = { ok: true; value: T } | { ok: false; status: number; message: string }

// Best-effort limiter: state is per server instance, so on serverless hosts it
// slows casual abuse rather than enforcing a hard cap.
const hits = new Map<string, number[]>()

// Past this many tracked keys, a call first drops the ones with no recent hits.
const SWEEP_AT = 1000

export function isRateLimited(key: string, now: number, max: number, windowMs: number): boolean {
  if (hits.size >= SWEEP_AT) {
    for (const [k, times] of hits) {
      if (!times.some((t) => now - t < windowMs)) hits.delete(k)
    }
  }
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= max) {
    hits.set(key, recent)
    return true
  }
  hits.set(key, [...recent, now])
  return false
}

/** How many keys the limiter is tracking (for tests). */
export function trackedKeys(): number {
  return hits.size
}

export function resetRateLimit() {
  hits.clear()
}
