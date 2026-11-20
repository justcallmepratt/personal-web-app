'use client'

import { NeonButton, Notice } from '@/components/ui'

export default function AdminError({ unstable_retry }: { error: Error; unstable_retry: () => void }) {
  return (
    <div className="mx-auto mt-16 max-w-md space-y-4">
      <Notice tone="error">Something went wrong while loading this page.</Notice>
      <NeonButton onClick={() => unstable_retry()}>Try again</NeonButton>
    </div>
  )
}
