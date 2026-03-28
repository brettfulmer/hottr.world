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
const SPIN_SPEED = 0.003
const TILE_W = 3
const TILE_H = 3
const GAP = 0.5

// Exact colors
const OCEAN = '#050608'
const LAND = '#E0E0E0'
const ACTIVE = '#FF0CB6'

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
      for (const c of langCountries) { if (c === a || c.startsWith(a)) return true }
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

interface Tile { x: number; y: number; isLand: boolean; countryName: string; tilt: number }

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
  const tilesRef = useRef<Tile[]>([])
  const atmoMatRef = useRef<THREE.ShaderMaterial | null>(null)
  const floorMatRef = useRef<THREE.ShaderMaterial | null>(null)
  const glowFlash = useRef(0)
  const rafId = useRef(0)
  const sparkleTimer = useRef(0)
  const selectedRef = useRef(selected)

  useEffect(() => { selectedRef.current = selected }, [selected])

  const buildTileGrid = useCallback((geo: FeatureCollection) => {
    const tiles: Tile[] = []
    const features = geo.features.map(f => {
      const name = (f.properties as Record<string, string>)?.name || ''
      const geom = f.geometry as Geometry
      const rings: Position[][] = []
      if (geom.type === 'Polygon') rings.push(...geom.coordinates)
      else if (geom.type === 'MultiPolygon') for (const p of geom.coordinates) rings.push(...p)
      return { name, rings }
    })
    const step = TILE_W + GAP
    for (let py = 0; py < CH; py += step) {
      for (let px = 0; px < CW; px += step) {
        const lng = ((px + TILE_W / 2) / CW) * 360 - 180
        const lat = 90 - ((py + TILE_H / 2) / CH) * 180
        let country = ''
        for (const f of features) {
          for (const ring of f.rings) {
            if (pointInRing(lng, lat, ring)) { country = f.name; break }
          }
          if (country) break
        }
        tiles.push({ x: px, y: py, isLand: !!country, countryName: country, tilt: Math.random() * PI2 })
      }
    }
    tilesRef.current = tiles
  }, [])

  // Base map — simple flat fills, no gradients, no variation
  const drawBaseMap = useCallback(() => {
    const canvas = document.createElement('canvas')
    canvas.width = CW; canvas.height = CH
    const ctx = canvas.getContext('2d')!
    // Black background = gaps between tiles
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, CW, CH)

    for (const tile of tilesRef.current) {
      ctx.fillStyle = tile.isLand ? LAND : OCEAN
      ctx.fillRect(tile.x, tile.y, TILE_W, TILE_H)
    }
    return canvas
  }, [])

  // Highlights — flat #FF0CB6 on active country tiles
  const updateHighlights = useCallback((lang: Language) => {
    const canvas = hlCanvasRef.current
    const texture = hlTextureRef.current
    if (!canvas || !texture) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, CW, CH)

    ctx.fillStyle = ACTIVE
    for (const t of tilesRef.current) {
      const isActive = lang.isIndigenous
        ? t.countryName === 'Australia'
        : (t.isLand && matchesCountry(t.countryName, lang.countries))
      if (!isActive) continue
      ctx.fillRect(t.x, t.y, TILE_W, TILE_H)
    }
    texture.needsUpdate = true
  }, [])

  // Sparkle — ONLY on active pink tiles, white flashes for glimmer
  const updateSparkles = useCallback(() => {
    const canvas = sparkleCanvasRef.current
    const texture = sparkleTextureRef.current
    if (!canvas || !texture) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, CW, CH)

    const tiles = tilesRef.current
    if (!tiles.length) return

    const t = Date.now() * 0.001
    const lang = selectedRef.current

    // Only active tiles sparkle
    const activeTiles = tiles.filter(tile =>
      lang.isIndigenous ? tile.countryName === 'Australia' :
      (tile.isLand && matchesCountry(tile.countryName, lang.countries))
    )
    if (!activeTiles.length) { texture.needsUpdate = true; return }

    // Pick random active tiles to flash white
    for (let i = 0; i < 20; i++) {
      const tile = activeTiles[Math.floor(Math.random() * activeTiles.length)]
      if (!tile) continue

      // Sine-based alignment with unique per-tile offset = natural sparkle
      const flash = Math.sin(tile.tilt + t * 2.0)
      if (flash < 0.5) continue

      const brightness = (flash - 0.5) * 2 // 0 to 1
      ctx.globalAlpha = brightness * 0.8
      ctx.fillStyle = 'rgba(255,255,255,1)'
      ctx.fillRect(tile.x, tile.y, TILE_W, TILE_H)
    }

    ctx.globalAlpha = 1
    texture.needsUpdate = true
  }, [])

  const loadGeoData = useCallback(async () => {
    try {
      const topoModule = await import('world-atlas/countries-110m.json')
      const topo = topoModule.default as unknown as Topology<{ countries: GeometryCollection }>
      const geo = feature(topo, topo.objects.countries) as FeatureCollection
      buildTileGrid(geo)
      const baseCanvas = drawBaseMap()
      if (baseTextureRef.current) {
        baseTextureRef.current.image = baseCanvas
        baseTextureRef.current.needsUpdate = true
      }
      updateHighlights(selected)
    } catch { /* graceful */ }
  }, [buildTileGrid, drawBaseMap, updateHighlights])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const w = container.clientWidth
    const h = container.clientHeight

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
    pctx.fillStyle = '#000000'
    pctx.fillRect(0, 0, CW, CH)
    const baseTex = new THREE.CanvasTexture(pCanvas)
    baseTex.colorSpace = THREE.SRGBColorSpace
    baseTextureRef.current = baseTex
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(RADIUS, 128, 128), new THREE.MeshBasicMaterial({ map: baseTex })))

    // Highlight overlay
    const hlCanvas = document.createElement('canvas')
    hlCanvas.width = CW; hlCanvas.height = CH
    hlCanvasRef.current = hlCanvas
    const hlTex = new THREE.CanvasTexture(hlCanvas)
    hlTextureRef.current = hlTex
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS + 0.002, 128, 128),
      new THREE.MeshBasicMaterial({ map: hlTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    ))

    // Sparkle overlay
    const sparkCanvas = document.createElement('canvas')
    sparkCanvas.width = CW; sparkCanvas.height = CH
    sparkleCanvasRef.current = sparkCanvas
    const sparkTex = new THREE.CanvasTexture(sparkCanvas)
    sparkleTextureRef.current = sparkTex
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS + 0.004, 128, 128),
      new THREE.MeshBasicMaterial({ map: sparkTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    ))

    // NO spotlight shader — removed entirely

    // Inner rim shadow
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS + 0.01, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `varying vec3 vNormal; void main() { float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0,0.0,1.0))); gl_FragColor = vec4(0.0,0.0,0.0, smoothstep(0.3,1.0,rim) * 0.6); }`,
        transparent: true, depthWrite: false, side: THREE.FrontSide,
      })
    ))

    // Back halo
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        varying vec3 vNormal; uniform float uOpacity;
        void main() {
          float i = pow(0.55 - dot(vNormal, vec3(0.0,0.0,1.0)), 3.5);
          vec3 col = mix(vec3(0.1), vec3(1.0, 0.047, 0.714), 0.5);
          gl_FragColor = vec4(col, 1.0) * i * uOpacity;
        }
      `,
      uniforms: { uOpacity: { value: 0.35 } },
      side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    })
    atmoMatRef.current = atmoMat
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 1.12, 64, 64), atmoMat))

    // Floor reflection
    const floorMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        varying vec2 vUv; uniform float uTime;
        void main() {
          float dist = length(vUv - vec2(0.5));
          float fade = smoothstep(0.5, 0.0, dist);
          float flicker = 0.7 + 0.3 * sin(uTime * 0.4);
          gl_FragColor = vec4(mix(vec3(0.03), vec3(1.0,0.047,0.714) * 0.1, fade * flicker), fade * 0.12 * flicker);
        }
      `,
      uniforms: { uTime: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    floorMatRef.current = floorMat
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.5), floorMat)
    floorMesh.rotation.x = -Math.PI / 2
    floorMesh.position.y = -RADIUS * 1.5
    scene.add(floorMesh)

    loadGeoData()

    const animate = () => {
      rafId.current = requestAnimationFrame(animate)
      const now = Date.now()
      const t = now * 0.001

      globe.rotation.y += SPIN_SPEED

      if (floorMatRef.current) floorMatRef.current.uniforms.uTime.value = t

      if (glowFlash.current > 0) {
        glowFlash.current *= 0.96
        if (glowFlash.current < 0.01) glowFlash.current = 0
      }
      atmoMat.uniforms.uOpacity.value = 0.06 * Math.sin(t * (PI2 / 5)) + 0.35 + glowFlash.current * 0.3

      // Sparkle only on active pink tiles
      if (now - sparkleTimer.current > 130) {
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

  // Language change — update highlights, flash glow
  useEffect(() => {
    glowFlash.current = 0.6
    updateHighlights(selected)
  }, [selected, updateHighlights])

  return <div ref={containerRef} className="w-full h-full" style={{ touchAction: 'none' }} />
}
