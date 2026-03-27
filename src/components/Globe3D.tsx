import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { FeatureCollection, Geometry, Position } from 'geojson'
import type { Language } from '../data/languages'

const RADIUS = 2
const PI2 = Math.PI * 2
const SPIN_SPEED = 0.002
const PARTICLE_COUNT = 28000
const PINK = new THREE.Color(0xFF0CB6)

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

function latLngToXYZ(lat: number, lng: number, r: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return [
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ]
}

interface ParticleData {
  isLand: boolean
  countryName: string
}

interface Props { selected: Language }

export default function Globe3D({ selected }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const globeRef = useRef<THREE.Group | null>(null)
  const pointsRef = useRef<THREE.Points | null>(null)
  const particleDataRef = useRef<ParticleData[]>([])
  const colorsRef = useRef<Float32Array | null>(null)
  const sizesRef = useRef<Float32Array | null>(null)
  const atmoMatRef = useRef<THREE.ShaderMaterial | null>(null)
  const glowFlash = useRef(0)
  const rafId = useRef(0)

  // Build particle positions from GeoJSON
  const buildParticles = useCallback((geo: FeatureCollection) => {
    const features = geo.features.map(f => {
      const name = (f.properties as Record<string, string>)?.name || ''
      const geom = f.geometry as Geometry
      const rings: Position[][] = []
      if (geom.type === 'Polygon') rings.push(...geom.coordinates)
      else if (geom.type === 'MultiPolygon') for (const p of geom.coordinates) rings.push(...p)
      return { name, rings }
    })

    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)
    const data: ParticleData[] = []

    // Golden-angle Fibonacci sphere distribution for uniform coverage
    const goldenAngle = Math.PI * (3 - Math.sqrt(5))

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const y = 1 - (i / (PARTICLE_COUNT - 1)) * 2 // -1 to 1
      const radiusAtY = Math.sqrt(1 - y * y)
      const theta = goldenAngle * i

      const px = radiusAtY * Math.cos(theta)
      const pz = radiusAtY * Math.sin(theta)

      // Jitter slightly for organic mirror-tile feel
      const jitter = 0.003
      const x = (px + (Math.random() - 0.5) * jitter) * RADIUS
      const yy = (y + (Math.random() - 0.5) * jitter) * RADIUS
      const z = (pz + (Math.random() - 0.5) * jitter) * RADIUS

      positions[i * 3] = x
      positions[i * 3 + 1] = yy
      positions[i * 3 + 2] = z

      // Convert 3D position to lat/lng for country lookup
      const r = Math.sqrt(x * x + yy * yy + z * z)
      const lat = Math.asin(yy / r) * (180 / Math.PI)
      const lng = Math.atan2(z, -x) * (180 / Math.PI) - 180
      const normLng = ((lng % 360) + 540) % 360 - 180

      // Check country
      let country = ''
      for (const f of features) {
        for (const ring of f.rings) {
          if (pointInRing(normLng, lat, ring)) { country = f.name; break }
        }
        if (country) break
      }

      data.push({ isLand: !!country, countryName: country })

      // Default color: WHITE for land, DARK for ocean
      if (country) {
        const brightness = 0.6 + Math.random() * 0.4
        colors[i * 3] = brightness
        colors[i * 3 + 1] = brightness
        colors[i * 3 + 2] = brightness
        sizes[i] = 2.5 + Math.random() * 1.5
      } else {
        const b = 0.04 + Math.random() * 0.06
        colors[i * 3] = b
        colors[i * 3 + 1] = b
        colors[i * 3 + 2] = b
        sizes[i] = 1.5 + Math.random() * 0.8
      }
    }

    particleDataRef.current = data
    colorsRef.current = colors
    sizesRef.current = sizes

    return { positions, colors, sizes }
  }, [])

  // Update particle colors for selected language
  const updateHighlights = useCallback((lang: Language) => {
    const points = pointsRef.current
    const data = particleDataRef.current
    const colors = colorsRef.current
    if (!points || !data.length || !colors) return

    const geom = points.geometry
    const colorAttr = geom.getAttribute('color') as THREE.BufferAttribute
    const colorArr = colorAttr.array as Float32Array

    for (let i = 0; i < data.length; i++) {
      const d = data[i]
      const i3 = i * 3

      if (d.isLand) {
        let highlighted = false

        if (lang.isIndigenous) {
          highlighted = d.countryName === 'Australia'
        } else {
          highlighted = matchesCountry(d.countryName, lang.countries)
        }

        if (highlighted) {
          // Neon pink with slight brightness variation
          const b = 0.8 + Math.random() * 0.2
          colorArr[i3] = PINK.r * b
          colorArr[i3 + 1] = PINK.g * b
          colorArr[i3 + 2] = PINK.b * b
        } else {
          // White (default land)
          const b = 0.6 + Math.random() * 0.4
          colorArr[i3] = b
          colorArr[i3 + 1] = b
          colorArr[i3 + 2] = b
        }
      }
      // Ocean particles stay as-is (DARK)
    }

    colorAttr.needsUpdate = true
  }, [])

  const loadGeoData = useCallback(async () => {
    try {
      const topoModule = await import('world-atlas/countries-110m.json')
      const topo = topoModule.default as unknown as Topology<{ countries: GeometryCollection }>
      const geo = feature(topo, topo.objects.countries) as FeatureCollection

      const { positions, colors, sizes } = buildParticles(geo)

      if (pointsRef.current && globeRef.current) {
        // Update existing geometry
        const geom = pointsRef.current.geometry
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
        updateHighlights(selected)
      }
    } catch { /* graceful */ }
  }, [buildParticles, updateHighlights])

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

    // Particle system
    const geometry = new THREE.BufferGeometry()
    const initPos = new Float32Array(PARTICLE_COUNT * 3)
    const initColors = new Float32Array(PARTICLE_COUNT * 3)
    const initSizes = new Float32Array(PARTICLE_COUNT)
    // Fill with default positions on sphere (will be replaced by GeoJSON data)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const [x, y, z] = latLngToXYZ(
        Math.random() * 180 - 90,
        Math.random() * 360 - 180,
        RADIUS
      )
      initPos[i * 3] = x; initPos[i * 3 + 1] = y; initPos[i * 3 + 2] = z
      initColors[i * 3] = 0.05; initColors[i * 3 + 1] = 0.05; initColors[i * 3 + 2] = 0.06
      initSizes[i] = 1.5
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(initPos, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(initColors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(initSizes, 1))

    const material = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          // Soft circular point with sparkle
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.2, d);
          // Sparkle: bright center
          float sparkle = smoothstep(0.3, 0.0, d) * 0.5;
          gl_FragColor = vec4(vColor + sparkle, alpha);
        }
      `,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    const points = new THREE.Points(geometry, material)
    pointsRef.current = points
    globe.add(points)

    // Inner rim shadow
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS + 0.01, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `varying vec3 vNormal; void main() { float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0))); float edge = smoothstep(0.35, 1.0, rim); gl_FragColor = vec4(0.0, 0.0, 0.0, edge * 0.45); }`,
        transparent: true, depthWrite: false, side: THREE.FrontSide,
      })
    ))

    // Pink atmosphere
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec3 vNormal; uniform float uOpacity; void main() { float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0); gl_FragColor = vec4(1.0, 0.047, 0.714, 1.0) * intensity * uOpacity; }`,
      uniforms: { uOpacity: { value: 0.5 } },
      side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    })
    atmoMatRef.current = atmoMat
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 1.1, 64, 64), atmoMat))

    loadGeoData()

    // Sparkle animation via random size pulses
    let sparkleFrame = 0

    const animate = () => {
      rafId.current = requestAnimationFrame(animate)
      const now = Date.now()
      const t = now * 0.001
      globe.rotation.y += SPIN_SPEED

      // Atmosphere pulse + language flash
      const basePulse = 0.12 * Math.sin(t * (PI2 / 3.5)) + 0.4
      if (glowFlash.current > 0) {
        glowFlash.current *= 0.96
        if (glowFlash.current < 0.01) glowFlash.current = 0
      }
      atmoMat.uniforms.uOpacity.value = basePulse + glowFlash.current

      // Sparkle: randomly pulse a few particle sizes every few frames
      sparkleFrame++
      if (sparkleFrame % 8 === 0 && pointsRef.current) {
        const sizeAttr = pointsRef.current.geometry.getAttribute('size') as THREE.BufferAttribute
        const sArr = sizeAttr.array as Float32Array
        const data = particleDataRef.current
        for (let i = 0; i < 30; i++) {
          const idx = Math.floor(Math.random() * data.length)
          if (data[idx]?.isLand) {
            sArr[idx] = 3.5 + Math.random() * 2 // flash bright
          }
        }
        // Decay all sizes back toward base
        for (let i = 0; i < sArr.length; i++) {
          const base = data[i]?.isLand ? (2.5 + (i % 3) * 0.5) : (1.5 + (i % 2) * 0.3)
          sArr[i] += (base - sArr[i]) * 0.1
        }
        sizeAttr.needsUpdate = true
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

  // Language change → update particle colors + flash atmosphere
  useEffect(() => {
    updateHighlights(selected)
    glowFlash.current = 1.5
  }, [selected, updateHighlights])

  return <div ref={containerRef} className="w-full h-full" style={{ pointerEvents: 'none' }} />
}
