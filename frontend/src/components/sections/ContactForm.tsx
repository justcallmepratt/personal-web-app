'use client'

import { FormEvent, useState } from 'react'
import HUDChrome from '@/components/layout/HUDChrome'
import NeonButton from '@/components/ui/NeonButton'
import TerminalInput from '@/components/ui/TerminalInput'
import { api } from '@/lib/api'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [msg, setMsg] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setMsg('')
    try {
      const res = await api.sendContact({ name, email, subject, body })
      if (res.success) {
        setStatus('sent')
        setMsg(res.message)
        setName(''); setEmail(''); setSubject(''); setBody('')
      } else {
        setStatus('error')
        setMsg(res.message || 'Send failed.')
      }
    } catch {
      setStatus('error')
      setMsg('Connection terminated. Retry.')
    }
  }

  return (
    <HUDChrome accent="teal" title="secure_channel.tx">
      <form onSubmit={onSubmit} className="space-y-4" aria-busy={status === 'sending'}>
        <div className="grid md:grid-cols-2 gap-4">
          <TerminalInput label="Handle" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          <TerminalInput label="Net Address" required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <TerminalInput label="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} />
        <TerminalInput label="Payload" multiline required value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="flex items-center gap-4 flex-wrap">
          <NeonButton type="submit" accent="teal" disabled={status === 'sending'}>
            {status === 'sending' ? 'Transmitting…' : 'Send Burst'}
          </NeonButton>
          {/* Always in the DOM so screen readers announce the result when it appears. */}
          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={`text-xs uppercase tracking-widest ${status === 'sent' ? 'text-cp-teal' : 'text-cp-red'}`}
          >
            {status === 'sending' && <span className="sr-only">Sending message…</span>}
            {msg && (
              <>
                <span aria-hidden="true">» </span>
                {status === 'error' && <span className="sr-only">Error: </span>}
                {msg}
              </>
            )}
          </p>
        </div>
      </form>
    </HUDChrome>
  )
}
