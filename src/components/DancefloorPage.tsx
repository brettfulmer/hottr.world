import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'

/* ═══ GEO ENGINE ═══ */
interface CrystalPoint { lat: number; lng: number; country: string }

function pointInRing(px: number, py: number, ring: number[][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

async function loadGeoData(points: CrystalPoint[], onComplete: () => void) {
  try {
    const topo = await (await fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json')).json() as Topology<{ countries: GeometryCollection }>
    const geo = feature(topo, topo.objects.countries)
    const prepared = geo.features.map(feat => {
      const geom = feat.geometry
      const rings: number[][][] = []
      if (geom.type === 'Polygon') rings.push(...geom.coordinates)
      else if (geom.type === 'MultiPolygon') for (const p of geom.coordinates) rings.push(...p)
      let mnLng = Infinity, mxLng = -Infinity, mnLat = Infinity, mxLat = -Infinity
      for (const r of rings) for (const [ln, lt] of r) { if (ln < mnLng) mnLng = ln; if (ln > mxLng) mxLng = ln; if (lt < mnLat) mnLat = lt; if (lt > mxLat) mxLat = lt }
      return { name: (feat.properties as Record<string, string>)?.name || '', rings, mnLng, mxLng, mnLat, mxLat }
    })
    let idx = 0
    const batch = () => {
      const end = Math.min(idx + 500, points.length)
      for (let i = idx; i < end; i++) {
        const { lat, lng } = points[i]
        for (const f of prepared) {
          if (lng < f.mnLng || lng > f.mxLng || lat < f.mnLat || lat > f.mxLat) continue
          for (const r of f.rings) { if (pointInRing(lng, lat, r)) { points[i].country = f.name; break } }
          if (points[i].country) break
        }
      }
      idx = end
      if (idx < points.length) setTimeout(batch, 0)
      else onComplete()
    }
    batch()
  } catch { onComplete() }
}

/* ═══ 50 LANGUAGES — sorted most spoken → least spoken ═══ */
import { languages as LANGS } from '../data/languages-50'

/* ═══ COMPONENT ═══ */
export default function DancefloorPage() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const [slide, setSlide] = useState(0)
  const [showUI, setShowUI] = useState(false)
  const [langIdx, setLangIdx] = useState(0)
  const slideRef = useRef(0)
  const locked = useRef(false)
  const autoTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [cardCollapsed, setCardCollapsed] = useState(false)

  const threeRef = useRef<{
    choreo: number; morphStart: number; textDropStart: number
    bloom: UnrealBloomPass; mesh: THREE.InstancedMesh
    curCols: THREE.Color[]; globeCols: THREE.Color[]; pts: CrystalPoint[]
    geoReady: boolean; textMesh3D: THREE.Mesh | null
    langTrans: { targets: THREE.Color[]; startCols: THREE.Color[]; start: number; duration: number } | null
    COUNT: number; bScales: Float32Array; tilts: Float32Array; globeGroup: THREE.Group
  } | null>(null)

  const TOTAL = 4
  const MORPH_MS = 2000
  const TEXT_SLAM_MS = 200
  const PINK = new THREE.Color('#FF0CB6')
  const LAND = new THREE.Color('#FFFFFF')
  const OCEAN = new THREE.Color('#050608')
  const AUTO_DELAYS = [6000, 4000, 3000, 4000] // auto-advance per slide

  const highlightLang = useCallback((idx: number) => {
    const t = threeRef.current
    if (!t || !t.geoReady) return
    const lang = LANGS[idx]
    const targets: THREE.Color[] = [], startCols: THREE.Color[] = []
    for (let i = 0; i < t.COUNT; i++) {
      startCols[i] = t.curCols[i].clone()
      const c = t.pts[i].country
      targets[i] = (c && lang.countries.includes(c)) ? PINK.clone() : t.globeCols[i].clone()
    }
    t.langTrans = { targets, startCols, start: Date.now(), duration: 600 }
  }, [])

  const cycleLang = useCallback((dir: number) => {
    setLangIdx(prev => {
      const next = ((prev + dir) % LANGS.length + LANGS.length) % LANGS.length
      highlightLang(next)
      return next
    })
  }, [highlightLang])

  // Advance — uses ref so no stale closure
  const advance = useCallback(() => {
    if (locked.current || slideRef.current >= TOTAL) return
    locked.current = true
    clearTimeout(autoTimer.current)
    const next = slideRef.current + 1
    slideRef.current = next
    setSlide(next)
    if (next >= TOTAL) {
      const t = threeRef.current
      if (t) {
        setTimeout(() => { t.choreo = 1 }, 200)
        setTimeout(() => {
          t.choreo = 2
          if (flashRef.current) flashRef.current.classList.add('fire')
          t.bloom.strength = 3.0
          const white = new THREE.Color('#FFFFFF')
          for (let i = 0; i < t.COUNT; i++) { t.curCols[i].copy(white); t.mesh.setColorAt(i, white) }
          t.mesh.instanceColor!.needsUpdate = true
          if (t.textMesh3D) { t.textMesh3D.visible = true; t.textDropStart = Date.now() }
          setTimeout(() => { t.choreo = 3; t.morphStart = Date.now() }, TEXT_SLAM_MS)
        }, 2500)
      }
    }
    setTimeout(() => { locked.current = false }, 500)
  }, [])

  // Auto-advance timer
  useEffect(() => {
    if (slide >= TOTAL) return
    autoTimer.current = setTimeout(advance, AUTO_DELAYS[slide])
    return () => clearTimeout(autoTimer.current)
  }, [slide, advance])

  // Input handlers
  useEffect(() => {
    if (slideRef.current >= TOTAL) return
    const onWheel = (e: WheelEvent) => { e.preventDefault(); if (Math.abs(e.deltaY) > 8) advance() }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [slide, advance])

  useEffect(() => {
    let ty: number | null = null
    const onStart = (e: TouchEvent) => { ty = e.touches[0].clientY }
    const onEnd = (e: TouchEvent) => { if (ty !== null && slideRef.current < TOTAL && e.changedTouches[0].clientY - ty < -25) advance(); ty = null }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd) }
  }, [advance])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (slideRef.current < TOTAL && (e.key === 'ArrowDown' || e.key === ' ')) { e.preventDefault(); advance() }
      if (threeRef.current?.choreo === 4) {
        if (e.key === 'ArrowLeft') cycleLang(-1)
        if (e.key === 'ArrowRight') cycleLang(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance, cycleLang])

  // Countdown
  const [cd, setCd] = useState({ d: '00', h: '00', m: '00', s: '00' })
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date('2026-04-17T00:00:00Z').getTime() - Date.now())
      const p = (n: number) => String(n).padStart(2, '0')
      setCd({ d: p(Math.floor(diff / 864e5)), h: p(Math.floor(diff % 864e5 / 36e5)), m: p(Math.floor(diff % 36e5 / 6e4)), s: p(Math.floor(diff % 6e4 / 1e3)) })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  /* ═══ THREE.JS SCENE ═══ */
  useEffect(() => {
    const container = canvasRef.current
    if (!container) return
    const W = container.clientWidth, H = container.clientHeight
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000)
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100); camera.position.set(0, 0, 6)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(W, H); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(renderer); pmrem.compileEquirectangularShader()
    const envScene = new THREE.Scene(); envScene.background = new THREE.Color(0x020204)
    const sg = new THREE.SphereGeometry(0.5, 16, 16)
    ;([[5,5,5,0xffffff,8],[-5,3,-5,0xFF0CB6,6],[3,-4,6,0xffffff,4],[-4,-2,-3,0xFF0CB6,3]] as [number,number,number,number,number][]).forEach(([x,y,z,c,intensity]) => {
      const mat = new THREE.MeshBasicMaterial({ color: c }); mat.color.multiplyScalar(intensity)
      const m = new THREE.Mesh(sg, mat); m.position.set(x,y,z); envScene.add(m)
    })
    const envMap = pmrem.fromScene(envScene, 0.04).texture
    envScene.traverse(c => { if ((c as THREE.Mesh).geometry) (c as THREE.Mesh).geometry.dispose(); if ((c as THREE.Mesh).material) ((c as THREE.Mesh).material as THREE.Material).dispose() })
    scene.environment = envMap

    const R = 2
    const ll2v = (lat: number, lng: number) => {
      const phi = (90-lat)*Math.PI/180, theta = (lng+180)*Math.PI/180
      return new THREE.Vector3(-R*Math.sin(phi)*Math.cos(theta), R*Math.cos(phi), R*Math.sin(phi)*Math.sin(theta))
    }

    const pts: CrystalPoint[] = []
    for (let lat = -85; lat <= 85; lat += 2) {
      const s = 2 / Math.max(Math.cos(lat*Math.PI/180), 0.2)
      for (let lng = -180; lng < 180; lng += s) pts.push({ lat, lng, country: '' })
    }
    const COUNT = pts.length

    const crystalMat = new THREE.MeshPhysicalMaterial({
      transmission: 0.15, roughness: 0.08, ior: 2.4, thickness: 0.3,
      clearcoat: 1, clearcoatRoughness: 0.02, envMap, envMapIntensity: 2.5,
      metalness: 0.35, transparent: true, side: THREE.DoubleSide,
    })

    const mesh = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.014, 0), crystalMat, COUNT)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

    const dPal = [new THREE.Color('#080810'),new THREE.Color('#1a1a22'),new THREE.Color('#2a2a35'),new THREE.Color('#FFFFFF'),new THREE.Color('#FF0CB6')]
    const dW = [0.35, 0.6, 0.75, 0.9, 1.0]
    const dummy = new THREE.Object3D()
    const bScales = new Float32Array(COUNT), tilts = new Float32Array(COUNT)
    const globeCols: THREE.Color[] = [], curCols: THREE.Color[] = []

    for (let i = 0; i < COUNT; i++) {
      const pos = ll2v(pts[i].lat, pts[i].lng)
      dummy.position.copy(pos); dummy.lookAt(0,0,0); dummy.rotateZ(Math.random()*Math.PI*2)
      const sc = 0.9 + Math.random()*0.2; bScales[i] = sc; tilts[i] = Math.random()*Math.PI*2
      dummy.scale.setScalar(sc); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix)
      let r = Math.random(), ci = 0
      for (let j = 0; j < dW.length; j++) { if (r < dW[j]) { ci = j; break } }
      globeCols[i] = new THREE.Color('#050608')
      curCols[i] = dPal[ci].clone(); mesh.setColorAt(i, curCols[i])
    }
    mesh.instanceColor!.needsUpdate = true

    const inner = new THREE.Mesh(new THREE.SphereGeometry(R-0.01,48,48), new THREE.MeshBasicMaterial({color:0x050608,transparent:true,opacity:0.4}))
    const globeGroup = new THREE.Group(); globeGroup.add(mesh); globeGroup.add(inner); scene.add(globeGroup)

    // 3D Text
    let textMesh3D: THREE.Mesh | null = null
    const textMat = new THREE.MeshPhysicalMaterial({
      color: 0xFF0CB6, emissive: 0xFF0CB6, emissiveIntensity: 0.4,
      metalness: 0.9, roughness: 0.1, envMap, envMapIntensity: 3.0, clearcoat: 1, clearcoatRoughness: 0.1,
    })
    const fontLoader = new FontLoader()
    fontLoader.load('https://unpkg.com/three@0.164.1/examples/fonts/helvetiker_bold.typeface.json', (font) => {
      const textGeo = new TextGeometry('DANCEFLOOR   \u2022   DANCEFLOOR   \u2022   DANCEFLOOR   \u2022', {
        font, size: 0.45, depth: 0.08, curveSegments: 12,
        bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.01, bevelSegments: 4,
      })
      textGeo.computeBoundingBox()
      let width = textGeo.boundingBox!.max.x - textGeo.boundingBox!.min.x; width += 1.2
      const wrapRadius = R + 0.4
      const posAttr = textGeo.attributes.position
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i), y = posAttr.getY(i), z = posAttr.getZ(i)
        const theta = (x / width) * Math.PI * 2
        const cr = wrapRadius + z
        posAttr.setX(i, cr * Math.sin(theta)); posAttr.setY(i, y); posAttr.setZ(i, cr * Math.cos(theta))
      }
      posAttr.needsUpdate = true; textGeo.computeVertexNormals()
      textMesh3D = new THREE.Mesh(textGeo, textMat); textMesh3D.visible = false; textMesh3D.scale.setScalar(2.0)
      globeGroup.add(textMesh3D)
      if (threeRef.current) threeRef.current.textMesh3D = textMesh3D
    })

    scene.add(new THREE.AmbientLight(0x111111, 0.3))
    const kL = new THREE.PointLight(0xffffff, 40, 20); kL.position.set(4,3,4); scene.add(kL)
    const pL = new THREE.PointLight(0xFF0CB6, 30, 20); pL.position.set(-3,-2,4); scene.add(pL)
    scene.add(new THREE.PointLight(0xffffff, 10, 15).translateZ(-5))

    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.6, 0.4, 0.85)
    composer.addPass(bloom)

    let geoReady = false
    loadGeoData(pts, () => {
      for (let i = 0; i < COUNT; i++) globeCols[i] = pts[i].country ? LAND.clone() : OCEAN.clone()
      geoReady = true
      if (threeRef.current) threeRef.current.geoReady = true
    })

    threeRef.current = {
      choreo: 0, morphStart: 0, textDropStart: 0, bloom, mesh, curCols, globeCols, pts,
      geoReady, textMesh3D: null, langTrans: null, COUNT, bScales, tilts, globeGroup,
    }

    const tM = new THREE.Matrix4(), tP = new THREE.Vector3(), tQ = new THREE.Quaternion(), tS = new THREE.Vector3()
    let rafId = 0

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      const t = threeRef.current!
      const now = Date.now(), time = now * 0.001

      globeGroup.rotation.y += (t.choreo === 1 ? 0.04 : 0.002)
      kL.position.set(Math.sin(time*0.3)*5, Math.sin(time*0.2)*2+2, Math.cos(time*0.4)*5)
      pL.position.set(Math.cos(time*0.25)*4, Math.cos(time*0.15)*2-1, Math.sin(time*0.35)*4)

      // 3D text slam
      if (t.textMesh3D && t.textMesh3D.visible && t.choreo >= 2) {
        const elapsed = now - t.textDropStart
        if (elapsed < TEXT_SLAM_MS) {
          const p = Math.min(elapsed / TEXT_SLAM_MS, 1)
          t.textMesh3D.scale.setScalar(2.0 * (1 - (1 - Math.pow(1 - p, 3))) + 1.0 * (1 - Math.pow(1 - p, 3)))
        } else { t.textMesh3D.position.y = 0; t.textMesh3D.scale.setScalar(1.0) }
      }

      // Morph
      if (t.choreo === 3) {
        const elapsed = now - t.morphStart, p = Math.min(elapsed / MORPH_MS, 1), ease = 1 - Math.pow(1 - p, 3)
        bloom.strength = 3.0*(1-ease)+0.6*ease; bloom.threshold = 0.85*(1-ease)+0.2*ease
        const white = new THREE.Color('#FFFFFF')
        for (let i = 0; i < COUNT; i++) { t.curCols[i].copy(white).lerp(t.globeCols[i], ease); mesh.setColorAt(i, t.curCols[i]) }
        mesh.instanceColor!.needsUpdate = true
        if (p >= 1) {
          t.choreo = 4; bloom.strength = 0.6; bloom.threshold = 0.2; setShowUI(true)
          const lang = LANGS[0]
          const targets: THREE.Color[] = [], startCols: THREE.Color[] = []
          for (let i = 0; i < COUNT; i++) {
            startCols[i] = t.curCols[i].clone()
            targets[i] = (t.pts[i].country && lang.countries.includes(t.pts[i].country)) ? PINK.clone() : t.globeCols[i].clone()
          }
          t.langTrans = { targets, startCols, start: Date.now(), duration: 600 }
        }
      }

      // Language transition — ONLY way colors change in settled state
      if (t.langTrans && t.choreo === 4) {
        const elapsed = now - t.langTrans.start, p = Math.min(elapsed / t.langTrans.duration, 1), ease = 1 - Math.pow(1 - p, 2)
        for (let i = 0; i < COUNT; i++) { t.curCols[i].copy(t.langTrans.startCols[i]).lerp(t.langTrans.targets[i], ease); mesh.setColorAt(i, t.curCols[i]) }
        mesh.instanceColor!.needsUpdate = true
        if (p >= 1) t.langTrans = null
      }

      // Twinkle — ONLY scale shimmer, NO color changes
      const twSpeed = t.choreo === 1 ? 3.0 : 1.5, twRange = t.choreo === 1 ? 0.15 : 0.05, twCount = t.choreo === 1 ? 200 : 60
      for (let n = 0; n < twCount; n++) {
        const i = Math.floor(Math.random() * COUNT)
        mesh.getMatrixAt(i, tM); tM.decompose(tP, tQ, tS)
        const shimmer = Math.sin(time * twSpeed + tilts[i] * 4) * 0.5 + 0.5
        tS.setScalar(bScales[i] * (1 - twRange + shimmer * twRange * 2))
        tM.compose(tP, tQ, tS); mesh.setMatrixAt(i, tM)
      }
      mesh.instanceMatrix.needsUpdate = true

      // NO settled sparkle color loop — colors are strictly controlled by langTrans only

      composer.render()
    }
    animate()

    const onResize = () => {
      const w = container.clientWidth, h = container.clientHeight
      camera.aspect = w/h; camera.updateProjectionMatrix()
      renderer.setSize(w, h); composer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', onResize); renderer.dispose(); if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement) }
  }, [])

  const lang = LANGS[langIdx]

  // Cinematic fade-in style
  const fadeIn = (delay: number): React.CSSProperties => ({
    opacity: 0, animation: `fadeInUp 1s ease ${delay}s forwards`,
  })

  const panelCls = (idx: number) =>
    `fixed inset-0 z-10 flex flex-col items-center justify-center pointer-events-none transition-all duration-700 ${
      slide === idx ? 'opacity-100 pointer-events-auto translate-y-0' :
      slide > idx ? 'opacity-0 -translate-y-3' : 'opacity-0 translate-y-2'
    }`

  return (
    <div className="w-full h-screen overflow-hidden bg-black" style={{ fontFamily: "'Sora', sans-serif" }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div ref={canvasRef} className="fixed inset-0 z-0" />
      <div ref={flashRef} id="flash" className="fixed inset-0 z-[5] bg-white opacity-0 pointer-events-none" />

      {/* ═══ BEAT 1 ═══ */}
      <div className={panelCls(0)} onClick={advance}>
        <div className="w-[90%] max-w-[880px] px-6 text-center">
          <h1 style={{ ...fadeIn(0.3), fontFamily: "'Poppins', sans-serif", fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.08, letterSpacing: '-0.02em', color: '#e2e2e2', fontSize: 'clamp(1.6rem, 6.5vw, 3.2rem)' }}>
            Music has always been the thing that brings strangers together<span style={{ color: '#FF0CB6' }}>.</span>
          </h1>
          <p style={{ ...fadeIn(1.5), fontFamily: "'Sora', sans-serif", fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#919090', fontSize: 'clamp(0.7rem, 2vw, 0.95rem)', lineHeight: 1.8, marginTop: '2rem' }}>
            Across borders<span style={{ color: '#FF0CB6' }}>.</span> Across cultures<span style={{ color: '#FF0CB6' }}>.</span><br />
            Across languages you&apos;ve never spoken<span style={{ color: '#FF0CB6' }}>.</span>
          </p>
        </div>
      </div>

      {/* ═══ BEAT 2 ═══ */}
      <div className={panelCls(1)} onClick={advance}>
        <div className="w-[90%] max-w-[750px] px-6 text-center">
          <p style={{ ...fadeIn(0.3), fontFamily: "'Sora', sans-serif", fontWeight: 400, color: '#919090', fontSize: 'clamp(1.05rem, 3.2vw, 1.4rem)', lineHeight: 1.85 }}>
            The beat crosses every border. The words never could.
          </p>
        </div>
      </div>

      {/* ═══ BEAT 3 ═══ */}
      <div className={panelCls(2)} onClick={advance}>
        <div className="w-[90%] max-w-[900px] text-center">
          <p style={{ ...fadeIn(0.2), fontFamily: "'Poppins', sans-serif", fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#FF0CB6', fontSize: 'clamp(2.5rem, 12vw, 5.5rem)', lineHeight: 0.95 }}>
            Not anymore<span>.</span>
          </p>
        </div>
      </div>

      {/* ═══ BEAT 4 ═══ */}
      <div className={panelCls(3)} onClick={advance}>
        <div className="w-[90%] max-w-[880px] px-6 text-center">
          <p style={{ ...fadeIn(0.2), fontFamily: "'Sora', sans-serif", fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#919090', fontSize: 'clamp(0.75rem, 2vw, 1rem)', marginBottom: '1.5rem' }}>
            In a world first for a commercial dance track.
          </p>
          <p style={{ ...fadeIn(0.8), fontFamily: "'Poppins', sans-serif", fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#e2e2e2', fontSize: 'clamp(1.4rem, 5vw, 2.8rem)', lineHeight: 1.1 }}>
            One track<span style={{ color: '#FF0CB6' }}>.</span> 50 languages<span style={{ color: '#FF0CB6' }}>.</span>{' '}
            <span style={{ whiteSpace: 'nowrap' }}>5.8 billion</span> voices<span style={{ color: '#FF0CB6' }}>.</span>
          </p>
          <p style={{ ...fadeIn(1.8), fontFamily: "'Poppins', sans-serif", fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#FF0CB6', fontSize: 'clamp(1rem, 3.5vw, 1.8rem)', marginTop: '1.5rem' }}>
            17 April 2026
          </p>
        </div>
      </div>

      {/* NEXT */}
      {slide < TOTAL && (
        <button onClick={advance} className="fixed bottom-8 right-6 z-50 text-[10px] font-medium tracking-[0.25em] uppercase" style={{ fontFamily: "'Sora', sans-serif", color: '#FF0CB6', background: 'none', border: 'none', cursor: 'pointer' }}>
          NEXT
        </button>
      )}

      {/* Progress */}
      {slide < TOTAL && (
        <div className="fixed left-5 bottom-8 z-50 flex flex-col items-center gap-1.5">
          <div className="w-[2px] h-14 rounded-full overflow-hidden" style={{ background: 'rgba(48,48,48,0.3)' }}>
            <div className="w-full rounded-full transition-all duration-1000 ease-out" style={{ height: `${((slide+1)/TOTAL)*100}%`, background: 'rgba(255,12,182,0.5)' }} />
          </div>
          <span className="text-[7px] tracking-widest" style={{ fontFamily: "'Sora', sans-serif", color: 'rgba(145,144,144,0.25)' }}>{slide+1}/{TOTAL}</span>
        </div>
      )}

      {/* Countdown */}
      {showUI && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[95]" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', color: 'rgba(226,226,226,0.6)', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          {cd.d}<span style={{ color: 'rgba(255,12,182,0.4)', fontSize: '0.7em', marginLeft: '0.1em' }}>D</span>
          <span style={{ color: 'rgba(255,12,182,0.25)', margin: '0 0.12em' }}>:</span>
          {cd.h}<span style={{ color: 'rgba(255,12,182,0.4)', fontSize: '0.7em', marginLeft: '0.1em' }}>H</span>
          <span style={{ color: 'rgba(255,12,182,0.25)', margin: '0 0.12em' }}>:</span>
          {cd.m}<span style={{ color: 'rgba(255,12,182,0.4)', fontSize: '0.7em', marginLeft: '0.1em' }}>M</span>
          <span style={{ color: 'rgba(255,12,182,0.25)', margin: '0 0.12em' }}>:</span>
          {cd.s}<span style={{ color: 'rgba(255,12,182,0.4)', fontSize: '0.7em', marginLeft: '0.1em' }}>S</span>
        </div>
      )}

      {/* Language card — collapsible glassmorphic info card */}
      {showUI && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[95] w-[92%] max-w-[400px] rounded-[4px]" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.06)', maxHeight: cardCollapsed ? 'none' : '70vh', overflowY: cardCollapsed ? 'visible' : 'auto' }}>
          {/* Pink top edge */}
          <div className="absolute top-0 left-[10%] right-[10%] h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(255,12,182,0.25), transparent)' }} />

          <div className="px-4 py-3">
            {/* Header row — always visible */}
            <div className="flex items-center gap-2">
              <button onClick={() => cycleLang(-1)} className="w-9 h-9 rounded-[4px] flex items-center justify-center text-lg cursor-pointer flex-shrink-0" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'rgba(226,226,226,0.5)' }}>&#8249;</button>

              <div className="flex-1 text-center min-w-0">
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#e2e2e2', lineHeight: 1.1 }}>{lang.name}</div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 10, color: '#919090', marginTop: 2 }}>{lang.speakers} speakers &middot; {lang.city}</div>
              </div>

              <button onClick={() => cycleLang(1)} className="w-9 h-9 rounded-[4px] flex items-center justify-center text-lg cursor-pointer flex-shrink-0" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'rgba(226,226,226,0.5)' }}>&#8250;</button>

              {/* Collapse/expand toggle */}
              <button onClick={() => setCardCollapsed(!cardCollapsed)} className="w-8 h-8 rounded-[4px] flex items-center justify-center cursor-pointer flex-shrink-0" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', color: 'rgba(226,226,226,0.4)', fontSize: 12 }}>
                {cardCollapsed ? '▼' : '▲'}
              </button>
            </div>

            {/* Expanded content */}
            {!cardCollapsed && (
              <div style={{ marginTop: 12 }}>
                {/* Rank + big speakers */}
                <div className="text-center mb-3">
                  {lang.rank && <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 11, color: '#FF0CB6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{lang.rank} most spoken</div>}
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 'clamp(1.4rem, 5vw, 1.8rem)', color: '#FF0CB6', letterSpacing: '-0.02em' }}>{lang.speakers}</span>
                  <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, color: '#919090', marginLeft: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>speakers</span>
                </div>

                {/* Dialect */}
                {lang.dialect && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginBottom: 10 }}>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#FF0CB6', marginBottom: 5 }}>Dialect</div>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, color: 'rgba(226,226,226,0.6)', lineHeight: 1.6, fontStyle: 'italic' }}>{lang.dialect}</div>
                  </div>
                )}

                {/* Why this city */}
                {lang.whyThisCity && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginBottom: 10 }}>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#919090', marginBottom: 5 }}>Why {lang.city.split(',')[0]}</div>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, color: 'rgba(226,226,226,0.5)', lineHeight: 1.6 }}>{lang.whyThisCity}</div>
                  </div>
                )}

                {/* Countries */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#919090', marginBottom: 5 }}>Countries &amp; Regions</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {lang.countries.map(c => (
                      <div key={c} style={{ fontFamily: "'Sora', sans-serif", fontSize: 10, fontWeight: 500, color: '#e2e2e2', textTransform: 'uppercase' }}>{c}</div>
                    ))}
                  </div>
                </div>

                {/* Counter */}
                <div className="text-center mt-3" style={{ fontFamily: "'Sora', sans-serif", fontSize: 10, color: 'rgba(226,226,226,0.25)', letterSpacing: '0.1em' }}>
                  {langIdx + 1} / {LANGS.length}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
