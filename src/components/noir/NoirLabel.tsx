import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export default function NoirLabel({ children, className = '' }: Props) {
  return (
    <span className={`font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-noir-text-muted ${className}`}>
      {children}
    </span>
  )
}
