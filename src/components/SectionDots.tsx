import { useEffect, useState, useRef } from 'react'

const SECTION_COUNT = 5

export default function SectionDots() {
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(true)
  const hideTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const sections = document.querySelectorAll('[data-section]')
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.section)
            setActive(idx)
          }
        })
      },
      { threshold: 0.5 }
    )

    sections.forEach((s) => observer.observe(s))

    const showDots = () => {
      setVisible(true)
      if (hideTimeout.current) clearTimeout(hideTimeout.current)
      hideTimeout.current = setTimeout(() => setVisible(false), 3000)
    }

    window.addEventListener('scroll', showDots, { passive: true })
    showDots()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', showDots)
      if (hideTimeout.current) clearTimeout(hideTimeout.current)
    }
  }, [])

  const scrollTo = (idx: number) => {
    const section = document.querySelector(`[data-section="${idx}"]`)
    if (section) section.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {Array.from({ length: SECTION_COUNT }).map((_, i) => (
        <button
          key={i}
          onClick={() => scrollTo(i)}
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
