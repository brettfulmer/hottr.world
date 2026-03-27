import { useState } from 'react'

const PIN = '071179'
const PIN_LENGTH = PIN.length

interface Props {
  onUnlock: () => void
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
      if (next.join('') === PIN) {
        onUnlock()
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
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#050608] px-6">
      <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-white/40 mb-6"
        style={{ fontFamily: 'Poppins' }}>
        HOTTR
      </p>
      <h1 className="text-[24px] sm:text-[32px] font-bold text-white tracking-tight mb-2"
        style={{ fontFamily: 'Poppins' }}>
        ENTER ACCESS CODE
      </h1>
      <p className="text-[13px] text-white/40 mb-10" style={{ fontFamily: 'Poppins' }}>
        This experience is invite-only.
      </p>

      {/* PIN display */}
      <div className="flex gap-3 mb-10">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={`w-[40px] h-[50px] flex items-center justify-center border rounded-sm text-[20px] font-mono transition-all duration-200 ${
              error
                ? 'border-red-500/60 animate-[shake_0.3s_ease-in-out]'
                : digits[i]
                  ? 'border-[#FF0CB6]/60 text-white shadow-[0_0_8px_rgba(255,12,182,0.2)]'
                  : 'border-white/15'
            }`}
          >
            {digits[i] ? (
              <span className="text-white">{digits[i]}</span>
            ) : (
              <span className="w-2 h-2 rounded-sm bg-white/10" />
            )}
          </div>
        ))}
      </div>

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3 max-w-[280px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => {
          if (key === '') return <div key="blank" />
          if (key === 'del') {
            return (
              <button
                key="del"
                onClick={handleDelete}
                className="w-[80px] h-[56px] flex items-center justify-center rounded-sm bg-white/[0.03] border border-white/10 text-white/50 text-[13px] tracking-wider uppercase hover:bg-white/[0.06] hover:text-white/70 transition-all active:scale-95"
                style={{ fontFamily: 'Poppins' }}
              >
                DEL
              </button>
            )
          }
          return (
            <button
              key={key}
              onClick={() => handleDigit(key)}
              className="w-[80px] h-[56px] flex items-center justify-center rounded-sm bg-white/[0.04] border border-white/10 text-white text-[20px] font-mono hover:bg-white/[0.08] hover:border-white/20 transition-all active:scale-95 active:bg-[#FF0CB6]/20"
            >
              {key}
            </button>
          )
        })}
      </div>

      {error && (
        <p className="text-[12px] text-red-400/80 mt-6 tracking-wider" style={{ fontFamily: 'Poppins' }}>
          INVALID CODE
        </p>
      )}
    </div>
  )
}
