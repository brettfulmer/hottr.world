/**
 * ShowcasePage — Mirrorball Globe + 5x Swarovski Crystals + Curved Text (R3F)
 */
import { useRef, useState, useEffect, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Text3D } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { languages } from '../data/languages-50'

const TEX_W = 2048, TEX_H = 1024, R = 2

/* ═══════════════════════════════════════════════════════════════
   GEO DATA & SWAROVSKI COORDINATE MATH
   ═══════════════════════════════════════════════════════════════ */
interface GeoFeature { name: string; rings: number[][][]; mnLng: number; mxLng: number; mnLat: number; mxLat: number }
export interface CrystalPoint { lat: number; lng: number; country: string }

function pointInRing(px: number, py: number, ring: number[][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

async function loadGeo(): Promise<{ geo: GeoFeature[], points: CrystalPoint[] }> {
  const topo = await (await fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json')).json() as Topology<{ countries: GeometryCollection }>
  const geo = feature(topo, topo.objects.countries)
  
  const features = geo.features.map(f => {
    const g = f.geometry; const rings: number[][][] = []
    if (g.type === 'Polygon') rings.push(...g.coordinates)
    else if (g.type === 'MultiPolygon') for (const p of g.coordinates) rings.push(...p)
    
    let mnLng = Infinity, mxLng = -Infinity, mnLat = Infinity, mxLat = -Infinity
    for (const r of rings) {
      for (const [ln, lt] of r) {
        if (ln < mnLng) mnLng = ln; if (ln > mxLng) mxLng = ln
        if (lt < mnLat) mnLat = lt; if (lt > mxLat) mxLat = lt
      }
    }
    return { name: (f.properties as Record<string, string>)?.name || '', rings, mnLng, mxLng, mnLat, mxLat }
  })

  // Generate coordinate points for crystals (5x Density = 0.9 degree steps instead of 2.0)
  const pts: CrystalPoint[] = []
  for (let lat = -85; lat <= 85; lat += 0.9) {
    const s = 0.9 / Math.max(Math.cos(lat*Math.PI/180), 0.2)
    for (let lng = -180; lng < 180; lng += s) pts.push({ lat, lng, country: '' })
  }

  // Non-blocking batch processing mapping points to countries
  return new Promise((resolve) => {
    let idx = 0
    const batch = () => {
      const end = Math.min(idx + 500, pts.length)
      for (let i = idx; i < end; i++) {
        const pt = pts[i]
        for (const f of features) {
          if (pt.lng < f.mnLng || pt.lng > f.mxLng || pt.lat < f.mnLat || pt.lat > f.mxLat) continue
          let found = false
          for (const r of f.rings) {
            if (pointInRing(pt.lng, pt.lat, r)) { pt.country = f.name; found = true; break }
          }
          if (found) break
        }
      }
      idx = end
      if (idx < pts.length) setTimeout(batch, 0)
      else resolve({ geo: features, points: pts })
    }
    batch()
  })
}

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
  if (shadow) { ctx.shadowColor = color; ctx.shadowBlur = 15 }
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
   LAYER 1, 2, 3: GLOBE BASE & GLOW (Mirrorball Tiles)
   ═══════════════════════════════════════════════════════════════ */
function MirrorballBase() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => { if (ref.current) ref.current.rotation.y += 0.002 })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[R, 50, 30]} />
      <meshStandardMaterial color="#a0a0b0" metalness={1.0} roughness={0.15} envMapIntensity={2.5} flatShading={true} />
    </mesh>
  )
}

