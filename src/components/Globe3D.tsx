import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { FeatureCollection, Feature, Geometry, Position } from 'geojson'
import type { Language } from '../data/languages'

const GLOBE_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoY4QNlU1j_j87-dhBhteovBKpMknAiQCtPbodMtRnpcSb5pFqHikGdZ0edVst-pFolhnDhXzrS0vlr66K7ptRXDZNop2staUW4JLa5rnmqqFwkd_QTBHB5vAMBSsVZpVIMMnnxr_rhhRv3AoEbWiAO5B1Cmh6rzfuSPlOyR7qhFu6JjaTcci4c4WmLxzCbd4A8DMT4qB8eYutamtKAaFuLHiClpZYuFXVjp9IquOZJ52AEJCUK2XBShToRyTQFcrlB-6ErK_u51rW'

const PINK = 0xFF0CB6
const RADIUS = 2
const PI2 = Math.PI * 2

// Country name aliases for matching GeoJSON ↔ language data
const ALIASES: Record<string, string[]> = {
  'United States of America': ['United States','USA','United States (60M+ Spanish speakers)'],
  'United Kingdom': ['United Kingdom','UK'],
  'South Korea': ['South Korea','Korea, Republic of'],
  'North Korea': ['North Korea',"Korea, Dem. People's Rep."],
  'Democratic Republic of the Congo': ['DR Congo','Democratic Republic of the Congo'],
  'Republic of the Congo': ['Republic of Congo'],
  'Ivory Coast': ['Ivory Coast',"Côte d'Ivoire"],
  'Czech Republic': ['Czech Republic','Czechia'],
  'Myanmar': ['Myanmar','Burma'],
  'Turkey': ['Turkey','Türkiye'],
  'Taiwan': ['Taiwan'],
  'Palestine': ['Palestine','Palestinian Territory'],
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

interface Props {
  selected: Language
  onReady?: () => void
}

export default function Globe3D({ selected }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const globeRef = useRef<THREE.Group | null>(null)
  const highlightCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const highlightTextureRef = useRef<THREE.CanvasTexture | null>(null)
  const geoDataRef = useRef<FeatureCollection | null>(null)
  const dotsGroupRef = useRef<THREE.Group | null>(null)
  const kriolGroupRef = useRef<THREE.Group | null>(null)
  const autoRotate = useRef(true)
  const lastInteraction = useRef(0)
  const isDragging = useRef(false)
  const prevMouse = useRef({ x: 0, y: 0 })
  const targetRotY = useRef(0)
  const currentRotY = useRef(0)
  const rafId = useRef(0)

  // Load GeoJSON once
  const loadGeoData = useCallback(async () => {
    try {
      const topoModule = await import('world-atlas/countries-110m.json')
      const topo = topoModule.default as unknown as Topology<{ countries: GeometryCollection }>
      const geo = feature(topo, topo.objects.countries) as FeatureCollection
      geoDataRef.current = geo
      updateHighlights(selected)
    } catch {
      // GeoJSON failed to load — globe still works without country highlights
    }
  }, [])

  const updateHighlights = useCallback((lang: Language) => {
    const canvas = highlightCanvasRef.current
    const texture = highlightTextureRef.current
    const geo = geoDataRef.current
    if (!canvas || !texture) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (lang.isIndigenous) {
      // Kriol: dot painting overlay on Australia
      drawKriolOverlay(ctx, canvas.width, canvas.height, lang)
    } else if (geo) {
      // Standard: highlight countries
      ctx.fillStyle = 'rgba(255, 12, 182, 0.30)'
      ctx.strokeStyle = 'rgba(255, 12, 182, 0.50)'
      ctx.lineWidth = 0.5

      for (const feat of geo.features) {
        const name = (feat.properties as Record<string, string>)?.name || ''
        if (!matchesCountry(name, lang.countries)) continue
        drawFeature(ctx, feat, canvas.width, canvas.height)
      }
    }

    texture.needsUpdate = true
  }, [])

  // Draw GeoJSON feature on equirectangular canvas
  const drawFeature = (ctx: CanvasRenderingContext2D, feat: Feature, w: number, h: number) => {
    const drawRing = (coords: Position[]) => {
      ctx.beginPath()
      for (let i = 0; i < coords.length; i++) {
        const [lng, lat] = coords[i]
        const x = ((lng + 180) / 360) * w
        const y = ((90 - lat) / 180) * h
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }

    const geom = feat.geometry as Geometry
    if (geom.type === 'Polygon') {
      for (const ring of geom.coordinates) drawRing(ring)
    } else if (geom.type === 'MultiPolygon') {
      for (const poly of geom.coordinates) {
        for (const ring of poly) drawRing(ring)
      }
    }
  }

  // Kriol dot painting effect
  const drawKriolOverlay = (ctx: CanvasRenderingContext2D, w: number, h: number, lang: Language) => {
    const cx = ((lang.lng + 180) / 360) * w
    const cy = ((90 - lang.lat) / 180) * h
    const ochres = ['#C4722F', '#8B4513', '#E8D5B7', '#FF0CB6']
    const maxR = Math.min(w, h) * 0.12

    for (let ring = 0; ring < 8; ring++) {
      const r = (ring + 1) * (maxR / 8)
      const dots = Math.floor(r * 0.8)
      for (let d = 0; d < dots; d++) {
        const angle = (d / dots) * PI2 + ring * 0.3
        const jitter = (Math.random() - 0.5) * 4
        const px = cx + Math.cos(angle) * (r + jitter)
        const py = cy + Math.sin(angle) * (r + jitter)
        const color = ochres[Math.floor(Math.random() * ochres.length)]
        ctx.beginPath()
        ctx.arc(px, py, 1.5 + Math.random(), 0, PI2)
        ctx.fillStyle = color
        ctx.globalAlpha = 0.6 + Math.random() * 0.3
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }

  // Create city dot sprites
  const updateDots = useCallback((lang: Language, globe: THREE.Group) => {
    if (dotsGroupRef.current) {
      globe.remove(dotsGroupRef.current)
      dotsGroupRef.current.traverse(c => { if ((c as THREE.Mesh).geometry) (c as THREE.Mesh).geometry.dispose() })
    }
    if (kriolGroupRef.current) {
      globe.remove(kriolGroupRef.current)
      kriolGroupRef.current = null
    }

    const group = new THREE.Group()

    // Active dot (larger, brighter)
    const activeDotGeo = new THREE.SphereGeometry(0.04, 12, 12)
    const activeDotMat = new THREE.MeshBasicMaterial({ color: PINK })
    const activeDot = new THREE.Mesh(activeDotGeo, activeDotMat)
    const pos = latLngToVec3(lang.lat, lang.lng, RADIUS + 0.01)
    activeDot.position.copy(pos)
    group.add(activeDot)

    // Glow ring around active dot
    const glowGeo = new THREE.RingGeometry(0.05, 0.09, 24)
    const glowMat = new THREE.MeshBasicMaterial({ color: PINK, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    glow.position.copy(pos)
    glow.lookAt(new THREE.Vector3(0, 0, 0))
    group.add(glow)

    dotsGroupRef.current = group
    globe.add(group)
  }, [])

  // Rotate globe to center on language
  const rotateToLanguage = useCallback((lang: Language) => {
    const targetLng = -lang.lng * (Math.PI / 180) - Math.PI / 2
    // Normalize to avoid spinning multiple revolutions
    const current = currentRotY.current % PI2
    let target = targetLng % PI2
    const diff = target - current
    if (diff > Math.PI) target -= PI2
    else if (diff < -Math.PI) target += PI2
    targetRotY.current = target
  }, [])

  // Init Three.js scene
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const w = container.clientWidth
    const h = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
    camera.position.z = 5.5
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Globe group
    const globe = new THREE.Group()
    globeRef.current = globe
    scene.add(globe)

    // Earth sphere with satellite texture
    const textureLoader = new THREE.TextureLoader()
    textureLoader.crossOrigin = 'anonymous'
    const earthTex = textureLoader.load(GLOBE_IMG)
    earthTex.colorSpace = THREE.SRGBColorSpace

    const earthGeo = new THREE.SphereGeometry(RADIUS, 64, 64)
    const earthMat = new THREE.MeshBasicMaterial({ map: earthTex })
    const earth = new THREE.Mesh(earthGeo, earthMat)
    globe.add(earth)

    // Highlight overlay sphere (canvas texture)
    const hlCanvas = document.createElement('canvas')
    hlCanvas.width = 2048
    hlCanvas.height = 1024
    highlightCanvasRef.current = hlCanvas

    const hlTexture = new THREE.CanvasTexture(hlCanvas)
    highlightTextureRef.current = hlTexture

    const hlGeo = new THREE.SphereGeometry(RADIUS + 0.005, 64, 64)
    const hlMat = new THREE.MeshBasicMaterial({
      map: hlTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const hlMesh = new THREE.Mesh(hlGeo, hlMat)
    globe.add(hlMesh)

    // Atmosphere glow (pink, behind globe)
    const atmoGeo = new THREE.SphereGeometry(RADIUS * 1.15, 64, 64)
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
    const atmo = new THREE.Mesh(atmoGeo, atmoMat)
    scene.add(atmo)

    // Init dots and rotation
    updateDots(selected, globe)
    rotateToLanguage(selected)
    currentRotY.current = targetRotY.current
    globe.rotation.y = currentRotY.current

    // Load geo data
    loadGeoData()

    // Animation loop
    const animate = () => {
      rafId.current = requestAnimationFrame(animate)

      // Auto-rotate
      const now = Date.now()
      if (now - lastInteraction.current > 5000) {
        autoRotate.current = true
      }
      if (autoRotate.current && !isDragging.current) {
        targetRotY.current += 0.001
      }

      // Smooth rotation
      currentRotY.current += (targetRotY.current - currentRotY.current) * 0.05
      globe.rotation.y = currentRotY.current

      // Pulse atmosphere
      const pulse = 0.2 * Math.sin(now * 0.001 * (PI2 / 3.5)) + 0.5
      atmoMat.uniforms.uOpacity.value = pulse

      // Pulse active dot
      if (dotsGroupRef.current && dotsGroupRef.current.children.length > 1) {
        const glowRing = dotsGroupRef.current.children[1] as THREE.Mesh
        const scale = 1 + 0.3 * Math.sin(now * 0.003)
        glowRing.scale.setScalar(scale)
      }

      renderer.render(scene, camera)
    }
    animate()

    // Resize handler
    const onResize = () => {
      if (!container) return
      const nw = container.clientWidth
      const nh = container.clientHeight
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize)

    // Mouse/touch interaction for drag-to-rotate
    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true
      autoRotate.current = false
      lastInteraction.current = Date.now()
      prevMouse.current = { x: e.clientX, y: e.clientY }
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return
      const dx = e.clientX - prevMouse.current.x
      targetRotY.current += dx * 0.005
      prevMouse.current = { x: e.clientX, y: e.clientY }
    }
    const onPointerUp = () => {
      isDragging.current = false
      lastInteraction.current = Date.now()
    }

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
      container.removeChild(renderer.domElement)
    }
  }, [])

  // Update when selected language changes
  useEffect(() => {
    if (!globeRef.current) return
    updateDots(selected, globeRef.current)
    rotateToLanguage(selected)
    updateHighlights(selected)
    autoRotate.current = false
    lastInteraction.current = Date.now()
  }, [selected, updateDots, rotateToLanguage, updateHighlights])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ touchAction: 'none', cursor: 'grab' }}
    />
  )
}
