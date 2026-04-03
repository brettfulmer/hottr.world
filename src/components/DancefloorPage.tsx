import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
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

/* ═══ COUNTRY MATCHING ═══ */
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

/* ═══ 50 LANGUAGES — sorted most spoken → least spoken ═══ */
import { languages as LANGS } from '../data/languages-50'

/* ═══ COMPONENT ═══ */
interface DancefloorProps { initialLangId?: string; analyser?: AnalyserNode | null }

export default function DancefloorPage({ initialLangId, analyser }: DancefloorProps) {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const [slide, setSlide] = useState(0)
  const [showUI, setShowUI] = useState(false)
  const initialIdx = initialLangId ? Math.max(0, LANGS.findIndex(l => l.id === initialLangId)) : 0
  const [langIdx, setLangIdx] = useState(initialIdx)
  const slideRef = useRef(0)
  const locked = useRef(false)
  const autoTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [cardCollapsed, setCardCollapsed] = useState(true)
  const analyserDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const analyserNodeRef = useRef<AnalyserNode | null>(analyser || null)

  // Keep analyser ref in sync with prop (may arrive after mount)
  useEffect(() => {
    if (analyser) {
      analyserNodeRef.current = analyser
      analyserDataRef.current = new Uint8Array(analyser.frequencyBinCount)
    }
  }, [analyser])

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
      const isActive = lang.isIndigenous ? c === 'Australia' : (c && matchesCountry(c, lang.countries))
      targets[i] = isActive ? PINK.clone() : t.globeCols[i].clone()
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

      // ── Audio reactivity ──
      let audioPulse = 0
      if (analyserNodeRef.current && analyserDataRef.current) {
        analyserNodeRef.current.getByteFrequencyData(analyserDataRef.current)
        // Average lower 10 bins (bass frequencies)
        let bassSum = 0
        for (let i = 0; i < 10; i++) bassSum += analyserDataRef.current[i]
        audioPulse = (bassSum / 10) / 255 // 0.0 – 1.0
      }

      globeGroup.rotation.y += (t.choreo === 1 ? 0.04 : 0.006)

      // Pulse globe scale to bass
      const gScale = 1.0 + audioPulse * 0.03
      globeGroup.scale.set(gScale, gScale, gScale)

      // Pulse lights to beat
      const lightBoost = 1 + audioPulse * 0.8
      kL.position.set(Math.sin(time*0.3)*5, Math.sin(time*0.2)*2+2, Math.cos(time*0.4)*5)
      kL.intensity = 40 * lightBoost
      pL.position.set(Math.cos(time*0.25)*4, Math.cos(time*0.15)*2-1, Math.sin(time*0.35)*4)
      pL.intensity = 30 * lightBoost

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
            const isActive = lang.isIndigenous ? t.pts[i].country === 'Australia' : (t.pts[i].country && matchesCountry(t.pts[i].country, lang.countries))
            targets[i] = isActive ? PINK.clone() : t.globeCols[i].clone()
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

      // Audio-reactive bloom — pulse bloom strength on bass hits
      if (t.choreo === 4) {
        bloom.strength = 0.6 + audioPulse * 0.8
      }

      // Twinkle — scale shimmer for all gems, sparkle for active pink gems
      // Audio boosts: more sparkle count + bigger pulse on bass
      const twSpeed = t.choreo === 1 ? 3.0 : 1.5
      const twRange = t.choreo === 1 ? 0.15 : 0.03 + audioPulse * 0.04
      const twCount = t.choreo === 1 ? 200 : Math.floor(60 + audioPulse * 80)
      const PINK_SPARKLE = new THREE.Color('#FF4DD4')
      let colorsChanged = false
      for (let n = 0; n < twCount; n++) {
        const i = Math.floor(Math.random() * COUNT)
        mesh.getMatrixAt(i, tM); tM.decompose(tP, tQ, tS)
        const shimmer = Math.sin(time * twSpeed + tilts[i] * 4) * 0.5 + 0.5

        // Check if this gem is currently pink (active)
        const isPink = t.curCols[i].r > 0.8 && t.curCols[i].g < 0.2 && t.curCols[i].b > 0.4

        if (isPink && t.choreo === 4 && !t.langTrans) {
          // Active gems: scale pulse amplified by audio
          const pinkPulse = 0.25 + audioPulse * 0.3
          tS.setScalar(bScales[i] * (1 + shimmer * pinkPulse))
          if (shimmer > 0.75 - audioPulse * 0.2) {
            mesh.setColorAt(i, PINK_SPARKLE)
            colorsChanged = true
          } else {
            mesh.setColorAt(i, PINK)
            colorsChanged = true
          }
        } else {
          // Non-active gems: subtle shimmer, slightly boosted by audio
          tS.setScalar(bScales[i] * (1 - twRange + shimmer * twRange * 2))
        }

        tM.compose(tP, tQ, tS); mesh.setMatrixAt(i, tM)
      }
      mesh.instanceMatrix.needsUpdate = true
      if (colorsChanged) mesh.instanceColor!.needsUpdate = true

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
            {t('beat1.headline')}<span style={{ color: '#FF0CB6' }}>.</span>
          </h1>
          <p style={{ ...fadeIn(1.5), fontFamily: "'Sora', sans-serif", fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#919090', fontSize: 'clamp(0.7rem, 2vw, 0.95rem)', lineHeight: 1.8, marginTop: '2rem' }}>
            {t('beat1.subtext1')}<span style={{ color: '#FF0CB6' }}>.</span> {t('beat1.subtext2')}<span style={{ color: '#FF0CB6' }}>.</span><br />
            {t('beat1.subtext3')}<span style={{ color: '#FF0CB6' }}>.</span>
          </p>
        </div>
      </div>

      {/* ═══ BEAT 2 ═══ */}
      <div className={panelCls(1)} onClick={advance}>
        <div className="w-[90%] max-w-[750px] px-6 text-center">
          <p style={{ ...fadeIn(0.3), fontFamily: "'Sora', sans-serif", fontWeight: 400, color: '#919090', fontSize: 'clamp(1.05rem, 3.2vw, 1.4rem)', lineHeight: 1.85 }}>
            {t('beat2.text')}
          </p>
        </div>
      </div>

      {/* ═══ BEAT 3 ═══ */}
      <div className={panelCls(2)} onClick={advance}>
        <div className="w-[90%] max-w-[900px] text-center">
          <p style={{ ...fadeIn(0.2), fontFamily: "'Poppins', sans-serif", fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#FF0CB6', fontSize: 'clamp(2.5rem, 12vw, 5.5rem)', lineHeight: 0.95 }}>
            {t('beat3.text')}
          </p>
        </div>
      </div>

      {/* ═══ BEAT 4 ═══ */}
      <div className={panelCls(3)} onClick={advance}>
        <div className="w-[90%] max-w-[880px] px-6 text-center">
          <p style={{ ...fadeIn(0.2), fontFamily: "'Sora', sans-serif", fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#919090', fontSize: 'clamp(0.75rem, 2vw, 1rem)', marginBottom: '1.5rem' }}>
            {t('beat4.prefix')}.
          </p>
          <p style={{ ...fadeIn(0.8), fontFamily: "'Poppins', sans-serif", fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#e2e2e2', fontSize: 'clamp(1.4rem, 5vw, 2.8rem)', lineHeight: 1.1 }}>
            {t('beat4.headline')}
          </p>
          <p style={{ ...fadeIn(1.8), fontFamily: "'Poppins', sans-serif", fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#FF0CB6', fontSize: 'clamp(1rem, 3.5vw, 1.8rem)', marginTop: '1.5rem' }}>
            {t('beat4.date')}
          </p>
        </div>
      </div>

      {/* NEXT */}
      {slide < TOTAL && (
        <button onClick={advance} className="fixed bottom-8 right-6 z-50 text-[10px] font-medium tracking-[0.25em] uppercase" style={{ fontFamily: "'Sora', sans-serif", color: '#FF0CB6', background: 'none', border: 'none', cursor: 'pointer' }}>
          {t('nav.next')}
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
          {cd.d}<span style={{ color: 'rgba(255,12,182,0.4)', fontSize: '0.7em', marginLeft: '0.1em' }}>{t('countdown.days')}</span>
          <span style={{ color: 'rgba(255,12,182,0.25)', margin: '0 0.12em' }}>:</span>
          {cd.h}<span style={{ color: 'rgba(255,12,182,0.4)', fontSize: '0.7em', marginLeft: '0.1em' }}>{t('countdown.hours')}</span>
          <span style={{ color: 'rgba(255,12,182,0.25)', margin: '0 0.12em' }}>:</span>
          {cd.m}<span style={{ color: 'rgba(255,12,182,0.4)', fontSize: '0.7em', marginLeft: '0.1em' }}>{t('countdown.minutes')}</span>
          <span style={{ color: 'rgba(255,12,182,0.25)', margin: '0 0.12em' }}>:</span>
          {cd.s}<span style={{ color: 'rgba(255,12,182,0.4)', fontSize: '0.7em', marginLeft: '0.1em' }}>{t('countdown.seconds')}</span>
        </div>
      )}

      {/* ═══ FLOATING PILL PLAYER ═══ */}
      {showUI && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[95] w-[92%] max-w-[420px]" style={{
          borderRadius: '2rem',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,12,182,0.3)',
          boxShadow: '0 0 20px rgba(255,12,182,0.15), 0 0 60px rgba(255,12,182,0.05)',
          padding: '16px 20px',
        }}>
          {/* Top row: arrows + center info */}
          <div className="flex items-center gap-3">
            <button onClick={() => cycleLang(-1)} className="arrow-pop w-10 h-10 rounded-full flex items-center justify-center text-lg cursor-pointer flex-shrink-0" style={{ border: '1px solid rgba(255,12,182,0.2)', background: 'rgba(255,12,182,0.05)', color: 'rgba(226,226,226,0.7)' }}>&#8249;</button>

            <div className="flex-1 text-center min-w-0">
              {/* EQ Visualizer */}
              <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', justifyContent: 'center', height: 16, marginBottom: 4 }}>
                {[0, 0.15, 0.3, 0.45].map((delay, i) => (
                  <span key={i} style={{
                    display: 'block', width: 3, height: '100%', borderRadius: 1.5,
                    background: '#FF0CB6', boxShadow: '0 0 4px #FF0CB6',
                    transformOrigin: 'bottom',
                    animation: `eqBounce 0.8s ease-in-out ${delay}s infinite`,
                  }} />
                ))}
              </div>
              {/* Language name */}
              <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 'clamp(1.3rem, 5vw, 1.8rem)', textTransform: 'uppercase', letterSpacing: '2px', color: '#fff', lineHeight: 1.1, textShadow: '0 0 8px rgba(255,12,182,0.5)' }}>{lang.name}</div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, color: '#a0a0a0', marginTop: 3, fontWeight: 500, letterSpacing: '1px' }}>{lang.speakers} {t('player.speakers')}</div>
            </div>

            <button onClick={() => cycleLang(1)} className="arrow-pop w-10 h-10 rounded-full flex items-center justify-center text-lg cursor-pointer flex-shrink-0" style={{ border: '1px solid rgba(255,12,182,0.2)', background: 'rgba(255,12,182,0.05)', color: 'rgba(226,226,226,0.7)' }}>&#8250;</button>
          </div>

          {/* CTA + DSP icons */}
          <div className="flex flex-col items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 12, paddingTop: 12 }}>
            <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: '#FF0CB6', marginBottom: 8 }}>
              {t('player.listenIn', { language: lang.name.toUpperCase() })}
            </p>
            <div className="flex gap-5">
              {/* Spotify */}
              <a href="#" className="group" aria-label="Spotify">
                <svg className="w-6 h-6 fill-white transition-all group-hover:fill-[#1DB954] group-hover:drop-shadow-[0_0_8px_#1DB954]" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.621.539.3.719 1.02.419 1.56-.239.54-.959.72-1.559.3z"/></svg>
              </a>
              {/* Apple Music */}
              <a href="#" className="group" aria-label="Apple Music">
                <svg className="w-6 h-6 fill-white transition-all group-hover:fill-[#FC3C44] group-hover:drop-shadow-[0_0_8px_#FC3C44]" viewBox="0 0 24 24"><path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.802.42.127.856.187 1.296.228.45.042.901.07 1.353.07h11.892c.138-.008.277-.014.415-.023.84-.056 1.674-.164 2.457-.504 1.397-.605 2.327-1.652 2.808-3.104.2-.604.3-1.23.347-1.862.037-.5.054-1 .057-1.5V6.124zM17.26 17.79c-.014.098-.036.196-.063.292-.15.548-.42.993-.9 1.3-.398.254-.846.378-1.315.402-.588.03-1.17-.04-1.73-.242a1.673 1.673 0 01-.984-.917c-.14-.342-.17-.706-.118-1.07.074-.508.33-.916.746-1.2.283-.193.6-.316.93-.402.34-.09.685-.154 1.03-.218.374-.07.75-.13 1.11-.26.14-.05.27-.12.38-.22.088-.082.14-.186.137-.314V8.665c0-.092-.022-.18-.08-.256a.395.395 0 00-.243-.147c-.118-.027-.238-.035-.358-.023-.187.019-.37.063-.55.117l-4.93 1.378c-.09.025-.178.055-.26.1a.487.487 0 00-.252.357c-.017.09-.024.18-.024.272v7.17c0 .09-.003.18-.014.268-.03.285-.077.566-.2.83-.196.422-.518.72-.934.916-.31.146-.64.22-.98.27-.548.078-1.09.078-1.617-.1a1.87 1.87 0 01-.973-.78c-.2-.34-.28-.714-.275-1.105.01-.4.11-.776.345-1.108.27-.38.63-.63 1.05-.796.34-.135.698-.208 1.06-.266.37-.06.743-.11 1.1-.22.193-.058.376-.14.53-.272a.57.57 0 00.193-.444V6.972c0-.208.04-.408.13-.596.12-.248.31-.424.558-.516.163-.06.333-.1.505-.137l5.34-1.397c.262-.07.53-.12.8-.132.226-.01.45 0 .666.08.32.118.52.348.58.693.015.09.023.18.023.27v11.456c0 .086-.003.174-.016.26z"/></svg>
              </a>
              {/* YouTube Music */}
              <a href="#" className="group" aria-label="YouTube Music">
                <svg className="w-6 h-6 fill-white transition-all group-hover:fill-[#FF0000] group-hover:drop-shadow-[0_0_8px_#FF0000]" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>

          {/* Track Notes toggle */}
          <div className="text-center" style={{ marginTop: 10 }}>
            <button onClick={() => setCardCollapsed(!cardCollapsed)} style={{ background: 'none', border: 'none', color: '#a0a0a0', fontSize: 11, cursor: 'pointer', fontFamily: "'Sora', sans-serif", letterSpacing: '0.5px' }}>
              {cardCollapsed ? `+ ${t('player.trackNotes')}` : `- ${t('player.hideNotes')}`}
            </button>
          </div>

          {/* Expandable Track Notes */}
          <div className={`lore-content ${!cardCollapsed ? 'expanded' : ''}`} style={{ paddingLeft: 4, paddingRight: 4 }}>
            {/* Rank */}
            {lang.rank && (
              <div className="text-center" style={{ marginBottom: 10 }}>
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 12, color: '#FF0CB6', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{lang.rank} {t('player.mostSpoken')}</span>
              </div>
            )}

            {/* Dialect */}
            {lang.dialect && (
              <div style={{ borderTop: '1px dashed rgba(255,12,182,0.3)', paddingTop: 10, marginBottom: 10 }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#FF0CB6', marginBottom: 5 }}>{t('player.dialect')}</div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, color: '#ccc', lineHeight: 1.5 }}>{lang.dialect}</div>
              </div>
            )}

            {/* Why this city */}
            {lang.whyThisCity && (
              <div style={{ borderTop: '1px dashed rgba(255,12,182,0.3)', paddingTop: 10, marginBottom: 10 }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#a0a0a0', marginBottom: 5 }}>{t('player.whyCity', { city: lang.city.split(',')[0] })}</div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, color: 'rgba(226,226,226,0.5)', lineHeight: 1.5 }}>{lang.whyThisCity}</div>
              </div>
            )}

            {/* Countries */}
            <div style={{ borderTop: '1px dashed rgba(255,12,182,0.3)', paddingTop: 10 }}>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#a0a0a0', marginBottom: 5 }}>{t('player.countriesRegions')}</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {lang.countries.map(c => (
                  <div key={c} style={{ fontFamily: "'Sora', sans-serif", fontSize: 10, fontWeight: 500, color: '#e2e2e2', textTransform: 'uppercase' }}>{c}</div>
                ))}
              </div>
            </div>

            {/* Counter */}
            <div className="text-center" style={{ fontFamily: "'Sora', sans-serif", fontSize: 10, color: 'rgba(226,226,226,0.25)', letterSpacing: '0.1em', marginTop: 10, paddingBottom: 4 }}>
              {langIdx + 1} / {LANGS.length}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
