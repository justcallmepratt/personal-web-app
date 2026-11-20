'use client'

import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

type InputProps = { label: string; multiline?: false } & InputHTMLAttributes<HTMLInputElement>
type TextareaProps = { label: string; multiline: true } & TextareaHTMLAttributes<HTMLTextAreaElement>

export default function TerminalInput(props: InputProps | TextareaProps) {
  const sharedCls =
    'w-full bg-[#000000] border border-cp-border focus:border-cp-teal focus:outline-none px-3 py-2 font-[var(--font-mono)] text-cp-text placeholder:text-cp-muted'

  if (props.multiline) {
    const { label, multiline: _m, ...rest } = props
    void _m
    return (
      <label className="block space-y-1">
        <span className="block text-xs uppercase tracking-[0.2em] text-cp-teal">› {label}</span>
        <textarea {...rest} rows={6} className={sharedCls} />
      </label>
    )
  }
  const { label, multiline: _m, ...rest } = props
  void _m
  return (
    <label className="block space-y-1">
      <span className="block text-xs uppercase tracking-[0.2em] text-cp-teal">› {label}</span>
      <input {...rest} className={sharedCls} />
    </label>
  )
}
