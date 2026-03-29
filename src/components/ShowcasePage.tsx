/**
 * ShowcasePage — Globe-only showcase (PIN 963223)
 *
 * Launches straight into the spinning crystal mirror ball.
 * No editorial slides, no language card, no progression.
 * Just the globe with DANCEFLOOR text ring + countdown.
 */
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'

interface CrystalPoint { lat: number; lng: number; country: string }

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
    function pointInRing(px: number, py: number, ring: number[][]) {
      let inside = false
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i], [xj, yj] = ring[j]
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
      }
      return inside
    }
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

export default function ShowcasePage() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [cd, setCd] = useState({ d: '00', h: '00', m: '00', s: '00' })

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date('2026-04-17T00:00:00Z').getTime() - Date.now())
      const p = (n: number) => String(n).padStart(2, '0')
      setCd({ d: p(Math.floor(diff / 864e5)), h: p(Math.floor(diff % 864e5 / 36e5)), m: p(Math.floor(diff % 36e5 / 6e4)), s: p(Math.floor(diff % 6e4 / 1e3)) })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

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

    // Env map
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
    const LAND = new THREE.Color('#FFFFFF')
    const OCEAN = new THREE.Color('#050608')

    const crystalMat = new THREE.MeshPhysicalMaterial({
      transmission: 0.15, roughness: 0.08, ior: 2.4, thickness: 0.3,
      clearcoat: 1, clearcoatRoughness: 0.02, envMap, envMapIntensity: 2.5,
      metalness: 0.35, transparent: true, side: THREE.DoubleSide,
    })

    const mesh = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.014, 0), crystalMat, COUNT)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

    // Disco palette for initial state
    const dPal = [new THREE.Color('#080810'),new THREE.Color('#1a1a22'),new THREE.Color('#2a2a35'),new THREE.Color('#FFFFFF'),new THREE.Color('#FF0CB6')]
    const dW = [0.35, 0.6, 0.75, 0.9, 1.0]
    const dummy = new THREE.Object3D()
    const bScales = new Float32Array(COUNT), tilts = new Float32Array(COUNT)
    const curCols: THREE.Color[] = []
    const globeCols: THREE.Color[] = []

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

    // 3D Text — visible immediately
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
      const textMesh = new THREE.Mesh(textGeo, textMat)
      textMesh.scale.setScalar(1.0)
      globeGroup.add(textMesh)
    })

    // Lights
    scene.add(new THREE.AmbientLight(0x111111, 0.3))
    const kL = new THREE.PointLight(0xffffff, 40, 20); kL.position.set(4,3,4); scene.add(kL)
    const pL = new THREE.PointLight(0xFF0CB6, 30, 20); pL.position.set(-3,-2,4); scene.add(pL)
    scene.add(new THREE.PointLight(0xffffff, 10, 15).translateZ(-5))

    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.6, 0.4, 0.2)
    composer.addPass(bloom)

    // Load geo and morph to globe colors
    loadGeoData(pts, () => {
      for (let i = 0; i < COUNT; i++) {
        const col = pts[i].country ? LAND.clone() : OCEAN.clone()
        globeCols[i] = col
        curCols[i].copy(col)
        mesh.setColorAt(i, col)
      }
      mesh.instanceColor!.needsUpdate = true
    })

    // Animation
    const tM = new THREE.Matrix4(), tP = new THREE.Vector3(), tQ = new THREE.Quaternion(), tS = new THREE.Vector3()
    let rafId = 0

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      const time = Date.now() * 0.001

      globeGroup.rotation.y += 0.002
      kL.position.set(Math.sin(time*0.3)*5, Math.sin(time*0.2)*2+2, Math.cos(time*0.4)*5)
      pL.position.set(Math.cos(time*0.25)*4, Math.cos(time*0.15)*2-1, Math.sin(time*0.35)*4)

      // Twinkle
      for (let n = 0; n < 60; n++) {
        const i = Math.floor(Math.random() * COUNT)
        mesh.getMatrixAt(i, tM); tM.decompose(tP, tQ, tS)
        const shimmer = Math.sin(time * 1.5 + tilts[i] * 4) * 0.5 + 0.5
        tS.setScalar(bScales[i] * (0.95 + shimmer * 0.1))
        tM.compose(tP, tQ, tS); mesh.setMatrixAt(i, tM)
      }
      mesh.instanceMatrix.needsUpdate = true

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

  return (
    <div className="w-full h-screen overflow-hidden bg-black" style={{ fontFamily: "'Sora', sans-serif" }}>
      <div ref={canvasRef} className="fixed inset-0 z-0" />

      {/* Countdown */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', color: 'rgba(226,226,226,0.6)', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
        {cd.d}<span style={{ color: 'rgba(255,12,182,0.4)', fontSize: '0.7em', marginLeft: '0.1em' }}>D</span>
        <span style={{ color: 'rgba(255,12,182,0.25)', margin: '0 0.12em' }}>:</span>
        {cd.h}<span style={{ color: 'rgba(255,12,182,0.4)', fontSize: '0.7em', marginLeft: '0.1em' }}>H</span>
        <span style={{ color: 'rgba(255,12,182,0.25)', margin: '0 0.12em' }}>:</span>
        {cd.m}<span style={{ color: 'rgba(255,12,182,0.4)', fontSize: '0.7em', marginLeft: '0.1em' }}>M</span>
        <span style={{ color: 'rgba(255,12,182,0.25)', margin: '0 0.12em' }}>:</span>
        {cd.s}<span style={{ color: 'rgba(255,12,182,0.4)', fontSize: '0.7em', marginLeft: '0.1em' }}>S</span>
      </div>

      {/* Bottom label */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-center">
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(226,226,226,0.3)' }}>
          50 languages &middot; 5.8 billion voices
        </div>
        <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 'clamp(0.8rem, 2.5vw, 1rem)', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#FF0CB6', marginTop: 4 }}>
          17 April 2026
        </div>
      </div>
    </div>
  )
}
