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
const DOT_STEP = 6 // pixels between dots on canvas

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

// Point-in-polygon (ray casting) for a single ring
function pointInRing(px: number, py: number, ring: Position[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

interface LandPoint {
  x: number
  y: number
  countryName: string
}

interface Props {
  selected: Language
}

export default function Globe3D({ selected }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const globeRef = useRef<THREE.Group | null>(null)
  const baseTextureRef = useRef<THREE.CanvasTexture | null>(null)
  const hlCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const hlTextureRef = useRef<THREE.CanvasTexture | null>(null)
  const sparkleCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const sparkleTextureRef = useRef<THREE.CanvasTexture | null>(null)
  const landPointsRef = useRef<LandPoint[]>([])
  const allDotsRef = useRef<{ x: number; y: number; isLand: boolean }[]>([])
  const atmoMatRef = useRef<THREE.ShaderMaterial | null>(null)
  const glowFlash = useRef(0)
  const rafId = useRef(0)
  const sparkleTimer = useRef(0)

  // Build land mask and dot grid from GeoJSON
  const buildLandData = useCallback((geo: FeatureCollection) => {
    const landPoints: LandPoint[] = []
    const allDots: { x: number; y: number; isLand: boolean }[] = []

    // Build a spatial index of features for faster lookups
    const features = geo.features.map(f => {
      const name = (f.properties as Record<string, string>)?.name || ''
      const geom = f.geometry as Geometry
      const rings: Position[][] = []
      if (geom.type === 'Polygon') rings.push(...geom.coordinates)
      else if (geom.type === 'MultiPolygon') for (const p of geom.coordinates) rings.push(...p)
      return { name, rings }
    })

    // Iterate grid
    for (let py = 0; py < CH; py += DOT_STEP) {
      for (let px = 0; px < CW; px += DOT_STEP) {
        const lng = (px / CW) * 360 - 180
        const lat = 90 - (py / CH) * 180

        let foundCountry = ''
        for (const f of features) {
          for (const ring of f.rings) {
            if (pointInRing(lng, lat, ring)) {
              foundCountry = f.name
              break
            }
          }
          if (foundCountry) break
        }

        const jx = px + (Math.random() - 0.5) * 3
        const jy = py + (Math.random() - 0.5) * 3

        if (foundCountry) {
          landPoints.push({ x: jx, y: jy, countryName: foundCountry })
          allDots.push({ x: jx, y: jy, isLand: true })
        } else {
          allDots.push({ x: jx, y: jy, isLand: false })
        }
      }
    }

    landPointsRef.current = landPoints
    allDotsRef.current = allDots
  }, [])

  // Draw base disco ball texture
  const drawBaseMap = useCallback(() => {
    const canvas = document.createElement('canvas')
    canvas.width = CW
    canvas.height = CH
    const ctx = canvas.getContext('2d')!

    // Near-black background
    ctx.fillStyle = '#030305'
    ctx.fillRect(0, 0, CW, CH)

    const allDots = allDotsRef.current

    for (const dot of allDots) {
      if (dot.isLand) {
        // Land = white/silver mirror dots
        const brightness = 0.55 + Math.random() * 0.35
        const v = Math.floor(180 * brightness + 30)
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, 2.2, 0, PI2)
        ctx.fillStyle = `rgba(${v + 10},${v + 15},${v + 20},${brightness})`
        ctx.fill()
      } else {
        // Ocean = tiny dark dots
        const brightness = 0.25 + Math.random() * 0.15
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, 1.4, 0, PI2)
        ctx.fillStyle = `rgba(25,25,40,${brightness})`
        ctx.fill()
      }
    }

    // Sparkle accents on land
    const landPoints = landPointsRef.current
    for (let i = 0; i < 300; i++) {
      const lp = landPoints[Math.floor(Math.random() * landPoints.length)]
      if (!lp) continue
      ctx.beginPath()
      ctx.arc(lp.x + (Math.random() - 0.5) * 4, lp.y + (Math.random() - 0.5) * 4, 1, 0, PI2)
      ctx.fillStyle = `rgba(255,255,255,${0.7 + Math.random() * 0.3})`
      ctx.fill()
    }

    return canvas
  }, [])

  // Highlight countries for selected language
  const updateHighlights = useCallback((lang: Language) => {
    const canvas = hlCanvasRef.current
    const texture = hlTextureRef.current
    if (!canvas || !texture) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, CW, CH)

    const landPoints = landPointsRef.current
    if (!landPoints.length) return

    if (lang.isIndigenous) {
      // Kriol: pink variations across Australia
      const pinks = ['#FF0CB6', '#ff4dcc', '#ff8ce0', '#b30880']
      for (const lp of landPoints) {
        if (lp.countryName !== 'Australia') continue
        const color = pinks[Math.floor(Math.random() * pinks.length)]
        ctx.beginPath()
        ctx.arc(lp.x, lp.y, 2.8, 0, PI2)
        ctx.fillStyle = color
        ctx.globalAlpha = 0.5 + Math.random() * 0.4
        ctx.fill()
      }
      ctx.globalAlpha = 1
    } else {
      // Standard: pink mirror dots for matching countries
      ctx.shadowColor = 'rgba(255,12,182,0.8)'
      ctx.shadowBlur = 6

      for (const lp of landPoints) {
        if (!matchesCountry(lp.countryName, lang.countries)) continue
        const bright = Math.random()
        const r = bright > 0.9 ? 3.2 : 2.5
        const alpha = 0.6 + bright * 0.4
        ctx.beginPath()
        ctx.arc(lp.x, lp.y, r, 0, PI2)
        ctx.fillStyle = `rgba(255,12,182,${alpha})`
        ctx.fill()
      }
      ctx.shadowBlur = 0
    }
    texture.needsUpdate = true
  }, [])

  // Animated sparkle layer
  const updateSparkles = useCallback(() => {
    const canvas = sparkleCanvasRef.current
    const texture = sparkleTextureRef.current
    if (!canvas || !texture) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, CW, CH)

    const landPoints = landPointsRef.current
    if (!landPoints.length) return

    // Place 8 random bright flashes on land
    for (let i = 0; i < 8; i++) {
      const lp = landPoints[Math.floor(Math.random() * landPoints.length)]
      if (!lp) continue
      const isPink = Math.random() > 0.6
      ctx.beginPath()
      ctx.arc(lp.x + (Math.random() - 0.5) * 6, lp.y + (Math.random() - 0.5) * 6, 2 + Math.random() * 1.5, 0, PI2)
      ctx.fillStyle = isPink ? `rgba(255,12,182,${0.8 + Math.random() * 0.2})` : `rgba(255,255,255,${0.8 + Math.random() * 0.2})`
      ctx.fill()
    }
    texture.needsUpdate = true
  }, [])

  // Load GeoJSON and init everything
  const loadGeoData = useCallback(async () => {
    try {
      const topoModule = await import('world-atlas/countries-110m.json')
      const topo = topoModule.default as unknown as Topology<{ countries: GeometryCollection }>
      const geo = feature(topo, topo.objects.countries) as FeatureCollection

      // Build land data
      buildLandData(geo)

      // Draw base texture
      const baseCanvas = drawBaseMap()
      if (baseTextureRef.current) {
        baseTextureRef.current.image = baseCanvas
        baseTextureRef.current.needsUpdate = true
      }

      // Draw initial highlights
      updateHighlights(selected)
    } catch { /* graceful fallback */ }
  }, [buildLandData, drawBaseMap, updateHighlights])

  // Three.js scene setup
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const w = container.clientWidth
    const h = container.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
    camera.position.z = 5.2

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const globe = new THREE.Group()
    globeRef.current = globe
    scene.add(globe)

    // Base sphere — placeholder dark until GeoJSON loads
    const placeholderCanvas = document.createElement('canvas')
    placeholderCanvas.width = CW
    placeholderCanvas.height = CH
    const pctx = placeholderCanvas.getContext('2d')!
    pctx.fillStyle = '#030305'
    pctx.fillRect(0, 0, CW, CH)

    const baseTex = new THREE.CanvasTexture(placeholderCanvas)
    baseTex.colorSpace = THREE.SRGBColorSpace
    baseTextureRef.current = baseTex
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 96, 96),
      new THREE.MeshBasicMaterial({ map: baseTex })
    ))

    // Highlight overlay sphere
    const hlCanvas = document.createElement('canvas')
    hlCanvas.width = CW
    hlCanvas.height = CH
    hlCanvasRef.current = hlCanvas
    const hlTex = new THREE.CanvasTexture(hlCanvas)
    hlTextureRef.current = hlTex
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS + 0.003, 96, 96),
      new THREE.MeshBasicMaterial({ map: hlTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    ))

    // Sparkle overlay sphere
    const sparkCanvas = document.createElement('canvas')
    sparkCanvas.width = CW
    sparkCanvas.height = CH
    sparkleCanvasRef.current = sparkCanvas
    const sparkTex = new THREE.CanvasTexture(sparkCanvas)
    sparkleTextureRef.current = sparkTex
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS + 0.006, 96, 96),
      new THREE.MeshBasicMaterial({ map: sparkTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    ))

    // Inner rim shadow for glass depth
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS + 0.009, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `varying vec3 vNormal; void main() { float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0))); float edge = smoothstep(0.4, 1.0, rim); gl_FragColor = vec4(0.0, 0.0, 0.0, edge * 0.5); }`,
        transparent: true, depthWrite: false, side: THREE.FrontSide,
      })
    ))

    // Pink atmosphere glow
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec3 vNormal; uniform float uOpacity; void main() { float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0); gl_FragColor = vec4(1.0, 0.047, 0.714, 1.0) * intensity * uOpacity; }`,
      uniforms: { uOpacity: { value: 0.5 } },
      side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    })
    atmoMatRef.current = atmoMat
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 1.12, 64, 64), atmoMat))

    loadGeoData()

    // Animation loop
    const animate = () => {
      rafId.current = requestAnimationFrame(animate)
      const now = Date.now()

      // Constant spin
      globe.rotation.y += SPIN_SPEED

      // Atmosphere pulse + glow flash
      const basePulse = 0.15 * Math.sin(now * 0.001 * (PI2 / 3.5)) + 0.45
      if (glowFlash.current > 0) {
        glowFlash.current *= 0.96
        if (glowFlash.current < 0.01) glowFlash.current = 0
      }
      atmoMat.uniforms.uOpacity.value = basePulse + glowFlash.current

      // Update sparkles every ~200ms
      if (now - sparkleTimer.current > 200) {
        sparkleTimer.current = now
        updateSparkles()
      }

      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const nw = container.clientWidth, nh = container.clientHeight
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
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

  // Language change → flash + update highlights
  useEffect(() => {
    updateHighlights(selected)
    glowFlash.current = 1.5
  }, [selected, updateHighlights])

  return <div ref={containerRef} className="w-full h-full" style={{ pointerEvents: 'none' }} />
}
