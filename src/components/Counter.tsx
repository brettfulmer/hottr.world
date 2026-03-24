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
      { threshold: 0.5 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="fade-in py-32 px-6 flex flex-col items-center text-center">
      <div className="relative mb-8" ref={numberRef}>
        <span
          className="font-mono leading-none font-black text-white tracking-tighter mix-blend-screen opacity-90"
          style={{ fontSize: 'clamp(120px, 25vw, 200px)' }}
        >
          {count}
        </span>
        <div className="absolute inset-0 bg-[#ff3db9]/20 blur-[60px] -z-10" />
      </div>
      <div className="space-y-2">
        <h4 className="font-headline text-2xl font-black text-white uppercase tracking-tighter">LANGUAGES.</h4>
        <h4 className="font-headline text-2xl font-black text-white uppercase tracking-tighter">ONE SONG.</h4>
        <h4 className="font-headline text-2xl font-black text-white uppercase tracking-tighter">EVERY PLATFORM.</h4>
      </div>
    </section>
  )
}
