import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { FeatureCollection, Feature, Geometry, Position } from 'geojson'
import type { Language } from '../data/languages'

const PINK = 0xFF0CB6
const RADIUS = 2
const PI2 = Math.PI * 2
const CW = 2048
const CH = 1024

// Country name aliases for GeoJSON ↔ language data matching
const ALIASES: Record<string, string[]> = {
  'United States of America': ['United States','USA','United States (60M+ Spanish speakers)'],
  'United Kingdom': ['United Kingdom','UK'],
  'South Korea': ['South Korea'],
  'North Korea': ['North Korea'],
  'Democratic Republic of the Congo': ['DR Congo'],
  'Republic of the Congo': ['Republic of Congo'],
  "Côte d'Ivoire": ['Ivory Coast'],
  'Czechia': ['Czech Republic'],
  'Myanmar': ['Burma'],
  'Turkey': ['Turkey','Türkiye'],
  'Taiwan': ['Taiwan'],
  'Curaçao': ['Curaçao','Curacao'],
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

function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  )
}

// Draw a GeoJSON ring onto canvas with equirectangular projection
function drawRing(ctx: CanvasRenderingContext2D, coords: Position[], w: number, h: number) {
  ctx.beginPath()
  for (let i = 0; i < coords.length; i++) {
    const [lng, lat] = coords[i]
    const x = ((lng + 180) / 360) * w
    const y = ((90 - lat) / 180) * h
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function drawFeatureOnCanvas(ctx: CanvasRenderingContext2D, feat: Feature, w: number, h: number, fill: boolean) {
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
  const autoRotate = useRef(true)
  const lastInteraction = useRef(0)
  const isDragging = useRef(false)
  const prevMouse = useRef({ x: 0, y: 0 })
  const targetRotY = useRef(0)
  const currentRotY = useRef(0)
  const rafId = useRef(0)

  // Draw the base globe texture: dark ocean + country outlines + subtle fills
  const drawBaseMap = useCallback((geo: FeatureCollection) => {
    const canvas = baseCanvasRef.current
    const texture = baseTextureRef.current
    if (!canvas || !texture) return

    const ctx = canvas.getContext('2d')!

    // Dark ocean
    ctx.fillStyle = '#080a10'
    ctx.fillRect(0, 0, CW, CH)

    // Subtle latitude/longitude grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
    ctx.lineWidth = 0.5
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = ((90 - lat) / 180) * CH
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke()
    }
    for (let lng = -150; lng <= 180; lng += 30) {
      const x = ((lng + 180) / 360) * CW
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CH); ctx.stroke()
    }

    // Country fills (very subtle dark land)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.lineWidth = 0.8
    for (const feat of geo.features) {
      drawFeatureOnCanvas(ctx, feat, CW, CH, true)
    }

    texture.needsUpdate = true
  }, [])

  // Draw country highlights for selected language
  const updateHighlights = useCallback((lang: Language) => {
    const canvas = hlCanvasRef.current
    const texture = hlTextureRef.current
    const geo = geoDataRef.current
    if (!canvas || !texture) return

    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, CW, CH)

    if (lang.isIndigenous) {
      drawKriolOverlay(ctx, lang)
    } else if (geo) {
      ctx.fillStyle = 'rgba(255, 12, 182, 0.35)'
      ctx.strokeStyle = 'rgba(255, 12, 182, 0.6)'
      ctx.lineWidth = 1.2

      for (const feat of geo.features) {
        const name = (feat.properties as Record<string, string>)?.name || ''
        if (!matchesCountry(name, lang.countries)) continue
        drawFeatureOnCanvas(ctx, feat, CW, CH, true)
      }
    }
    texture.needsUpdate = true
  }, [])

  const drawKriolOverlay = (ctx: CanvasRenderingContext2D, lang: Language) => {
    const cx = ((lang.lng + 180) / 360) * CW
    const cy = ((90 - lang.lat) / 180) * CH
    const ochres = ['#C4722F', '#8B4513', '#E8D5B7', '#FF0CB6']
    const maxR = Math.min(CW, CH) * 0.1

    for (let ring = 0; ring < 8; ring++) {
      const r = (ring + 1) * (maxR / 8)
      const dots = Math.floor(r * 0.8)
      for (let d = 0; d < dots; d++) {
        const angle = (d / dots) * PI2 + ring * 0.3
        const jitter = (Math.random() - 0.5) * 4
        ctx.beginPath()
        ctx.arc(cx + Math.cos(angle) * (r + jitter), cy + Math.sin(angle) * (r + jitter), 1.5 + Math.random(), 0, PI2)
        ctx.fillStyle = ochres[Math.floor(Math.random() * ochres.length)]
        ctx.globalAlpha = 0.6 + Math.random() * 0.3
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }

  const updateDots = useCallback((lang: Language, globe: THREE.Group) => {
    if (dotsGroupRef.current) {
      globe.remove(dotsGroupRef.current)
      dotsGroupRef.current.traverse(c => { if ((c as THREE.Mesh).geometry) (c as THREE.Mesh).geometry.dispose() })
    }
    const group = new THREE.Group()

    const dotGeo = new THREE.SphereGeometry(0.035, 12, 12)
    const dotMat = new THREE.MeshBasicMaterial({ color: PINK })
    const dot = new THREE.Mesh(dotGeo, dotMat)
    dot.position.copy(latLngToVec3(lang.lat, lang.lng, RADIUS + 0.01))
    group.add(dot)

    const glowGeo = new THREE.RingGeometry(0.045, 0.08, 24)
    const glowMat = new THREE.MeshBasicMaterial({ color: PINK, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    glow.position.copy(dot.position)
    glow.lookAt(new THREE.Vector3(0, 0, 0))
    group.add(glow)

    dotsGroupRef.current = group
    globe.add(group)
  }, [])

  const rotateToLanguage = useCallback((lang: Language) => {
    const target = -lang.lng * (Math.PI / 180) - Math.PI / 2
    const current = currentRotY.current % PI2
    let t = target % PI2
    const diff = t - current
    if (diff > Math.PI) t -= PI2
    else if (diff < -Math.PI) t += PI2
    targetRotY.current = t
  }, [])

  // Load GeoJSON and init
  const loadGeoData = useCallback(async () => {
    try {
      const topoModule = await import('world-atlas/countries-110m.json')
      const topo = topoModule.default as unknown as Topology<{ countries: GeometryCollection }>
      const geo = feature(topo, topo.objects.countries) as FeatureCollection
      geoDataRef.current = geo
      drawBaseMap(geo)
      updateHighlights(selected)
    } catch { /* globe works without highlights */ }
  }, [drawBaseMap, updateHighlights])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const w = container.clientWidth
    const h = container.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
    camera.position.z = 5.5

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const globe = new THREE.Group()
    globeRef.current = globe
    scene.add(globe)

    // Base map canvas — drawn country outlines (traditional globe look)
    const baseCanvas = document.createElement('canvas')
    baseCanvas.width = CW; baseCanvas.height = CH
    baseCanvasRef.current = baseCanvas
    // Fill with dark initially
    const bctx = baseCanvas.getContext('2d')!
    bctx.fillStyle = '#080a10'
    bctx.fillRect(0, 0, CW, CH)

    const baseTex = new THREE.CanvasTexture(baseCanvas)
    baseTex.colorSpace = THREE.SRGBColorSpace
    baseTextureRef.current = baseTex

    const earthGeo = new THREE.SphereGeometry(RADIUS, 64, 64)
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
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(RADIUS + 0.004, 64, 64), hlMat))

    // Pink atmosphere
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
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          gl_FragColor = vec4(1.0, 0.047, 0.714, 1.0) * intensity * uOpacity;
        }
      `,
      uniforms: { uOpacity: { value: 0.5 } },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 1.15, 64, 64), atmoMat)
    scene.add(atmo)

    updateDots(selected, globe)
    rotateToLanguage(selected)
    currentRotY.current = targetRotY.current
    globe.rotation.y = currentRotY.current

    loadGeoData()

    const animate = () => {
      rafId.current = requestAnimationFrame(animate)
      const now = Date.now()

      if (now - lastInteraction.current > 5000) autoRotate.current = true
      if (autoRotate.current && !isDragging.current) targetRotY.current += 0.001

      currentRotY.current += (targetRotY.current - currentRotY.current) * 0.05
      globe.rotation.y = currentRotY.current

      atmoMat.uniforms.uOpacity.value = 0.2 * Math.sin(now * 0.001 * (PI2 / 3.5)) + 0.5

      if (dotsGroupRef.current && dotsGroupRef.current.children.length > 1) {
        (dotsGroupRef.current.children[1] as THREE.Mesh).scale.setScalar(1 + 0.3 * Math.sin(now * 0.003))
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

    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true; autoRotate.current = false
      lastInteraction.current = Date.now()
      prevMouse.current = { x: e.clientX, y: e.clientY }
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return
      targetRotY.current += (e.clientX - prevMouse.current.x) * 0.005
      prevMouse.current = { x: e.clientX, y: e.clientY }
    }
    const onPointerUp = () => { isDragging.current = false; lastInteraction.current = Date.now() }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    return () => {
      cancelAnimationFrame(rafId.current)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [])

  useEffect(() => {
    if (!globeRef.current) return
    updateDots(selected, globeRef.current)
    rotateToLanguage(selected)
    updateHighlights(selected)
    autoRotate.current = false
    lastInteraction.current = Date.now()
  }, [selected, updateDots, rotateToLanguage, updateHighlights])

  return <div ref={containerRef} className="w-full h-full" style={{ touchAction: 'none', cursor: 'grab' }} />
}
