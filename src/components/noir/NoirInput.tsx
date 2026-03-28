import { forwardRef, type InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const NoirInput = forwardRef<HTMLInputElement, Props>(
  ({ error, className = '', ...rest }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          w-full font-body text-[14px] text-noir-text
          bg-noir-surface-raised border rounded-[4px]
          px-4 py-3 outline-none
          transition-all duration-200
          placeholder:text-noir-text-muted/50
          focus:border-noir-accent focus:ring-1 focus:ring-noir-accent/30
          ${error ? 'border-red-500/60' : 'border-noir-border/40 hover:border-noir-border/70'}
          ${className}
        `}
        {...rest}
      />
    )
  }
)

NoirInput.displayName = 'NoirInput'
export default NoirInput
