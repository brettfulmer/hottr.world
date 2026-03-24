import { useEffect, useRef, useState } from 'react'

interface Props {
  isActive: boolean
}

export default function Counter({ isActive }: Props) {
  const [display, setDisplay] = useState('0.0B')
  const hasRun = useRef(false)

  useEffect(() => {
    if (!isActive || hasRun.current) return
    hasRun.current = true

    const target = 4.5
    const duration = 2500
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = eased * target
      setDisplay(`${value.toFixed(1)}B`)
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [isActive])

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center px-6">
        <div
          className="font-mono leading-none text-white"
          style={{
            fontSize: 'clamp(120px, 25vw, 240px)',
            textShadow: '0 0 40px rgba(255,12,182,0.6), 0 0 80px rgba(255,12,182,0.3), 0 0 120px rgba(255,12,182,0.15)',
          }}
        >
          {display}
        </div>
        <p className="mt-8 font-['Poppins'] text-[14px] font-semibold tracking-[0.2em] text-white uppercase">
          PEOPLE CAN SING ALONG IN THEIR OWN LANGUAGE
        </p>
      </div>
    </div>
  )
}
