import { useState } from 'react'
import { NoirHeading, NoirText, NoirLabel } from './noir'
import { supabase } from '../lib/supabase'

const VALID_PINS: Record<string, string> = {
  '071179': 'brett',
  '963223': 'showcase',
}
const PIN_LENGTH = 6

interface Props {
  onUnlock: (pinLabel: string) => void
}

async function logPinUsage(pin: string, label: string) {
  try {
    await supabase.from('pin_usage').insert({
      pin_code: pin, pin_label: label,
      user_agent: navigator.userAgent,
      screen_width: window.innerWidth, screen_height: window.innerHeight,
    })
  } catch { /* silent */ }
}

export default function PinGate({ onUnlock }: Props) {
  const [digits, setDigits] = useState<string[]>([])
  const [error, setError] = useState(false)

  const handleDigit = (d: string) => {
    if (digits.length >= PIN_LENGTH) return
    const next = [...digits, d]
    setDigits(next)
    setError(false)

    if (next.length === PIN_LENGTH) {
      const pin = next.join('')
      const label = VALID_PINS[pin]
      if (label) {
        logPinUsage(pin, label)
        onUnlock(label)
      } else {
        setError(true)
        setTimeout(() => { setDigits([]); setError(false) }, 800)
      }
    }
  }

  const handleDelete = () => {
    setDigits(prev => prev.slice(0, -1))
    setError(false)
  }

  return (
    <div className="w-full h-screen flex items-center justify-center bg-noir-bg px-5 md:px-8">
      <div className="flex flex-col items-center">
      <NoirLabel className="mb-6">HOTTR</NoirLabel>
      <NoirHeading size="md" className="mb-2 text-center">ENTER ACCESS CODE</NoirHeading>
      <NoirText muted size="sm" className="mb-10">This experience is invite-only.</NoirText>

      <div className="flex gap-3 mb-10">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div key={i} className={`w-[40px] h-[50px] flex items-center justify-center border rounded-[4px] text-[20px] font-mono transition-all duration-200 ${error ? 'border-red-500/60 animate-[shake_0.3s_ease-in-out]' : digits[i] ? 'border-noir-accent/60 text-noir-text shadow-[0_0_8px_rgba(255,12,182,0.2)]' : 'border-noir-border/40'}`}>
            {digits[i] ? <span className="text-noir-text">{digits[i]}</span> : <span className="w-2 h-2 rounded-full bg-noir-border/30" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-[280px]">
        {['1','2','3','4','5','6','7','8','9','','0','del'].map((key) => {
          if (key === '') return <div key="blank" />
          if (key === 'del') return (
            <button key="del" onClick={handleDelete} className="w-[80px] h-[56px] flex items-center justify-center rounded-[4px] bg-noir-surface border border-noir-border/40 text-noir-text-muted font-body text-[13px] tracking-wider uppercase hover:bg-noir-surface-raised hover:text-noir-text transition-all duration-200 active:scale-95">DEL</button>
          )
          return (
            <button key={key} onClick={() => handleDigit(key)} className="w-[80px] h-[56px] flex items-center justify-center rounded-[4px] bg-noir-surface border border-noir-border/40 text-noir-text text-[20px] font-mono hover:bg-noir-surface-raised hover:border-noir-border/70 transition-all duration-200 active:scale-95 active:bg-noir-accent/20">{key}</button>
          )
        })}
      </div>

      {error && <NoirText size="xs" className="text-red-400/80 mt-6 tracking-wider uppercase">INVALID CODE</NoirText>}
      </div>
    </div>
  )
}
