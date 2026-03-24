import { useEffect, useRef, useCallback } from 'react'

interface Props {
  active: number
  count: number
  goTo: (idx: number) => void
}

export default function SectionDots({ active, count, goTo }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  const showDots = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    el.style.opacity = '1'
    if (hideTimeout.current) clearTimeout(hideTimeout.current)
    hideTimeout.current = setTimeout(() => {
      if (containerRef.current) containerRef.current.style.opacity = '0.2'
    }, 3000)
  }, [])

  useEffect(() => {
    showDots()
    return () => { if (hideTimeout.current) clearTimeout(hideTimeout.current) }
  }, [active, showDots])

  return (
    <div
      ref={containerRef}
      className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3"
      style={{ opacity: 1, transition: 'opacity 0.5s' }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          onClick={() => goTo(i)}
          className="w-[4px] h-[4px] border border-white/20 transition-all duration-300 cursor-pointer"
          style={
            i === active
              ? {
                  backgroundColor: '#FF0CB6',
                  boxShadow: '0 0 8px rgba(255,12,182,0.6)',
                  borderColor: '#FF0CB6',
                }
              : {}
          }
          aria-label={`Go to section ${i + 1}`}
        />
      ))}
    </div>
  )
}