function LandOverlay({ geo }: { geo: GeoFeature[] }) {
  const ref = useRef<THREE.Mesh>(null)
  const map = useMemo(() => {
    if (!geo.length) return null
    const c = drawCountries(geo, () => true, 'rgba(180,180,195,0.4)')
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [geo])
  useFrame(() => { if (ref.current) ref.current.rotation.y += 0.002 })
  if (!map) return null
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[R * 1.002, 50, 30]} />
      <meshStandardMaterial map={map} transparent depthWrite={false} metalness={0.8} roughness={0.2} flatShading={true} />
    </mesh>
  )
}

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
      <sphereGeometry args={[R * 1.004, 50, 30]} />
      <meshStandardMaterial map={map} transparent color="#FF0CB6" emissive="#FF0CB6" emissiveIntensity={4.0} depthWrite={false} blending={THREE.AdditiveBlending} flatShading={true} />
    </mesh>
  )
}

/* ═══════════════════════════════════════════════════════════════
   LAYER 4: SWAROVSKI CRYSTALS (Instanced Mesh Overlay)
   ═══════════════════════════════════════════════════════════════ */
function SwarovskiOverlay({ points, active }: { points: CrystalPoint[]; active: string[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const COUNT = points.length
  
  const bScales = useMemo(() => new Float32Array(COUNT), [COUNT])
  const tilts = useMemo(() => new Float32Array(COUNT), [COUNT])

  // Strict Coloring Rules
  const HOT_PINK = useMemo(() => new THREE.Color('#FF0CB6'), [])
  const DIAMOND = useMemo(() => new THREE.Color('#FFFFFF'), [])
  const OCEAN = useMemo(() => new THREE.Color('#050608'), [])

  useEffect(() => {
    if (!meshRef.current || points.length === 0) return
    const mesh = meshRef.current
    const dummy = new THREE.Object3D()

    const ll2v = (lat: number, lng: number) => {
      const phi = (90 - lat) * Math.PI / 180, theta = (lng + 180) * Math.PI / 180
      // Position crystals slightly above GlowOverlay
      return new THREE.Vector3(-(R + 0.006) * Math.sin(phi) * Math.cos(theta), (R + 0.006) * Math.cos(phi), (R + 0.006) * Math.sin(phi) * Math.sin(theta))
    }

    for (let i = 0; i < points.length; i++) {
      const pos = ll2v(points[i].lat, points[i].lng)
      dummy.position.copy(pos)
      dummy.lookAt(0, 0, 0)
      dummy.rotateZ(Math.random() * Math.PI * 2)
      
      const sc = 0.9 + Math.random() * 0.2
      bScales[i] = sc
      tilts[i] = Math.random() * Math.PI * 2
      
      dummy.scale.setScalar(sc)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      // Strict Color Application
      let c: THREE.Color
      if (points[i].country) {
        c = active.includes(points[i].country) ? HOT_PINK : DIAMOND
      } else {
        c = OCEAN
      }
      mesh.setColorAt(i, c)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.instanceColor!.needsUpdate = true
  }, [points, active, HOT_PINK, DIAMOND, OCEAN, bScales, tilts])

  // Crystal Twinkle/Shimmer Animation
  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    mesh.rotation.y += 0.002

    const time = clock.getElapsedTime()
    const tM = new THREE.Matrix4(), tP = new THREE.Vector3(), tQ = new THREE.Quaternion(), tS = new THREE.Vector3()

    for (let n = 0; n < 60; n++) {
      const i = Math.floor(Math.random() * COUNT)
      mesh.getMatrixAt(i, tM)
      tM.decompose(tP, tQ, tS)
      const shimmer = Math.sin(time * 1.5 + tilts[i] * 4) * 0.5 + 0.5
      tS.setScalar(bScales[i] * (1 - 0.05 + shimmer * 0.1))
      tM.compose(tP, tQ, tS)
      mesh.setMatrixAt(i, tM)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  // Reduced crystal size slightly (0.014 to 0.009) to accommodate 5x density without merging into a blob
  const geometry = useMemo(() => new THREE.OctahedronGeometry(0.009, 0), [])

  if (points.length === 0) return null

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, points.length]}>
      <meshPhysicalMaterial
        transmission={0.15} roughness={0.08} ior={2.4} thickness={0.3}
        clearcoat={1} clearcoatRoughness={0.02} metalness={0.35} transparent={true} side={THREE.DoubleSide} envMapIntensity={2.5}
      />
    </instancedMesh>
  )
}

/* ═══════════════════════════════════════════════════════════════
   DANCEFLOOR 3D TEXT RING (Mathematically Curved)
   ═══════════════════════════════════════════════════════════════ */
function CurvedTextLabel() {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const warped = useRef(false)

  // Rotate entire group with the globe
  useFrame(() => { 
    if (groupRef.current) groupRef.current.rotation.y += 0.002 
  })

  useEffect(() => {
    // Only bend the vertices once when geometry is ready
    if (!meshRef.current || warped.current) return
    const geo = meshRef.current.geometry as TextGeometry
    if (!geo.boundingBox) {
        geo.center()
        geo.computeBoundingBox()
    }

    const wrapRadius = R + 0.8
    const posAttr = geo.attributes.position

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i), y = posAttr.getY(i), z = posAttr.getZ(i)
      // Map flat X coordinate to radians around the curve
      const theta = (x / wrapRadius)
      // Push radius out to Z depth
      const cr = wrapRadius + z
      
      posAttr.setX(i, cr * Math.sin(theta))
      posAttr.setY(i, y)
      posAttr.setZ(i, cr * Math.cos(theta))
    }
    
    posAttr.needsUpdate = true
    geo.computeVertexNormals()
    warped.current = true
  }, [])

  return (
    <group ref={groupRef}>
      {/* Notice NO position shift on the group—the vertex math naturally places it at the surface */}
      <Text3D
        ref={meshRef}
        font="https://unpkg.com/three@0.164.1/examples/fonts/helvetiker_bold.typeface.json"
        size={0.28} height={0.08} curveSegments={12}
        bevelEnabled bevelThickness={0.01} bevelSize={0.005} bevelSegments={4}
      >
        DANCEFLOOR
        <meshStandardMaterial
          color="#FF0CB6" emissive="#FF0CB6" emissiveIntensity={0.15} 
          metalness={1.0} roughness={0.05} envMapIntensity={2.5}
        />
      </Text3D>
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
      <pointLight ref={k} color="#ffffff" intensity={20} distance={20} />
      <pointLight ref={p} color="#FF0CB6" intensity={10} distance={20} />
      <spotLight color="#FF0CB6" intensity={8} distance={15} position={[0,5,0]} angle={0.6} penumbra={0.8} />
      <pointLight color="#ffffff" intensity={5} distance={12} position={[0,0,-5]} />
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SCENE
   ═══════════════════════════════════════════════════════════════ */
function Scene({ geo, points, active }: { geo: GeoFeature[]; points: CrystalPoint[]; active: string[] }) {
  return (
    <>
      <Lights />
      <MirrorballBase />
      <LandOverlay geo={geo} />
      <GlowOverlay geo={geo} active={active} />
      <SwarovskiOverlay points={points} active={active} />
      <CurvedTextLabel />
      <EffectComposer enableNormalPass={false}>
        <Bloom luminanceThreshold={1.0} luminanceSmoothing={0.1} intensity={1.2} mipmapBlur />
        <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={new THREE.Vector2(0.0015, 0.0015)} />
        <Vignette darkness={0.4} offset={0.3} />
      </EffectComposer>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function ShowcasePage() {
  const [data, setData] = useState<{geo: GeoFeature[], points: CrystalPoint[]}>({ geo: [], points: [] })
  const [idx, setIdx] = useState(0)
  const [cd, setCd] = useState({ d:'00', h:'00', m:'00', s:'00' })

  const lang = languages[idx]
  const active = lang?.countries || []

  useEffect(() => { loadGeo().then(setData) }, [])
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
          <Scene geo={data.geo} points={data.points} active={active} />
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