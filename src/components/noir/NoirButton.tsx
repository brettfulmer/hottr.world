import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  fullWidth?: boolean
}

export default function NoirButton({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...rest
}: Props) {
  const base = `
    font-body text-[13px] font-bold uppercase tracking-[0.12em]
    rounded-[4px] py-3.5 px-6
    transition-all duration-200
    disabled:opacity-40 disabled:cursor-not-allowed
  `

  const variants = {
    primary: `
      bg-noir-accent text-white
      hover:bg-noir-accent-pressed active:bg-noir-accent-pressed
      active:scale-[0.98]
    `,
    secondary: `
      bg-noir-surface-raised text-noir-text border border-noir-border/40
      hover:border-noir-accent/40 active:bg-noir-surface-elevated
    `,
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
