import type { ReactNode, CSSProperties } from 'react'

interface Props {
  children: ReactNode
  muted?: boolean
  size?: 'base' | 'sm' | 'xs'
  className?: string
  style?: CSSProperties
}

const sizes = {
  base: 'text-[clamp(0.85rem,2.5vw,1rem)]',
  sm: 'text-[13px]',
  xs: 'text-[11px]',
}

export default function NoirText({ children, muted = false, size = 'base', className = '', style }: Props) {
  return (
    <p className={`font-body leading-relaxed ${sizes[size]} ${muted ? 'text-noir-text-muted' : 'text-noir-text'} ${className}`} style={style}>
      {children}
    </p>
  )
}
