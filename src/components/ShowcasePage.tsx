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

// Grid + facet blended normal map
function generateNormalMap(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = TEX_W; c.height = TEX_H
  const ctx = c.getContext('2d')!

  // Base flat normal
  ctx.fillStyle = 'rgb(128, 128, 255)'
  ctx.fillRect(0, 0, TEX_W, TEX_H)

  // Grid grooves — mirrorball tile structure
  const tileSize = 10
  ctx.strokeStyle = 'rgb(128, 128, 180)'
  ctx.lineWidth = 1.5
  for (let x = 0; x < TEX_W; x += tileSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, TEX_H); ctx.stroke()
  }
  for (let y = 0; y < TEX_H; y += tileSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(TEX_W, y); ctx.stroke()
  }

  // Per-tile facet variation — each tile has a slightly different normal angle
  for (let y = 0; y < TEX_H; y += tileSize) {
    for (let x = 0; x < TEX_W; x += tileSize) {
      const nx = 128 + (Math.random() - 0.5) * 20
      const ny = 128 + (Math.random() - 0.5) * 20
      ctx.fillStyle = `rgb(${Math.round(nx)}, ${Math.round(ny)}, 245)`
      ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2)
    }
  }

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

// Country map texture (for emissive + base color)
function generateCountryMap(
  countryData: CountryFeature[],
  activeCountries: string[]
): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = TEX_W; c.height = TEX_H
  const ctx = c.getContext('2d')!

  // Ocean: very dark
  ctx.fillStyle = '#060608'
  ctx.fillRect(0, 0, TEX_W, TEX_H)

  // Land: grey (will catch metallic reflections)
  ctx.fillStyle = '#888888'
  for (const feat of countryData) {
    const isActive = activeCountries.includes(feat.name)
    ctx.fillStyle = isActive ? '#FF0CB6' : '#888888'
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
}

// Emissive map — only highlighted countries glow
function generateEmissiveMap(
  countryData: CountryFeature[],
  activeCountries: string[]
): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = TEX_W; c.height = TEX_H
  const ctx = c.getContext('2d')!

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, TEX_W, TEX_H)

  if (activeCountries.length > 0) {
    ctx.fillStyle = '#FF0CB6'
    ctx.shadowColor = '#FF0CB6'
    ctx.shadowBlur = 12
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
}

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
   CRYSTAL GLOBE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function CrystalGlobe({ countryData, activeCountries }: { countryData: CountryFeature[]; activeCountries: string[] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null)

  const normalMap = useMemo(() => generateNormalMap(), [])

  // Update maps when language changes
  const colorMap = useMemo(
    () => countryData.length > 0 ? generateCountryMap(countryData, activeCountries) : null,
    [countryData, activeCountries]
  )
  const emissiveMap = useMemo(
    () => countryData.length > 0 ? generateEmissiveMap(countryData, activeCountries) : null,
    [countryData, activeCountries]
  )

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.002
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[GLOBE_R, 14]} />
      <meshPhysicalMaterial
        ref={matRef}
        map={colorMap}
        normalMap={normalMap}
        normalScale={new THREE.Vector2(0.4, 0.4)}
        emissiveMap={emissiveMap}
        emissive="#FF0CB6"
        emissiveIntensity={activeCountries.length > 0 ? 0.6 : 0}
        metalness={0.95}
        roughness={0.05}
        transmission={0.1}
        ior={1.5}
        clearcoat={1.0}
        clearcoatRoughness={0.02}
        envMapIntensity={3.0}
        side={THREE.DoubleSide}
      />
    </mesh>
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
      <CrystalGlobe countryData={countryData} activeCountries={activeCountries} />
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
