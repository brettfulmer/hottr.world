import { useEffect, useRef } from 'react'

export function useSectionReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const content = el.querySelector('.section-content') as HTMLElement | null
    if (!content) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          content.classList.add('visible')
        } else {
          content.classList.remove('visible')
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}
