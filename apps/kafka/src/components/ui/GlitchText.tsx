'use client'

import { ElementType } from 'react'

interface Props {
  text: string
  as?: ElementType
  className?: string
}

export default function GlitchText({ text, as: Tag = 'span', className = '' }: Props) {
  return (
    <Tag data-text={text} className={`glitch-text ${className}`}>
      {text}
    </Tag>
  )
}
