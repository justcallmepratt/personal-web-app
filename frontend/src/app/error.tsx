'use client'

import { useEffect } from 'react'
import NeonButton from '@/components/ui/NeonButton'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section role="alert" className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="font-[var(--font-display)] text-cp-red text-2xl tracking-widest">
        {'// SYSTEM_ERROR //'}
      </p>
      <p className="font-[var(--font-mono)] text-cp-muted text-sm max-w-md">
        {error.message || 'An unexpected error occurred. Connection terminated.'}
      </p>
      <NeonButton accent="teal" onClick={reset}>Reconnect</NeonButton>
    </section>
  )
}
