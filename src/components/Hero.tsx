import { useEffect, useRef } from 'react'

export default function Hero() {
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
      const count = Math.min(40, Math.floor((w * h) / 25000))
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          size: Math.random() * 1.2 + 0.5,
          opacity: Math.random() * 0.4 + 0.2,
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
    <div className="w-full h-full flex items-center justify-center relative">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="relative z-10 text-center px-6">
        <h1 className="font-['Poppins'] text-[48px] sm:text-[64px] md:text-[80px] font-bold tracking-tight text-white uppercase leading-none">
          DANCEFLOOR
        </h1>
        <p
          className="mt-4 font-['Poppins'] text-[18px] md:text-[24px] font-semibold tracking-wider text-[#FF0CB6]"
          style={{ textShadow: '0 0 20px rgba(255,12,182,0.5)' }}
        >
          OVER 4.5 BILLION PEOPLE. ONE NIGHT.
        </p>
        <p className="mt-3 font-['Poppins'] text-[14px] font-normal tracking-[0.2em] text-white/60 uppercase">
          by HOTTR
        </p>
        <button
          onClick={() => {
            const section = document.querySelector('[data-section="4"]')
            if (section) section.scrollIntoView({ behavior: 'smooth' })
          }}
          className="cta-pulse mt-10 inline-block rounded-sm bg-[#FF0CB6] px-8 py-4 font-['Poppins'] text-[14px] font-semibold uppercase tracking-[0.15em] text-white transition-all duration-300 hover:bg-[#ff4dcc]"
        >
          LISTEN NOW
        </button>
      </div>
    </div>
  )
}
