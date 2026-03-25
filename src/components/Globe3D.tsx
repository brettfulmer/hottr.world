import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { FeatureCollection, Feature, Geometry, Position } from 'geojson'
import type { Language } from '../data/languages'

const RADIUS = 2
const PI2 = Math.PI * 2
const CW = 4096
const CH = 2048

const ALIASES: Record<string, string[]> = {
  'United States of America': ['United States','USA','United States (60M+ Spanish speakers)'],
  'United Kingdom': ['United Kingdom','UK'],
  'South Korea': ['South Korea'],
  'North Korea': ['North Korea'],
  'Democratic Republic of the Congo': ['DR Congo'],
  'Republic of the Congo': ['Republic of Congo'],
  "Côte d'Ivoire": ['Ivory Coast'],
  'Czechia': ['Czech Republic'],
  'Turkey': ['Turkey','Türkiye'],
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

function drawRing(ctx: CanvasRenderingContext2D, coords: Position[], w: number, h: number) {
  ctx.beginPath()
  let prevX = -1
  for (let i = 0; i < coords.length; i++) {
    const [lng, lat] = coords[i]
    const x = ((lng + 180) / 360) * w
    const y = ((90 - lat) / 180) * h
    // Break path at dateline wrap
    if (i > 0 && Math.abs(x - prevX) > w * 0.5) {
      ctx.moveTo(x, y)
    } else if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
    prevX = x
  }
  ctx.closePath()
}

function drawFeature(ctx: CanvasRenderingContext2D, feat: Feature, w: number, h: number, fill: boolean) {
  const geom = feat.geometry as Geometry
  const rings: Position[][] = []
  if (geom.type === 'Polygon') rings.push(...geom.coordinates)
  else if (geom.type === 'MultiPolygon') for (const p of geom.coordinates) rings.push(...p)
  for (const ring of rings) {
    drawRing(ctx, ring, w, h)
    if (fill) ctx.fill()
    ctx.stroke()
  }
}

interface Props {
  selected: Language
}

export default function Globe3D({ selected }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const globeRef = useRef<THREE.Group | null>(null)
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const baseTextureRef = useRef<THREE.CanvasTexture | null>(null)
  const hlCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const hlTextureRef = useRef<THREE.CanvasTexture | null>(null)
  const geoDataRef = useRef<FeatureCollection | null>(null)
  const dotsGroupRef = useRef<THREE.Group | null>(null)
  const isDragging = useRef(false)
  const prevMouse = useRef({ x: 0, y: 0 })
  const velocity = useRef(0.0008) // gentle initial spin
  const currentRotY = useRef(0)
  const rafId = useRef(0)

  // Draw the base globe texture — traditional globe look
  const drawBaseMap = useCallback((geo: FeatureCollection) => {
    const canvas = baseCanvasRef.current
    const texture = baseTextureRef.current
    if (!canvas || !texture) return
    const ctx = canvas.getContext('2d')!
    const w = CW, h = CH

    // Deep dark ocean
    ctx.fillStyle = '#060810'
    ctx.fillRect(0, 0, w, h)

    // Subtle ocean gradient (darker at poles)
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, 'rgba(0,0,0,0.3)')
    grad.addColorStop(0.3, 'rgba(0,0,0,0)')
    grad.addColorStop(0.7, 'rgba(0,0,0,0)')
    grad.addColorStop(1, 'rgba(0,0,0,0.3)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Grid lines — latitude (horizontal)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
    ctx.lineWidth = 1
    for (let lat = -60; lat <= 60; lat += 15) {
      const y = ((90 - lat) / 180) * h
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }

    // Grid lines — longitude (vertical)
    for (let lng = -180; lng < 180; lng += 15) {
      const x = ((lng + 180) / 360) * w
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
    }

    // Equator — pink accent
    const eqY = h / 2
    ctx.strokeStyle = 'rgba(255, 12, 182, 0.12)'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(0, eqY); ctx.lineTo(w, eqY); ctx.stroke()

    // Country landmasses — filled + outlined
    // Fill (subtle dark land)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)'
    ctx.lineWidth = 1.2
    for (const feat of geo.features) {
      drawFeature(ctx, feat, w, h, true)
    }

    // Second pass — brighter borders for definition
    ctx.fillStyle = 'transparent'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.13)'
    ctx.lineWidth = 0.6
    for (const feat of geo.features) {
      drawFeature(ctx, feat, w, h, false)
    }

    texture.needsUpdate = true
  }, [])

  // Highlight countries for selected language
  const updateHighlights = useCallback((lang: Language) => {
    const canvas = hlCanvasRef.current
    const texture = hlTextureRef.current
    const geo = geoDataRef.current
    if (!canvas || !texture) return
    const ctx = canvas.getContext('2d')!
    const w = CW, h = CH
    ctx.clearRect(0, 0, w, h)

    if (lang.isIndigenous) {
      drawKriolOverlay(ctx, w, h, lang)
    } else if (geo) {
      // Filled pink highlight
      ctx.fillStyle = 'rgba(255, 12, 182, 0.30)'
      ctx.strokeStyle = 'rgba(255, 12, 182, 0.70)'
      ctx.lineWidth = 2

      for (const feat of geo.features) {
        const name = (feat.properties as Record<string, string>)?.name || ''
        if (!matchesCountry(name, lang.countries)) continue
        drawFeature(ctx, feat, w, h, true)
      }

      // Second pass — brighter glow border
      ctx.fillStyle = 'transparent'
      ctx.strokeStyle = 'rgba(255, 12, 182, 0.45)'
      ctx.lineWidth = 1
      ctx.shadowColor = 'rgba(255, 12, 182, 0.6)'
      ctx.shadowBlur = 8
      for (const feat of geo.features) {
        const name = (feat.properties as Record<string, string>)?.name || ''
        if (!matchesCountry(name, lang.countries)) continue
        drawFeature(ctx, feat, w, h, false)
      }
      ctx.shadowBlur = 0
    }
    texture.needsUpdate = true
  }, [])

  const drawKriolOverlay = (ctx: CanvasRenderingContext2D, w: number, h: number, lang: Language) => {
    const cx = ((lang.lng + 180) / 360) * w
    const cy = ((90 - lang.lat) / 180) * h
    const ochres = ['#C4722F', '#8B4513', '#E8D5B7', '#FF0CB6']
    const maxR = Math.min(w, h) * 0.08
    for (let ring = 0; ring < 8; ring++) {
      const r = (ring + 1) * (maxR / 8)
      const dots = Math.floor(r * 0.8)
      for (let d = 0; d < dots; d++) {
        const angle = (d / dots) * PI2 + ring * 0.3
        const jitter = (Math.random() - 0.5) * 4
        ctx.beginPath()
        ctx.arc(cx + Math.cos(angle) * (r + jitter), cy + Math.sin(angle) * (r + jitter), 2 + Math.random(), 0, PI2)
        ctx.fillStyle = ochres[Math.floor(Math.random() * ochres.length)]
        ctx.globalAlpha = 0.6 + Math.random() * 0.3
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }

  const updateDots = useCallback((_lang: Language, globe: THREE.Group) => {
    // Country-only highlighting — no city dots or markers
    if (dotsGroupRef.current) {
      globe.remove(dotsGroupRef.current)
      dotsGroupRef.current.traverse(c => { if ((c as THREE.Mesh).geometry) (c as THREE.Mesh).geometry.dispose() })
      dotsGroupRef.current = null
    }
  }, [])

  const loadGeoData = useCallback(async () => {
    try {
      const topoModule = await import('world-atlas/countries-110m.json')
      const topo = topoModule.default as unknown as Topology<{ countries: GeometryCollection }>
      const geo = feature(topo, topo.objects.countries) as FeatureCollection
      geoDataRef.current = geo
      drawBaseMap(geo)
      updateHighlights(selected)
    } catch { /* graceful fallback */ }
  }, [drawBaseMap, updateHighlights])

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

    // Base map canvas
    const baseCanvas = document.createElement('canvas')
    baseCanvas.width = CW; baseCanvas.height = CH
    baseCanvasRef.current = baseCanvas
    const bctx = baseCanvas.getContext('2d')!
    bctx.fillStyle = '#060810'
    bctx.fillRect(0, 0, CW, CH)

    const baseTex = new THREE.CanvasTexture(baseCanvas)
    baseTex.colorSpace = THREE.SRGBColorSpace
    baseTextureRef.current = baseTex

    const earthGeo = new THREE.SphereGeometry(RADIUS, 96, 96)
    const earthMat = new THREE.MeshBasicMaterial({ map: baseTex })
    globe.add(new THREE.Mesh(earthGeo, earthMat))

    // Highlight overlay
    const hlCanvas = document.createElement('canvas')
    hlCanvas.width = CW; hlCanvas.height = CH
    hlCanvasRef.current = hlCanvas

    const hlTex = new THREE.CanvasTexture(hlCanvas)
    hlTextureRef.current = hlTex

    const hlMat = new THREE.MeshBasicMaterial({
      map: hlTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(RADIUS + 0.003, 96, 96), hlMat))

    // Inner shadow for depth (like real globe under glass)
    const innerGeo = new THREE.SphereGeometry(RADIUS + 0.006, 64, 64)
    const innerMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
          float edge = smoothstep(0.4, 1.0, rim);
          gl_FragColor = vec4(0.0, 0.0, 0.0, edge * 0.6);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    })
    globe.add(new THREE.Mesh(innerGeo, innerMat))

    // Pink atmospheric glow (behind)
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform float uOpacity;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(1.0, 0.047, 0.714, 1.0) * intensity * uOpacity;
        }
      `,
      uniforms: { uOpacity: { value: 0.5 } },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 1.12, 64, 64), atmoMat))

    updateDots(selected, globe)
    loadGeoData()

    const animate = () => {
      rafId.current = requestAnimationFrame(animate)
      const now = Date.now()

      // Free-spin: apply velocity, gentle friction
      if (!isDragging.current) {
        velocity.current *= 0.997 // very slow friction — spins freely
        currentRotY.current += velocity.current
      }
      globe.rotation.y = currentRotY.current

      // Pulse atmosphere
      atmoMat.uniforms.uOpacity.value = 0.15 * Math.sin(now * 0.001 * (PI2 / 3.5)) + 0.45

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

    const onDown = (e: PointerEvent) => {
      isDragging.current = true
      velocity.current = 0
      prevMouse.current = { x: e.clientX, y: e.clientY }
    }
    const onMove = (e: PointerEvent) => {
      if (!isDragging.current) return
      const dx = (e.clientX - prevMouse.current.x) * 0.005
      currentRotY.current += dx
      velocity.current = dx // last frame's delta becomes release velocity
      prevMouse.current = { x: e.clientX, y: e.clientY }
    }
    const onUp = () => { isDragging.current = false }

    renderer.domElement.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)

    return () => {
      cancelAnimationFrame(rafId.current)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [])

  useEffect(() => {
    if (!globeRef.current) return
    updateDots(selected, globeRef.current)
    updateHighlights(selected)
  }, [selected, updateDots, updateHighlights])

  return <div ref={containerRef} className="w-full h-full" style={{ touchAction: 'none', cursor: 'grab' }} />
}
