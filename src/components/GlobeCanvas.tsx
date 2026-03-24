import { useEffect, useRef } from 'react'
import { continents, type City } from '../data/cities'

const DEG = Math.PI / 180

function project(
  lon: number,
  lat: number,
  centerLon: number,
  centerLat: number,
  cx: number,
  cy: number,
  R: number,
): [number, number, boolean] {
  const λ = lon * DEG
  const φ = lat * DEG
  const λ0 = centerLon * DEG
  const φ0 = centerLat * DEG

  const cosC =
    Math.sin(φ0) * Math.sin(φ) +
    Math.cos(φ0) * Math.cos(φ) * Math.cos(λ - λ0)

  if (cosC < 0) return [0, 0, false]

  const x = cx + R * Math.cos(φ) * Math.sin(λ - λ0)
  const y =
    cy -
    R *
      (Math.cos(φ0) * Math.sin(φ) -
        Math.sin(φ0) * Math.cos(φ) * Math.cos(λ - λ0))

  return [x, y, true]
}

interface Props {
  activeCity: City
  targetLon: number
  targetLat: number
  width: number
  height: number
}

export default function GlobeCanvas({ activeCity, targetLon, targetLat, width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const currentCenter = useRef({ lon: targetLon, lat: targetLat })
  const time = useRef(0)
  const isVisible = useRef(true)
  const isInViewport = useRef(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const onVisibilityChange = () => {
      isVisible.current = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    const observer = new IntersectionObserver(
      ([entry]) => { isInViewport.current = entry.isIntersecting },
      { threshold: 0 },
    )
    observer.observe(canvas)

    const draw = () => {
      if (!isVisible.current || !isInViewport.current) {
        animRef.current = requestAnimationFrame(draw)
        return
      }
      if (!prefersReducedMotion) {
        time.current += 0.016
      }

      // Smooth interpolation toward target
      const ease = 0.04
      currentCenter.current.lon += (targetLon - currentCenter.current.lon) * ease
      currentCenter.current.lat += (targetLat - currentCenter.current.lat) * ease

      const cLon = currentCenter.current.lon
      const cLat = currentCenter.current.lat
      const cx = width / 2
      const cy = height / 2
      const R = Math.min(width, height) / 2 - 4

      ctx.clearRect(0, 0, width, height)

      // Globe background with subtle gradient
      const bg = ctx.createRadialGradient(cx - R * 0.15, cy - R * 0.15, 0, cx, cy, R)
      bg.addColorStop(0, 'rgba(30, 32, 36, 0.6)')
      bg.addColorStop(0.7, 'rgba(15, 16, 18, 0.5)')
      bg.addColorStop(1, 'rgba(5, 6, 8, 0.4)')
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fillStyle = bg
      ctx.fill()

      // Outer ring glow
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Clip to globe
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.clip()

      // Grid: latitude lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
      ctx.lineWidth = 0.5
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath()
        let started = false
        for (let lon = -180; lon <= 180; lon += 3) {
          const [x, y, vis] = project(lon, lat, cLon, cLat, cx, cy, R)
          if (vis) {
            if (!started) { ctx.moveTo(x, y); started = true }
            else ctx.lineTo(x, y)
          } else {
            started = false
          }
        }
        ctx.stroke()
      }

      // Grid: longitude lines
      for (let lon = -180; lon < 180; lon += 30) {
        ctx.beginPath()
        let started = false
        for (let lat = -90; lat <= 90; lat += 3) {
          const [x, y, vis] = project(lon, lat, cLon, cLat, cx, cy, R)
          if (vis) {
            if (!started) { ctx.moveTo(x, y); started = true }
            else ctx.lineTo(x, y)
          } else {
            started = false
          }
        }
        ctx.stroke()
      }

      // Draw continent outlines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
      ctx.lineWidth = 1
      for (const outline of continents) {
        ctx.beginPath()
        let started = false
        for (const [lon, lat] of outline) {
          const [x, y, vis] = project(lon, lat, cLon, cLat, cx, cy, R)
          if (vis) {
            if (!started) { ctx.moveTo(x, y); started = true }
            else ctx.lineTo(x, y)
          } else {
            started = false
          }
        }
        ctx.stroke()
      }

      // Fill continents faintly — split into visible segments to avoid horizon-bridging artifacts
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
      for (const outline of continents) {
        let pathOpen = false
        for (const [lon, lat] of outline) {
          const [x, y, vis] = project(lon, lat, cLon, cLat, cx, cy, R)
          if (vis) {
            if (!pathOpen) { ctx.beginPath(); ctx.moveTo(x, y); pathOpen = true }
            else ctx.lineTo(x, y)
          } else {
            if (pathOpen) { ctx.closePath(); ctx.fill(); pathOpen = false }
          }
        }
        if (pathOpen) { ctx.closePath(); ctx.fill() }
      }

      // Highlight active country regions with pink glow
      for (const region of activeCity.regions) {
        const [px, py, vis] = project(region.lng, region.lat, cLon, cLat, cx, cy, R)
        if (vis) {
          const glowR = (region.radius / 90) * R * 1.8
          const pulse = 1 + 0.1 * Math.sin(time.current * 2)
          const glow = ctx.createRadialGradient(px, py, 0, px, py, glowR * pulse)
          glow.addColorStop(0, 'rgba(255, 12, 182, 0.55)')
          glow.addColorStop(0.3, 'rgba(255, 12, 182, 0.25)')
          glow.addColorStop(0.6, 'rgba(255, 12, 182, 0.08)')
          glow.addColorStop(1, 'rgba(255, 12, 182, 0)')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(px, py, glowR * pulse, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Draw city dot
      const [dotX, dotY, dotVis] = project(activeCity.lng, activeCity.lat, cLon, cLat, cx, cy, R)
      if (dotVis) {
        const dotPulse = 1 + 0.3 * Math.sin(time.current * 3)

        // Outer glow
        const dotGlow = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 12 * dotPulse)
        dotGlow.addColorStop(0, 'rgba(255, 12, 182, 0.8)')
        dotGlow.addColorStop(0.5, 'rgba(255, 12, 182, 0.2)')
        dotGlow.addColorStop(1, 'rgba(255, 12, 182, 0)')
        ctx.fillStyle = dotGlow
        ctx.beginPath()
        ctx.arc(dotX, dotY, 12 * dotPulse, 0, Math.PI * 2)
        ctx.fill()

        // Core dot
        ctx.fillStyle = '#FF0CB6'
        ctx.beginPath()
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2)
        ctx.fill()

        // White center
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.beginPath()
        ctx.arc(dotX, dotY, 1.2, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animRef.current)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      observer.disconnect()
    }
  }, [activeCity, targetLon, targetLat, width, height])

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="pointer-events-none"
    />
  )
}
