import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export default function SectionShell({ children, className = '' }: Props) {
  return (
    <div className={`w-full max-w-[780px] mx-auto px-5 md:px-8 ${className}`}>
      {children}
    </div>
  )
}
