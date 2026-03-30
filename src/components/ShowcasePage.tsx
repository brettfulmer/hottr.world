/**
 * ShowcasePage — Crystal-Mirrorball Globe (R3F)
 *
 * PIN 963223 route. Pure visual showcase — no editorial slides, no language card.
 * Faceted IcosahedronGeometry with dual normal maps (grid + facet),
 * MeshPhysicalMaterial for crystal-mirror hybrid, emissive country map,
 * auto-cycling language highlights, prismatic bloom + chromatic aberration.
 */
import { useRef, useState, useEffect, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Text3D, Center } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { languages } from '../data/languages-50'

const TEX_W = 2048, TEX_H = 1024, GLOBE_R = 2

/* ═══════════════════════════════════════════════════════════════
   TEXTURE GENERATORS
   ═══════════════════════════════════════════════════════════════ */

// Small-tile normal map — renders a small tile then tiles it across the sphere
function generateNormalMap(): THREE.CanvasTexture {
  // Small tile — will be repeated via texture.repeat
  const TILE = 64
  const c = document.createElement('canvas')
  c.width = TILE; c.height = TILE
  const ctx = c.getContext('2d')!

  // Per-tile facet angle — each tile has a unique normal direction
  const nx = 128 + (Math.random() - 0.5) * 25
  const ny = 128 + (Math.random() - 0.5) * 25
  ctx.fillStyle = `rgb(${Math.round(nx)}, ${Math.round(ny)}, 248)`
  ctx.fillRect(0, 0, TILE, TILE)

  // Grid groove edges — dark normal = inward-facing groove between tiles
  ctx.strokeStyle = 'rgb(128, 128, 160)' // strong groove
  ctx.lineWidth = 3
  ctx.strokeRect(0, 0, TILE, TILE)

  // Inner specular highlight — slight bright normal offset in top-left corner
  ctx.fillStyle = 'rgb(140, 140, 255)'
  ctx.fillRect(3, 3, TILE * 0.3, TILE * 0.25)

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  // Tile heavily so they look like small mirror squares
  tex.repeat.set(80, 40) // 80 tiles around, 40 tiles top-to-bottom
  return tex
}

/* Country map + emissive map removed — using separate geo layers instead */

/* ═══════════════════════════════════════════════════════════════
   GEO DATA
   ═══════════════════════════════════════════════════════════════ */
interface CountryFeature { name: string; rings: number[][][] }

async function loadCountryData(): Promise<CountryFeature[]> {
  const topo = await (await fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json')).json() as Topology<{ countries: GeometryCollection }>
  const geo = feature(topo, topo.objects.countries)
  return geo.features.map(feat => {
    const geom = feat.geometry
    const rings: number[][][] = []
    if (geom.type === 'Polygon') rings.push(...geom.coordinates)
    else if (geom.type === 'MultiPolygon') for (const p of geom.coordinates) rings.push(...p)
    return { name: (feat.properties as Record<string, string>)?.name || '', rings }
  })
}

/* ═══════════════════════════════════════════════════════════════
   LAYER 1: MIRRORBALL BASE SPHERE
   Pure chrome mirror with tiled normal map — the disco ball
   ═══════════════════════════════════════════════════════════════ */
function MirrorballBase() {
  const meshRef = useRef<THREE.Mesh>(null)
  const normalMap = useMemo(() => generateNormalMap(), [])

  useFrame(() => { if (meshRef.current) meshRef.current.rotation.y += 0.002 })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[GLOBE_R, 128, 128]} />
      <meshPhysicalMaterial
        color="#1a1a22"
        normalMap={normalMap}
        normalScale={new THREE.Vector2(0.6, 0.6)}
        metalness={1.0}
        roughness={0.04}
        clearcoat={1.0}
        clearcoatRoughness={0.02}
        envMapIntensity={3.5}
      />
    </mesh>
  )
}

/* ═══════════════════════════════════════════════════════════════
   LAYER 2: COUNTRY GEO OVERLAY
   Canvas-textured sphere slightly above the mirrorball surface.
   Unselected countries = translucent silver. Selected = glowing pink.
   ═══════════════════════════════════════════════════════════════ */
