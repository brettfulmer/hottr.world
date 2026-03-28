import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  size?: 'xl' | 'lg' | 'md' | 'sm'
  className?: string
}

const sizes = {
  xl: 'text-[clamp(2.5rem,10vw,5rem)]',
  lg: 'text-[clamp(2rem,8vw,4rem)]',
  md: 'text-[clamp(1.5rem,5vw,2.25rem)]',
  sm: 'text-[clamp(1.25rem,4vw,1.75rem)]',
}

export default function NoirHeading({ children, size = 'lg', className = '' }: Props) {
  return (
    <h2 className={`font-headline font-black uppercase leading-[0.95] tracking-tight text-noir-text ${sizes[size]} ${className}`}>
      {children}
    </h2>
  )
}
