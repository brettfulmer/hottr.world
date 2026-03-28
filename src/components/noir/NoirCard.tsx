import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export default function NoirCard({ children, className = '' }: Props) {
  return (
    <div
      className={`bg-noir-surface border border-noir-border/40 rounded-[4px] p-6 md:p-8 ${className}`}
    >
      {children}
    </div>
  )
}
