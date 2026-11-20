'use client'

import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

type InputProps = { label: string; multiline?: false } & InputHTMLAttributes<HTMLInputElement>
type TextareaProps = { label: string; multiline: true } & TextareaHTMLAttributes<HTMLTextAreaElement>

export default function TerminalInput(props: InputProps | TextareaProps) {
  // The border is 3:1 or better against the field and the panel; keyboard
  // focus adds the global :focus-visible outline on top of the teal border.
  const sharedCls =
    'w-full bg-[#000000] border border-cp-border-strong focus:border-cp-teal px-3 py-2 font-[var(--font-mono)] text-cp-text placeholder:text-cp-muted'
  const labelText = (label: string) => (
    <span className="block text-xs uppercase tracking-[0.2em] text-cp-teal">
      <span aria-hidden="true">› </span>
      {label}
    </span>
  )

  if (props.multiline) {
    const { label, multiline: _m, ...rest } = props
    void _m
    return (
      <label className="block space-y-1">
        {labelText(label)}
        <textarea {...rest} rows={6} className={sharedCls} />
      </label>
    )
  }
  const { label, multiline: _m, ...rest } = props
  void _m
  return (
    <label className="block space-y-1">
      {labelText(label)}
      <input {...rest} className={sharedCls} />
    </label>
  )
}