function CountryOverlay({ countryData, activeCountries }: { countryData: CountryFeature[]; activeCountries: string[] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  // Base country shapes — silver land on transparent ocean
  const landMap = useMemo(() => {
    if (!countryData.length) return null
    const c = document.createElement('canvas')
    c.width = TEX_W; c.height = TEX_H
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, TEX_W, TEX_H) // fully transparent ocean
    ctx.fillStyle = 'rgba(200, 200, 210, 0.5)' // translucent silver land
    for (const feat of countryData) {
      for (const ring of feat.rings) {
        ctx.beginPath()
        for (let i = 0; i < ring.length; i++) {
          const [lng, lat] = ring[i]
          const px = ((lng + 180) / 360) * TEX_W
          const py = ((90 - lat) / 180) * TEX_H
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
        }
        ctx.closePath(); ctx.fill()
      }
    }
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [countryData])

  // Highlighted countries — bright pink glow
  const glowMap = useMemo(() => {
    if (!countryData.length) return null
    const c = document.createElement('canvas')
    c.width = TEX_W; c.height = TEX_H
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, TEX_W, TEX_H)
    if (activeCountries.length > 0) {
      ctx.fillStyle = '#FF0CB6'
      ctx.shadowColor = '#FF0CB6'
      ctx.shadowBlur = 15
      for (const feat of countryData) {
        if (!activeCountries.includes(feat.name)) continue
        for (const ring of feat.rings) {
          ctx.beginPath()
          for (let i = 0; i < ring.length; i++) {
            const [lng, lat] = ring[i]
            const px = ((lng + 180) / 360) * TEX_W
            const py = ((90 - lat) / 180) * TEX_H
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
          }
          ctx.closePath(); ctx.fill()
        }
      }
    }
    const tex = new THREE.CanvasTexture(c)
    return tex
  }, [countryData, activeCountries])

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.002
    if (glowRef.current) glowRef.current.rotation.y += 0.002
  })

  return (
    <>
      {/* Silver land overlay */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[GLOBE_R * 1.002, 128, 128]} />
        <meshStandardMaterial
          map={landMap}
          transparent
          opacity={0.6}
          metalness={0.7}
          roughness={0.2}
          depthWrite={false}
        />
      </mesh>

      {/* Pink glow overlay — selected countries */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[GLOBE_R * 1.004, 128, 128]} />
        <meshStandardMaterial
          map={glowMap}
          transparent
          color="#FF0CB6"
          emissive="#FF0CB6"
          emissiveIntensity={5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   DANCEFLOOR TEXT RING
   ═══════════════════════════════════════════════════════════════ */
function DancefloorRing() {
  const groupRef = useRef<THREE.Group>(null)
  const textRef = useRef<THREE.Mesh>(null)
  const curved = useRef(false)

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.002
    // Curve text once geometry is available
    if (textRef.current && !curved.current) {
      const geo = textRef.current.geometry
      if (geo && geo.boundingBox === null) geo.computeBoundingBox()
      if (geo && geo.boundingBox) {
        let width = geo.boundingBox.max.x - geo.boundingBox.min.x
        width += 0.8
        const wrapR = GLOBE_R + 0.35
        const pos = geo.attributes.position
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
          const theta = (x / width) * Math.PI * 2
          const cr = wrapR + z
          pos.setX(i, cr * Math.sin(theta))
          pos.setY(i, y)
          pos.setZ(i, cr * Math.cos(theta))
        }
        pos.needsUpdate = true
        geo.computeVertexNormals()
        curved.current = true
      }
    }
  })

  return (
    <group ref={groupRef}>
      <Center>
        <Text3D
          ref={textRef}
          font="https://unpkg.com/three@0.164.1/examples/fonts/helvetiker_bold.typeface.json"
          size={0.35}
          height={0.06}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.01}
          bevelSize={0.008}
          bevelSegments={4}
        >
          {'DANCEFLOOR   \u2022   DANCEFLOOR   \u2022   DANCEFLOOR   \u2022'}
          <meshPhysicalMaterial
            color="#FF0CB6"
            emissive="#FF0CB6"
            emissiveIntensity={0.5}
            metalness={0.95}
            roughness={0.08}
            envMapIntensity={3.0}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
          />
        </Text3D>
      </Center>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════════
   LIGHTING
   ═══════════════════════════════════════════════════════════════ */
