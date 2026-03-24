import { useEffect, useRef, useState } from 'react'
import { useSectionReveal } from '../hooks/useSectionReveal'

export default function Counter() {
  const sectionRef = useSectionReveal<HTMLElement>()
  const [count, setCount] = useState(0)
  const hasRun = useRef(false)
  const numberRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    const el = numberRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRun.current) {
          hasRun.current = true
          let current = 0
          intervalRef.current = setInterval(() => {
            current++
            setCount(current)
            if (current >= 30) clearInterval(intervalRef.current)
          }, 66) // ~2 seconds for 30 ticks
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <section ref={sectionRef} data-section="3" className="snap-section flex items-center justify-center">
      <div className="section-content text-center px-6">
        <div
          ref={numberRef}
          className="font-['Poppins'] leading-none text-white"
          style={{
            fontSize: 'clamp(120px, 25vw, 300px)',
            textShadow: '0 0 40px rgba(255,12,182,0.8), 0 0 80px rgba(255,12,182,0.4)',
          }}
        >
          {count}
        </div>
        <p className="mt-6 font-['Poppins'] text-base tracking-wider text-white/70 uppercase sm:text-lg md:text-xl">
          languages. one song. every platform.
        </p>
      </div>
    </section>
  )
}
