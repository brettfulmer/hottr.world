import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { FeatureCollection, Geometry, Position } from 'geojson'
import type { Language } from '../data/languages'

const RADIUS = 2
const PI2 = Math.PI * 2
const CW = 2048
const CH = 1024
const SPIN_SPEED = 0.002
const DOT_STEP = 6

const ALIASES: Record<string, string[]> = {
  'United States of America': ['United States', 'USA', 'United States (60M+ Spanish speakers)'],
  'United Kingdom': ['United Kingdom', 'UK'],
  'South Korea': ['South Korea'],
  'North Korea': ['North Korea'],
  'Democratic Republic of the Congo': ['DR Congo'],
  'Republic of the Congo': ['Republic of Congo'],
  "Côte d'Ivoire": ['Ivory Coast'],
  'Czechia': ['Czech Republic'],
  'Turkey': ['Turkey', 'Türkiye'],
  'Taiwan': ['Taiwan'],
}

function matchesCountry(geoName: string, langCountries: string[]): boolean {
  for (const c of langCountries) {
    if (geoName === c) return true
    if (c.includes('(') && geoName.startsWith(c.split('(')[0].trim())) return true
  }
  const aliases = ALIASES[geoName]
  if (aliases) {
    for (const a of aliases) {
      for (const c of langCountries) {
        if (c === a || c.startsWith(a)) return true
      }
    }
  }
  return false
}