function NightclubLights() {
  const keyRef = useRef<THREE.PointLight>(null)
  const pinkRef = useRef<THREE.PointLight>(null)

  useFrame(() => {
    const t = Date.now() * 0.001
    if (keyRef.current) keyRef.current.position.set(Math.sin(t * 0.3) * 5, Math.sin(t * 0.2) * 2 + 3, Math.cos(t * 0.4) * 5)
    if (pinkRef.current) pinkRef.current.position.set(Math.cos(t * 0.25) * 4, Math.cos(t * 0.15) * 2 - 2, Math.sin(t * 0.35) * 4)
  })

  return (
    <>
      <Environment preset="studio" background={false} />
      <ambientLight intensity={0.15} color="#111111" />
      <pointLight ref={keyRef} color="#ffffff" intensity={50} distance={20} />
      <pointLight ref={pinkRef} color="#FF0CB6" intensity={35} distance={20} />
      <spotLight color="#FF0CB6" intensity={20} distance={15} position={[0, 5, 0]} angle={0.6} penumbra={0.8} />
      <pointLight color="#ffffff" intensity={8} distance={12} position={[0, 0, -5]} />
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SCENE
   ═══════════════════════════════════════════════════════════════ */
function Scene({ countryData, activeCountries }: { countryData: CountryFeature[]; activeCountries: string[] }) {
  return (
    <>
      <NightclubLights />
      <MirrorballBase />
      <CountryOverlay countryData={countryData} activeCountries={activeCountries} />
      <DancefloorRing />
      <EffectComposer>
        <Bloom luminanceThreshold={0.3} luminanceSmoothing={0.4} intensity={0.8} mipmapBlur />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.002, 0.002)}
        />
        <Vignette darkness={0.4} offset={0.3} />
      </EffectComposer>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SHOWCASE PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function ShowcasePage() {
  const [countryData, setCountryData] = useState<CountryFeature[]>([])
  const [langIdx, setLangIdx] = useState(0)
  const [cd, setCd] = useState({ d: '00', h: '00', m: '00', s: '00' })

  const lang = languages[langIdx]
  const activeCountries = lang?.countries || []

  // Load geo data once
  useEffect(() => { loadCountryData().then(setCountryData) }, [])

  // Auto-cycle languages every 4 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setLangIdx(prev => (prev + 1) % languages.length)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  // Countdown
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date('2026-04-17T00:00:00Z').getTime() - Date.now())
      const p = (n: number) => String(n).padStart(2, '0')
      setCd({ d: p(Math.floor(diff / 864e5)), h: p(Math.floor(diff % 864e5 / 36e5)), m: p(Math.floor(diff % 36e5 / 6e4)), s: p(Math.floor(diff % 6e4 / 1e3)) })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden', background: '#000', fontFamily: "'Sora', sans-serif" }}>
      {/* R3F Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3 }}
        style={{ position: 'fixed', inset: 0 }}
      >
        <Suspense fallback={null}>
          <Scene countryData={countryData} activeCountries={activeCountries} />
        </Suspense>
      </Canvas>

      {/* Countdown */}
      <div style={{
        position: 'fixed', top: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 50,
        fontFamily: "'Poppins', sans-serif", fontWeight: 900,
        fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', color: 'rgba(226,226,226,0.6)',
        textTransform: 'uppercase', letterSpacing: '-0.02em',
      }}>
        {cd.d}<span style={{ color: 'rgba(255,12,182,0.4)', fontSize: '0.7em', marginLeft: '0.1em' }}>D</span>
        <span style={{ color: 'rgba(255,12,182,0.25)', margin: '0 0.12em' }}>:</span>
        {cd.h}<span style={{ color: 'rgba(255,12,182,0.4)', fontSize: '0.7em', marginLeft: '0.1em' }}>H</span>
        <span style={{ color: 'rgba(255,12,182,0.25)', margin: '0 0.12em' }}>:</span>
        {cd.m}<span style={{ color: 'rgba(255,12,182,0.4)', fontSize: '0.7em', marginLeft: '0.1em' }}>M</span>
        <span style={{ color: 'rgba(255,12,182,0.25)', margin: '0 0.12em' }}>:</span>
        {cd.s}<span style={{ color: 'rgba(255,12,182,0.4)', fontSize: '0.7em', marginLeft: '0.1em' }}>S</span>
      </div>

      {/* Auto-cycling language name */}
      <div
        key={lang?.id}
        style={{
          position: 'fixed', bottom: '4.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 50,
          fontFamily: "'Poppins', sans-serif", fontWeight: 900,
          fontSize: 'clamp(1rem, 3.5vw, 1.6rem)', color: '#FF0CB6',
          textTransform: 'uppercase', letterSpacing: '-0.02em',
          animation: 'fadeInOut 4s ease-in-out',
          textShadow: '0 0 20px rgba(255,12,182,0.5)',
        }}
      >
        {lang?.name}
      </div>

      {/* Bottom label */}
      <div style={{
        position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 50, textAlign: 'center',
      }}>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(226,226,226,0.3)' }}>
          50 languages &middot; 5.8 billion voices
        </div>
        <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 'clamp(0.8rem, 2.5vw, 1rem)', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#FF0CB6', marginTop: 4 }}>
          17 April 2026
        </div>
      </div>

      {/* CSS animation for language name cycling */}
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(-50%) translateY(8px); }
          15% { opacity: 1; transform: translateX(-50%) translateY(0); }
          85% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-8px); }
        }
      `}</style>
    </div>
  )
}
