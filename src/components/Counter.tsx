import { useEffect, useRef, useState } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function Counter() {
  const sectionRef = useScrollReveal<HTMLElement>()
  const [count, setCount] = useState(0)
  const hasRun = useRef(false)
  const numberRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = numberRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRun.current) {
          hasRun.current = true
          let current = 0
          const interval = setInterval(() => {
            current++
            setCount(current)
            if (current >= 25) clearInterval(interval)
          }, 60)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="fade-in px-6 py-28 md:py-40">
      <div className="text-center">
        <div
          ref={numberRef}
          className="font-mono leading-none text-white"
          style={{
            fontSize: 'clamp(120px, 25vw, 300px)',
            textShadow: '0 0 32px rgba(255,12,182,1), 0 0 64px rgba(255,12,182,0.6), 0 0 128px rgba(255,12,182,0.3)',
          }}
        >
          {count}
        </div>
        <p className="mt-6 font-[Poppins] text-base tracking-wider text-white/72 sm:text-lg md:text-xl">
          languages. one song. every platform.
        </p>
      </div>
    </section>
  )
}
