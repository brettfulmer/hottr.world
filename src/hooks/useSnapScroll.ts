import { useEffect, useRef, useState, useCallback } from 'react'

export function useSnapScroll(sectionCount: number) {
  const [activeSection, setActiveSection] = useState(0)
  const cooldown = useRef(false)
  const touchStart = useRef(0)

  const goTo = useCallback((idx: number) => {
    if (idx < 0 || idx >= sectionCount || cooldown.current) return
    cooldown.current = true
    setActiveSection(idx)
    setTimeout(() => { cooldown.current = false }, 800)
  }, [sectionCount])

  const next = useCallback(() => goTo(activeSection + 1), [activeSection, goTo])
  const prev = useCallback(() => goTo(activeSection - 1), [activeSection, goTo])

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (cooldown.current) return
      if (Math.abs(e.deltaY) < 10) return
      if (e.deltaY > 0) next()
      else prev()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); next() }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); prev() }
    }

    const onTouchStart = (e: TouchEvent) => {
      touchStart.current = e.touches[0].clientY
    }

    const onTouchEnd = (e: TouchEvent) => {
      const delta = touchStart.current - e.changedTouches[0].clientY
      if (Math.abs(delta) < 50) return
      if (delta > 0) next()
      else prev()
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [next, prev])

  return { activeSection, goTo }
}
