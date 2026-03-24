import { useEffect, useRef } from 'react'
import { useSectionReveal } from '../hooks/useSectionReveal'

export default function Hero() {
  const sectionRef = useSectionReveal<HTMLElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = []

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const logicalWidth = window.innerWidth
      const logicalHeight = window.innerHeight
      canvas.width = logicalWidth * dpr
      canvas.height = logicalHeight * dpr
      canvas.style.width = `${logicalWidth}px`
      canvas.style.height = `${logicalHeight}px`
    }

    const getLogicalSize = () => ({
      w: canvas.width / (window.devicePixelRatio || 1),
      h: canvas.height / (window.devicePixelRatio || 1),
    })

    const initParticles = () => {
      particles = []
      const { w, h } = getLogicalSize()
      const count = Math.floor((w * h) / 18000)
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          size: Math.random() * 1.2 + 0.3,
          opacity: Math.random() * 0.4 + 0.05,
        })
      }
    }

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const { w, h } = getLogicalSize()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 12, 182, ${p.opacity})`
        ctx.fill()
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 80) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(255, 12, 182, ${0.04 * (1 - dist / 80)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animationId = requestAnimationFrame(draw)
    }

    resize()
    initParticles()
    draw()

    const onResize = () => { resize(); initParticles() }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <section ref={sectionRef} data-section="0" className="snap-section flex items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0" style={{ zIndex: 0 }} />
      <div className="section-content relative z-10 text-center px-6">
        <h1 className="font-['Poppins'] text-6xl font-bold tracking-tight text-white uppercase sm:text-7xl md:text-8xl lg:text-9xl">
          DANCEFLOOR
        </h1>
        <p
          className="mt-4 font-['Poppins'] text-lg tracking-widest text-white/70 sm:text-xl md:text-2xl"
          style={{ textShadow: '0 0 16px rgba(255,12,182,0.4)' }}
        >
          30 LANGUAGES. ONE NIGHT.
        </p>
        <p className="mt-3 font-['Poppins'] text-sm tracking-wider text-white/50 sm:text-base">
          by HOTTR
        </p>
        <button
          onClick={() => {
            const section = document.querySelector('[data-section="4"]')
            if (section) section.scrollIntoView({ behavior: 'smooth' })
          }}
          className="cta-pulse mt-10 inline-block rounded-sm bg-[#FF0CB6] px-10 py-4 font-['Poppins'] text-sm font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#ff4dcc]"
        >
          LISTEN NOW
        </button>
      </div>
    </section>
  )
}