function pointInRing(px: number, py: number, ring: Position[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

interface DotInfo { x: number; y: number; isLand: boolean; countryName: string }
interface Props { selected: Language }

export default function Globe3D({ selected }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const globeRef = useRef<THREE.Group | null>(null)
  const baseTextureRef = useRef<THREE.CanvasTexture | null>(null)
  const hlCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const hlTextureRef = useRef<THREE.CanvasTexture | null>(null)
  const sparkleCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const sparkleTextureRef = useRef<THREE.CanvasTexture | null>(null)
  const dotsRef = useRef<DotInfo[]>([])
  const atmoMatRef = useRef<THREE.ShaderMaterial | null>(null)
  const glowFlash = useRef(0)
  const rafId = useRef(0)
  const sparkleTimer = useRef(0)

  const buildDotGrid = useCallback((geo: FeatureCollection) => {
    const dots: DotInfo[] = []
    const features = geo.features.map(f => {
      const name = (f.properties as Record<string, string>)?.name || ''
      const geom = f.geometry as Geometry
      const rings: Position[][] = []
      if (geom.type === 'Polygon') rings.push(...geom.coordinates)
      else if (geom.type === 'MultiPolygon') for (const p of geom.coordinates) rings.push(...p)
      return { name, rings }
    })
    for (let py = 0; py < CH; py += DOT_STEP) {
      for (let px = 0; px < CW; px += DOT_STEP) {
        const lng = (px / CW) * 360 - 180
        const lat = 90 - (py / CH) * 180
        let country = ''
        for (const f of features) {
          for (const ring of f.rings) {
            if (pointInRing(lng, lat, ring)) { country = f.name; break }
          }
          if (country) break
        }
        dots.push({
          x: px + (Math.random() - 0.5) * 2,
          y: py + (Math.random() - 0.5) * 2,
          isLand: !!country, countryName: country,
        })
      }
    }
    dotsRef.current = dots
  }, [])

  // Base texture: 3 colors only — BLACK (ocean), WHITE (land), sparkle
  const drawBaseMap = useCallback(() => {
    const canvas = document.createElement('canvas')
    canvas.width = CW; canvas.height = CH
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, CW, CH)

    for (const dot of dotsRef.current) {
      if (dot.isLand) {
        // White mirror tile — random brightness for sparkle facet effect
        const b = 0.5 + Math.random() * 0.5
        const v = Math.floor(255 * b)
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, 2.2, 0, PI2)
        ctx.fillStyle = `rgb(${v},${v},${v})`
        ctx.fill()
      } else {
        // Black mirror tile — very subtle, just enough to show it's a faceted surface
        const b = Math.random() * 0.12
        const v = Math.floor(255 * b)
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, 1.8, 0, PI2)
        ctx.fillStyle = `rgb(${v},${v},${v})`
        ctx.fill()
      }
    }

    // Scattered sparkle highlights on land — pure white bright flashes
    const landDots = dotsRef.current.filter(d => d.isLand)
    for (let i = 0; i < 400; i++) {
      const d = landDots[Math.floor(Math.random() * landDots.length)]
      if (!d) continue
      ctx.beginPath()
      ctx.arc(d.x + (Math.random() - 0.5) * 3, d.y + (Math.random() - 0.5) * 3, 0.6 + Math.random() * 0.4, 0, PI2)
      ctx.fillStyle = '#FFFFFF'
      ctx.fill()
    }

    return canvas
  }, [])

  const updateHighlights = useCallback((lang: Language) => {
    const canvas = hlCanvasRef.current
    const texture = hlTextureRef.current
    if (!canvas || !texture) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, CW, CH)
    const dots = dotsRef.current
    if (!dots.length) return

    if (lang.isIndigenous) {
      // Kriol: pink variations across Australia
      const pinks = ['#FF0CB6', '#ff4dcc', '#ff8ce0', '#b30880']
      for (const d of dots) {
        if (d.countryName !== 'Australia') continue
        ctx.beginPath()
        ctx.arc(d.x, d.y, 2.6, 0, PI2)
        ctx.fillStyle = pinks[Math.floor(Math.random() * pinks.length)]
        ctx.globalAlpha = 0.5 + Math.random() * 0.45
        ctx.fill()
      }
      ctx.globalAlpha = 1
    } else {
      for (const d of dots) {
        if (!d.isLand || !matchesCountry(d.countryName, lang.countries)) continue
        const bright = Math.random()
        ctx.beginPath()
        ctx.arc(d.x, d.y, bright > 0.85 ? 3.0 : 2.3, 0, PI2)
        ctx.fillStyle = `rgba(255,12,182,${0.6 + bright * 0.4})`
        ctx.fill()
      }
    }
    texture.needsUpdate = true
  }, [])

  // Sparkle: random bright flashes across ALL tiles — the mirror ball catching light
  const updateSparkles = useCallback(() => {
    const canvas = sparkleCanvasRef.current
    const texture = sparkleTextureRef.current
    if (!canvas || !texture) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, CW, CH)
    const dots = dotsRef.current
    if (!dots.length) return

    for (let i = 0; i < 15; i++) {
      const d = dots[Math.floor(Math.random() * dots.length)]
      if (!d) continue
      const isPink = d.isLand && Math.random() > 0.5
      ctx.beginPath()
      ctx.arc(d.x, d.y, 1.5 + Math.random() * 2, 0, PI2)
      ctx.fillStyle = isPink ? '#FF0CB6' : '#FFFFFF'
      ctx.globalAlpha = 0.4 + Math.random() * 0.6
      ctx.fill()
    }
    ctx.globalAlpha = 1
    texture.needsUpdate = true
  }, [])

  const loadGeoData = useCallback(async () => {
    try {
      const topoModule = await import('world-atlas/countries-110m.json')
      const topo = topoModule.default as unknown as Topology<{ countries: GeometryCollection }>
      const geo = feature(topo, topo.objects.countries) as FeatureCollection
      buildDotGrid(geo)
      const baseCanvas = drawBaseMap()
      if (baseTextureRef.current) {
        baseTextureRef.current.image = baseCanvas
        baseTextureRef.current.needsUpdate = true
      }
      updateHighlights(selected)
    } catch { /* graceful */ }
  }, [buildDotGrid, drawBaseMap, updateHighlights])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const w = container.clientWidth, h = container.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
    camera.position.z = 5.0

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const globe = new THREE.Group()
    globeRef.current = globe
    scene.add(globe)

    // Base sphere
    const pCanvas = document.createElement('canvas')
    pCanvas.width = CW; pCanvas.height = CH
    const pctx = pCanvas.getContext('2d')!
    pctx.fillStyle = '#000'
    pctx.fillRect(0, 0, CW, CH)
    const baseTex = new THREE.CanvasTexture(pCanvas)
    baseTex.colorSpace = THREE.SRGBColorSpace
    baseTextureRef.current = baseTex
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(RADIUS, 96, 96), new THREE.MeshBasicMaterial({ map: baseTex })))

    // Highlight overlay
    const hlCanvas = document.createElement('canvas')
    hlCanvas.width = CW; hlCanvas.height = CH
    hlCanvasRef.current = hlCanvas
    const hlTex = new THREE.CanvasTexture(hlCanvas)
    hlTextureRef.current = hlTex
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS + 0.003, 96, 96),
      new THREE.MeshBasicMaterial({ map: hlTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    ))

    // Sparkle overlay
    const sparkCanvas = document.createElement('canvas')
    sparkCanvas.width = CW; sparkCanvas.height = CH
    sparkleCanvasRef.current = sparkCanvas
    const sparkTex = new THREE.CanvasTexture(sparkCanvas)
    sparkleTextureRef.current = sparkTex
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS + 0.006, 96, 96),
      new THREE.MeshBasicMaterial({ map: sparkTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    ))

    // Inner rim shadow
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS + 0.01, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `varying vec3 vNormal; void main() { float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0))); float edge = smoothstep(0.35, 1.0, rim); gl_FragColor = vec4(0.0, 0.0, 0.0, edge * 0.5); }`,
        transparent: true, depthWrite: false, side: THREE.FrontSide,
      })
    ))

    // Pink atmosphere — NO spotlight
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec3 vNormal; uniform float uOpacity; void main() { float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0); gl_FragColor = vec4(1.0, 0.047, 0.714, 1.0) * intensity * uOpacity; }`,
      uniforms: { uOpacity: { value: 0.5 } },
      side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    })
    atmoMatRef.current = atmoMat
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 1.1, 64, 64), atmoMat))

    loadGeoData()

    const animate = () => {
      rafId.current = requestAnimationFrame(animate)
      const now = Date.now()
      const t = now * 0.001
      globe.rotation.y += SPIN_SPEED

      const basePulse = 0.12 * Math.sin(t * (PI2 / 3.5)) + 0.4
      if (glowFlash.current > 0) {
        glowFlash.current *= 0.96
        if (glowFlash.current < 0.01) glowFlash.current = 0
      }
      atmoMat.uniforms.uOpacity.value = basePulse + glowFlash.current

      if (now - sparkleTimer.current > 180) {
        sparkleTimer.current = now
        updateSparkles()
      }
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const nw = container.clientWidth, nh = container.clientHeight
      camera.aspect = nw / nh; camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId.current)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [])

  useEffect(() => {
    updateHighlights(selected)
    glowFlash.current = 1.5
  }, [selected, updateHighlights])

  return <div ref={containerRef} className="w-full h-full" style={{ pointerEvents: 'none' }} />
}
