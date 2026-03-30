/**
 * ShowcasePage — Pure Crystal Globe + Smooth Transitions + 3x Curved Text (R3F)
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

const R = 2

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

  // Generate coordinate points for crystals (5x Density = 0.9 degree steps)
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

/* ═══════════════════════════════════════════════════════════════
   LAYER 1: MATTE BLACK VOID CORE (Prevents seeing through the earth)
   ═══════════════════════════════════════════════════════════════ */
function VoidCore() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => { if (ref.current) ref.current.rotation.y += 0.002 })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[R, 50, 30]} />
      {/* Pure black, no reflection, just blocks the backface crystals */}
      <meshStandardMaterial color="#000000" metalness={0} roughness={1} />
    </mesh>
  )
}

/* ═══════════════════════════════════════════════════════════════
   LAYER 2: SWAROVSKI CRYSTALS (Instanced Mesh Overlay)
   ═══════════════════════════════════════════════════════════════ */
function SwarovskiOverlay({ points, active }: { points: CrystalPoint[]; active: string[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const COUNT = points.length
  
  const bScales = useMemo(() => new Float32Array(COUNT), [COUNT])
  const tilts = useMemo(() => new Float32Array(COUNT), [COUNT])
  
  // Arrays for smooth color interpolation and animation flags
  const currentCols = useMemo(() => new Array(COUNT).fill(null).map(() => new THREE.Color()), [COUNT])
  const targetCols = useMemo(() => new Array(COUNT).fill(null).map(() => new THREE.Color()), [COUNT])
  const isActiveArray = useMemo(() => new Uint8Array(COUNT), [COUNT])

  const HOT_PINK = useMemo(() => new THREE.Color('#FF0CB6'), [])
  const DIAMOND = useMemo(() => new THREE.Color('#FFFFFF'), [])
  const OCEAN = useMemo(() => new THREE.Color('#020202'), [])

  // Initial Matrix Placement
  useEffect(() => {
    if (!meshRef.current || points.length === 0) return
    const mesh = meshRef.current
    const dummy = new THREE.Object3D()

    const ll2v = (lat: number, lng: number) => {
      const phi = (90 - lat) * Math.PI / 180, theta = (lng + 180) * Math.PI / 180
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

      // Initialize all colors immediately to prevent black flash
      const c = points[i].country ? (active.includes(points[i].country) ? HOT_PINK : DIAMOND) : OCEAN
      currentCols[i].copy(c)
      mesh.setColorAt(i, currentCols[i])
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.instanceColor!.needsUpdate = true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points])

  // Update Targets on Language Change
  useEffect(() => {
    if (points.length === 0) return
    for (let i = 0; i < points.length; i++) {
      const country = points[i].country
      if (country) {
        if (active.includes(country)) {
          targetCols[i].copy(HOT_PINK)
          isActiveArray[i] = 1
        } else {
          targetCols[i].copy(DIAMOND)
          isActiveArray[i] = 0
        }
      } else {
        targetCols[i].copy(OCEAN)
        isActiveArray[i] = 0
      }
    }
  }, [points, active, HOT_PINK, DIAMOND, OCEAN, targetCols, isActiveArray])

  // Animation Loop: Interpolate Colors & Execute Twinkle/Pulse
  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    mesh.rotation.y += 0.002

    const time = clock.getElapsedTime()
    let needsColorUpdate = false

    // Smooth Fade Interpolation
    for (let i = 0; i < COUNT; i++) {
      if (currentCols[i].r !== targetCols[i].r || currentCols[i].g !== targetCols[i].g || currentCols[i].b !== targetCols[i].b) {
        currentCols[i].lerp(targetCols[i], 0.08) // Speed of the fade
        mesh.setColorAt(i, currentCols[i])
        needsColorUpdate = true
      }
    }
    if (needsColorUpdate) mesh.instanceColor!.needsUpdate = true

    // Twinkle & Pulse Engine
    const tM = new THREE.Matrix4(), tP = new THREE.Vector3(), tQ = new THREE.Quaternion(), tS = new THREE.Vector3()
    
    // Process 200 random crystals per frame for shimmer efficiency
    for (let n = 0; n < 200; n++) {
      const i = Math.floor(Math.random() * COUNT)
      mesh.getMatrixAt(i, tM)
      tM.decompose(tP, tQ, tS)
      
      const shimmer = Math.sin(time * 2.0 + tilts[i] * 4) * 0.5 + 0.5
      let scaleMult = 1 - 0.05 + shimmer * 0.15

      // ACTIVE HIGHLIGHT SPARKLE: Pink crystals bulge aggressively
      if (isActiveArray[i] === 1) {
        scaleMult = 1.0 + shimmer * 0.6
      }

      tS.setScalar(bScales[i] * scaleMult)
      tM.compose(tP, tQ, tS)
      mesh.setMatrixAt(i, tM)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  const geometry = useMemo(() => new THREE.OctahedronGeometry(0.009, 0), [])

  if (points.length === 0) return null

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, points.length]}>
      {/* High reflectivity to ensure the black oceans still catch sharp studio light edges */}
      <meshPhysicalMaterial
        transmission={0.15} roughness={0.05} ior={2.4} thickness={0.3}
        clearcoat={1} clearcoatRoughness={0.02} metalness={0.5} transparent={true} side={THREE.DoubleSide} envMapIntensity={3.0}
      />
    </instancedMesh>
  )
}

/* ═══════════════════════════════════════════════════════════════
   DANCEFLOOR 3D TEXT RING (Curved & 3x Repeated)
   ═══════════════════════════════════════════════════════════════ */
function CurvedTextLabel({ text, rotY }: { text: string; rotY: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const warped = useRef(false)

  useEffect(() => {
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
      const theta = (x / wrapRadius)
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
    <group rotation={[0, rotY, 0]}>
      <Text3D
        ref={meshRef}
        font="https://unpkg.com/three@0.164.1/examples/fonts/helvetiker_bold.typeface.json"
        size={0.28} height={0.08} curveSegments={12}
        bevelEnabled bevelThickness={0.01} bevelSize={0.005} bevelSegments={4}
      >
        {text}
        <meshStandardMaterial
          color="#FF0CB6" emissive="#FF0CB6" emissiveIntensity={0.15} 
          metalness={1.0} roughness={0.05} envMapIntensity={2.5}
        />
      </Text3D>
    </group>
  )
}

function ContinuousTextRing() {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame(() => { 
    if (groupRef.current) groupRef.current.rotation.y += 0.002 
  })

  // Using invisible zero-width spaces (\u200B) ensures Three.js treats them as 3 unique geometries.
  // This prevents the "double bending" bug when sharing geometries.
  return (
    <group ref={groupRef}>
      <CurvedTextLabel text="DANCEFLOOR" rotY={0} />
      <CurvedTextLabel text="DANCEFLOOR​" rotY={(2 * Math.PI) / 3} />
      <CurvedTextLabel text="DANCEFLOOR​​" rotY={(4 * Math.PI) / 3} />
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
function Scene({ points, active }: { points: CrystalPoint[]; active: string[] }) {
  return (
    <>
      <Lights />
      <VoidCore />
      <SwarovskiOverlay points={points} active={active} />
      <ContinuousTextRing />
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
          <Scene points={data.points} active={active} />
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