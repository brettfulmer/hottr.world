import { useState, useRef, useEffect } from 'react'

const PIN = '071179'
const PIN_LENGTH = PIN.length

interface Props {
  onUnlock: () => void
}

export default function PinGate({ onUnlock }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''))
  const [error, setError] = useState(false)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return

    const next = [...digits]
    next[index] = value
    setDigits(next)
    setError(false)

    if (value && index < PIN_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus()
    }

    if (value && index === PIN_LENGTH - 1) {
      const pin = next.join('')
      if (pin === PIN) {
        onUnlock()
      } else {
        setError(true)
        setTimeout(() => {
          setDigits(Array(PIN_LENGTH).fill(''))
          inputsRef.current[0]?.focus()
        }, 600)
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH)
    if (!pasted) return

    const next = Array(PIN_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)

    if (pasted.length === PIN_LENGTH) {
      if (pasted === PIN) {
        onUnlock()
      } else {
        setError(true)
        setTimeout(() => {
          setDigits(Array(PIN_LENGTH).fill(''))
          inputsRef.current[0]?.focus()
        }, 600)
      }
    } else {
      inputsRef.current[pasted.length]?.focus()
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#050608] px-6">
      <p className="font-['Plus_Jakarta_Sans'] text-[10px] font-semibold tracking-[0.3em] uppercase text-white/40 mb-6">
        HOTTR
      </p>
      <h1 className="font-['Plus_Jakarta_Sans'] text-[28px] sm:text-[36px] font-bold text-white tracking-tight mb-2">
        ENTER ACCESS CODE
      </h1>
      <p className="font-['Plus_Jakarta_Sans'] text-[13px] text-white/40 mb-10">
        This experience is invite-only.
      </p>

      <div className="flex gap-3">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            className={`
              w-[44px] h-[56px] text-center font-mono text-[24px] text-white
              bg-white/5 border rounded-sm outline-none
              transition-all duration-300
              focus:border-[#FF0CB6] focus:shadow-[0_0_12px_rgba(255,12,182,0.3)]
              ${error
                ? 'border-red-500/60 animate-[shake_0.3s_ease-in-out]'
                : 'border-white/15 hover:border-white/25'
              }
            `}
          />
        ))}
      </div>

      {error && (
        <p className="font-['Plus_Jakarta_Sans'] text-[12px] text-red-400/80 mt-4 tracking-wider">
          INVALID CODE
        </p>
      )}
    </div>
  )
}
