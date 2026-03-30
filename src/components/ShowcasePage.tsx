/**
 * ShowcasePage — Crystal-Mirrorball Globe (R3F)
 * PIN 963223 route. "Layer Cake" architecture:
 * 1. Base mirrorball sphere with tiled normal map
 * 2. Translucent silver country overlay
 * 3. Hot pink glowing country highlight layer
 * 4. DANCEFLOOR 3D text ring
 * + Bloom + ChromaticAberration post-processing
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

const TEX_W = 2048, TEX_H = 1024, R = 2

/* ═══════════════════════════════════════════════════════════════
   NORMAL MAP — Small repeating tile for mirror grid
   ═══════════════════════════════════════════════════════════════ */
function makeMirrorNormalMap(): THREE.CanvasTexture {
  // One tile at 32x32 — will be repeated heavily
  const S = 32
  const c = document.createElement('canvas')
  c.width = S; c.height = S
  const ctx = c.getContext('2d')!

  // Tile face — slightly randomized normal for unique specular per tile
  const nx = 128 + (Math.random() - 0.5) * 30
  const ny = 128 + (Math.random() - 0.5) * 30
  ctx.fillStyle = `rgb(${nx|0},${ny|0},250)`
  ctx.fillRect(0, 0, S, S)

  // Groove edges — strong inward normal = visible gap between tiles
  ctx.fillStyle = 'rgb(128,128,140)'
  ctx.fillRect(0, 0, S, 2)   // top edge
  ctx.fillRect(0, 0, 2, S)   // left edge
  ctx.fillRect(S-2, 0, 2, S) // right edge
  ctx.fillRect(0, S-2, S, 2) // bottom edge

  // Specular catch — bright spot in upper-left (like light hitting a facet)
  ctx.fillStyle = 'rgb(145,145,255)'
  ctx.fillRect(4, 4, 8, 6)

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(100, 50) // dense tiling — 100 columns, 50 rows
  tex.needsUpdate = true
  return tex
}

/* ═══════════════════════════════════════════════════════════════
   GEO DATA
   ═══════════════════════════════════════════════════════════════ */
interface GeoFeature { name: string; rings: number[][][] }

async function loadGeo(): Promise<GeoFeature[]> {
  const topo = await (await fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json')).json() as Topology<{ countries: GeometryCollection }>
  const geo = feature(topo, topo.objects.countries)
  return geo.features.map(f => {
    const g = f.geometry; const rings: number[][][] = []
    if (g.type === 'Polygon') rings.push(...g.coordinates)
    else if (g.type === 'MultiPolygon') for (const p of g.coordinates) rings.push(...p)
    return { name: (f.properties as Record<string, string>)?.name || '', rings }
  })
}

// Draw country polygons onto a canvas in equirectangular projection
function drawCountries(
  geo: GeoFeature[],
  filter: (name: string) => boolean,
  color: string,
  shadow = false
): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = TEX_W; c.height = TEX_H
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, TEX_W, TEX_H)
  if (shadow) { ctx.shadowColor = color; ctx.shadowBlur = 20 }
  ctx.fillStyle = color
  for (const f of geo) {
    if (!filter(f.name)) continue
    for (const ring of f.rings) {
      ctx.beginPath()
      for (let i = 0; i < ring.length; i++) {
        const [lng, lat] = ring[i]
        const px = ((lng + 180) / 360) * TEX_W
        const py = ((90 - lat) / 180) * TEX_H
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.closePath(); ctx.fill()
    }
  }
  return c
}

/* ═══════════════════════════════════════════════════════════════
   LAYER 1: MIRRORBALL BASE
   Full metallic chrome sphere with tiled normal map grid
   ═══════════════════════════════════════════════════════════════ */
function MirrorballBase() {
  const ref = useRef<THREE.Mesh>(null)
  const nMap = useMemo(() => makeMirrorNormalMap(), [])

  useFrame(() => { if (ref.current) ref.current.rotation.y += 0.002 })

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[R, 5]} />
      <meshPhysicalMaterial
        color="#1a1a24"
        normalMap={nMap}
        normalScale={new THREE.Vector2(0.5, 0.5)}
        metalness={0.95}
        roughness={0.06}
        transmission={0.03}
        clearcoat={1.0}
        clearcoatRoughness={0.03}
        envMapIntensity={3.0}
        flatShading
      />
    </mesh>
  )
}

/* ═══════════════════════════════════════════════════════════════
   LAYER 2: TRANSLUCENT SILVER COUNTRIES (all land)
   ═══════════════════════════════════════════════════════════════ */
function LandOverlay({ geo }: { geo: GeoFeature[] }) {
  const ref = useRef<THREE.Mesh>(null)

  const map = useMemo(() => {
    if (!geo.length) return null
    const c = drawCountries(geo, () => true, 'rgba(210,210,220,0.45)')
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [geo])

  useFrame(() => { if (ref.current) ref.current.rotation.y += 0.002 })

  if (!map) return null
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[R * 1.002, 128, 128]} />
      <meshStandardMaterial
        map={map}
        transparent
        opacity={0.7}
        metalness={0.5}
        roughness={0.3}
        depthWrite={false}
      />
    </mesh>
  )
}

/* ═══════════════════════════════════════════════════════════════
   LAYER 3: GLOWING PINK HIGHLIGHT (selected countries)
   emissiveIntensity high enough to trigger Bloom
   ═══════════════════════════════════════════════════════════════ */
function GlowOverlay({ geo, active }: { geo: GeoFeature[]; active: string[] }) {
  const ref = useRef<THREE.Mesh>(null)

  const map = useMemo(() => {
    if (!geo.length || !active.length) return null
    const c = drawCountries(geo, n => active.includes(n), '#FF0CB6', true)
    return new THREE.CanvasTexture(c)
  }, [geo, active])

  useFrame(() => { if (ref.current) ref.current.rotation.y += 0.002 })

  if (!map) return null
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[R * 1.005, 128, 128]} />
      <meshStandardMaterial
        map={map}
        transparent
        color="#FF0CB6"
        emissive="#FF0CB6"
        emissiveIntensity={1.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

/* ═══════════════════════════════════════════════════════════════
   DANCEFLOOR 3D TEXT RING
   ═══════════════════════════════════════════════════════════════ */
function TextRing() {
  const gRef = useRef<THREE.Group>(null)
  const tRef = useRef<THREE.Mesh>(null)
  const bent = useRef(false)

  useFrame(() => {
    if (gRef.current) gRef.current.rotation.y += 0.002
    if (tRef.current && !bent.current) {
      const geo = tRef.current.geometry
      if (!geo.boundingBox) geo.computeBoundingBox()
      if (geo.boundingBox) {
        let w = geo.boundingBox.max.x - geo.boundingBox.min.x + 1.0
        const wr = R + 0.4
        const p = geo.attributes.position
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
          const th = (x / w) * Math.PI * 2
          const cr = wr + z
          p.setX(i, cr * Math.sin(th)); p.setY(i, y); p.setZ(i, cr * Math.cos(th))
        }
        p.needsUpdate = true; geo.computeVertexNormals()
        bent.current = true
      }
    }
  })

  return (
    <group ref={gRef}>
      <Center>
        <Text3D
          ref={tRef}
          font="https://unpkg.com/three@0.164.1/examples/fonts/helvetiker_bold.typeface.json"
          size={0.4} height={0.07} curveSegments={12}
          bevelEnabled bevelThickness={0.012} bevelSize={0.009} bevelSegments={4}
        >
          {'DANCEFLOOR   \u2022   DANCEFLOOR   \u2022   DANCEFLOOR   \u2022'}
          <meshStandardMaterial
            color="#FF0CB6"
            emissive="#FF0CB6"
            emissiveIntensity={0.8}
            metalness={0.95}
            roughness={0.08}
            envMapIntensity={2.5}
          />
        </Text3D>
      </Center>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════════
   LIGHTING
   ═══════════════════════════════════════════════════════════════ */
function Lights() {
  const k = useRef<THREE.PointLight>(null)
  const p = useRef<THREE.PointLight>(null)
  useFrame(() => {
    const t = Date.now() * 0.001
    k.current?.position.set(Math.sin(t*0.3)*5, Math.sin(t*0.2)*2+3, Math.cos(t*0.4)*5)
    p.current?.position.set(Math.cos(t*0.25)*4, Math.cos(t*0.15)*2-2, Math.sin(t*0.35)*4)
  })
  return (
    <>
      <Environment preset="studio" background={false} />
      <ambientLight intensity={0.1} />
      <pointLight ref={k} color="#ffffff" intensity={25} distance={20} />
      <pointLight ref={p} color="#FF0CB6" intensity={15} distance={20} />
      <spotLight color="#FF0CB6" intensity={10} distance={15} position={[0,5,0]} angle={0.6} penumbra={0.8} />
      <pointLight color="#ffffff" intensity={5} distance={12} position={[0,0,-5]} />
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SCENE
   ═══════════════════════════════════════════════════════════════ */
function Scene({ geo, active }: { geo: GeoFeature[]; active: string[] }) {
  return (
    <>
      <Lights />
      <MirrorballBase />
      <LandOverlay geo={geo} />
      <GlowOverlay geo={geo} active={active} />
      <TextRing />
      <EffectComposer>
        <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={0.4} mipmapBlur />
        <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={new THREE.Vector2(0.0015, 0.0015)} />
        <Vignette darkness={0.35} offset={0.3} />
      </EffectComposer>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function ShowcasePage() {
  const [geo, setGeo] = useState<GeoFeature[]>([])
  const [idx, setIdx] = useState(0)
  const [cd, setCd] = useState({ d:'00', h:'00', m:'00', s:'00' })

  const lang = languages[idx]
  const active = lang?.countries || []

  useEffect(() => { loadGeo().then(setGeo) }, [])
  useEffect(() => { const id = setInterval(() => setIdx(p => (p+1) % languages.length), 4000); return () => clearInterval(id) }, [])
  useEffect(() => {
    const tick = () => {
      const d = Math.max(0, new Date('2026-04-17T00:00:00Z').getTime() - Date.now())
      const p = (n:number) => String(n).padStart(2,'0')
      setCd({ d:p(Math.floor(d/864e5)), h:p(Math.floor(d%864e5/36e5)), m:p(Math.floor(d%36e5/6e4)), s:p(Math.floor(d%6e4/1e3)) })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  return (
    <div style={{ width:'100%', height:'100vh', overflow:'hidden', background:'#000', fontFamily:"'Sora',sans-serif" }}>
      <Canvas
        camera={{ position:[0,0,5.5], fov:45 }}
        gl={{ antialias:true, toneMapping:THREE.ACESFilmicToneMapping, toneMappingExposure:1.1 }}
        style={{ position:'fixed', inset:0 }}
      >
        <Suspense fallback={null}>
          <Scene geo={geo} active={active} />
        </Suspense>
      </Canvas>

      {/* Countdown */}
      <div style={{ position:'fixed', top:'1.5rem', left:'50%', transform:'translateX(-50%)', zIndex:50, fontFamily:"'Poppins',sans-serif", fontWeight:900, fontSize:'clamp(1.2rem,4vw,1.8rem)', color:'rgba(226,226,226,0.6)', textTransform:'uppercase', letterSpacing:'-0.02em' }}>
        {cd.d}<span style={{color:'rgba(255,12,182,0.4)',fontSize:'0.7em',marginLeft:'0.1em'}}>D</span>
        <span style={{color:'rgba(255,12,182,0.25)',margin:'0 0.12em'}}>:</span>
        {cd.h}<span style={{color:'rgba(255,12,182,0.4)',fontSize:'0.7em',marginLeft:'0.1em'}}>H</span>
        <span style={{color:'rgba(255,12,182,0.25)',margin:'0 0.12em'}}>:</span>
        {cd.m}<span style={{color:'rgba(255,12,182,0.4)',fontSize:'0.7em',marginLeft:'0.1em'}}>M</span>
        <span style={{color:'rgba(255,12,182,0.25)',margin:'0 0.12em'}}>:</span>
        {cd.s}<span style={{color:'rgba(255,12,182,0.4)',fontSize:'0.7em',marginLeft:'0.1em'}}>S</span>
      </div>

      {/* Language name — auto cycling */}
      <div key={lang?.id} style={{ position:'fixed', bottom:'4.5rem', left:'50%', transform:'translateX(-50%)', zIndex:50, fontFamily:"'Poppins',sans-serif", fontWeight:900, fontSize:'clamp(1rem,3.5vw,1.6rem)', color:'#FF0CB6', textTransform:'uppercase', letterSpacing:'-0.02em', animation:'fadeIO 4s ease-in-out', textShadow:'0 0 20px rgba(255,12,182,0.5)' }}>
        {lang?.name}
      </div>

      {/* Bottom */}
      <div style={{ position:'fixed', bottom:'1.5rem', left:'50%', transform:'translateX(-50%)', zIndex:50, textAlign:'center' }}>
        <div style={{ fontFamily:"'Sora',sans-serif", fontSize:10, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.2em', color:'rgba(226,226,226,0.3)' }}>
          50 languages &middot; 5.8 billion voices
        </div>
        <div style={{ fontFamily:"'Poppins',sans-serif", fontWeight:900, fontSize:'clamp(0.8rem,2.5vw,1rem)', textTransform:'uppercase', letterSpacing:'0.15em', color:'#FF0CB6', marginTop:4 }}>
          17 April 2026
        </div>
      </div>

      <style>{`@keyframes fadeIO { 0%{opacity:0;transform:translateX(-50%) translateY(8px)} 15%{opacity:1;transform:translateX(-50%) translateY(0)} 85%{opacity:1;transform:translateX(-50%) translateY(0)} 100%{opacity:0;transform:translateX(-50%) translateY(-8px)} }`}</style>
    </div>
  )
}
