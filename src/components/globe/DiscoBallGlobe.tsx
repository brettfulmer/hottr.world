/**
 * DiscoBallGlobe — R3F component
 *
 * A 3D disco mirror ball that doubles as a world globe.
 * - Square mirror tile facets via normal map
 * - HDRI environment for realistic reflections
 * - Country highlighting via emissive overlay texture
 * - Constant rotation with pink/white nightclub lighting
 */
import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Language } from '../../data/languages-50'

// ── Constants ──
const GLOBE_RADIUS = 2
const ROTATION_SPEED = 0.002
const TEX_W = 2048
const TEX_H = 1024

// ── Generate the normal map for mirror tile grid effect ──
function generateNormalMap(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = TEX_W
  canvas.height = TEX_H
  const ctx = canvas.getContext('2d')!

  // Base: flat normal (pointing straight out) = RGB(128, 128, 255)
  ctx.fillStyle = 'rgb(128, 128, 255)'
  ctx.fillRect(0, 0, TEX_W, TEX_H)

  // Grid lines = edge normals that create the "groove" between tiles
  const tileSize = 8
  ctx.strokeStyle = 'rgb(128, 128, 200)' // slight inward normal = groove
  ctx.lineWidth = 1

  for (let x = 0; x < TEX_W; x += tileSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, TEX_H)
    ctx.stroke()
  }
  for (let y = 0; y < TEX_H; y += tileSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(TEX_W, y)
    ctx.stroke()
  }

  // Add slight per-tile normal variation for sparkle
  for (let y = 0; y < TEX_H; y += tileSize) {
    for (let x = 0; x < TEX_W; x += tileSize) {
      const nx = 128 + (Math.random() - 0.5) * 12
      const ny = 128 + (Math.random() - 0.5) * 12
      ctx.fillStyle = `rgb(${nx}, ${ny}, 250)`
      ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2)
    }
  }

  return canvas
}

// ── Generate the base color map (ocean dark, land bright) ──
function generateBaseMap(countryData: { name: string; rings: number[][][]; bbox: { mnLng: number; mxLng: number; mnLat: number; mxLat: number } }[]): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = TEX_W
  canvas.height = TEX_H
  const ctx = canvas.getContext('2d')!

  // Ocean: very dark
  ctx.fillStyle = '#0a0a0e'
  ctx.fillRect(0, 0, TEX_W, TEX_H)

  // Land: bright silver
  ctx.fillStyle = '#c8c8cc'
  for (const feat of countryData) {
    for (const ring of feat.rings) {
      ctx.beginPath()
      for (let i = 0; i < ring.length; i++) {
        const [lng, lat] = ring[i]
        const px = ((lng + 180) / 360) * TEX_W
        const py = ((90 - lat) / 180) * TEX_H
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
    }
  }

  return canvas
}

// ── Generate highlight overlay for selected language ──
function generateHighlightMap(
  countryData: { name: string; rings: number[][][] }[],
  activeCountries: string[]
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = TEX_W
  canvas.height = TEX_H
  const ctx = canvas.getContext('2d')!

  ctx.clearRect(0, 0, TEX_W, TEX_H)

  if (activeCountries.length === 0) return canvas

  // Draw highlighted countries in pink
  ctx.fillStyle = '#FF0CB6'
  ctx.shadowColor = '#FF0CB6'
  ctx.shadowBlur = 8

  for (const feat of countryData) {
    if (!activeCountries.includes(feat.name)) continue
    for (const ring of feat.rings) {
      ctx.beginPath()
      for (let i = 0; i < ring.length; i++) {
        const [lng, lat] = ring[i]
        const px = ((lng + 180) / 360) * TEX_W
        const py = ((90 - lat) / 180) * TEX_H
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
    }
  }

  return canvas
}

interface Props {
  selected: Language | null
  countryData: { name: string; rings: number[][][]; bbox: { mnLng: number; mxLng: number; mnLat: number; mxLat: number } }[]
}

export default function DiscoBallGlobe({ selected, countryData }: Props) {
  const globeRef = useRef<THREE.Mesh>(null)
  const highlightRef = useRef<THREE.Mesh>(null)
  const hlTexRef = useRef<THREE.CanvasTexture | null>(null)

  // Generate textures
  const normalMap = useMemo(() => {
    const canvas = generateNormalMap()
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    return tex
  }, [])

  const baseMap = useMemo(() => {
    if (countryData.length === 0) return null
    const canvas = generateBaseMap(countryData)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [countryData])

  // Update highlight when language changes
  useEffect(() => {
    if (!countryData.length) return
    const countries = selected?.countries || []
    const canvas = generateHighlightMap(countryData, countries)
    if (hlTexRef.current) {
      hlTexRef.current.image = canvas
      hlTexRef.current.needsUpdate = true
    } else {
      hlTexRef.current = new THREE.CanvasTexture(canvas)
    }
    if (highlightRef.current) {
      const mat = highlightRef.current.material as THREE.MeshBasicMaterial
      mat.map = hlTexRef.current
      mat.needsUpdate = true
    }
  }, [selected, countryData])

  // Rotation
  useFrame(() => {
    if (globeRef.current) globeRef.current.rotation.y += ROTATION_SPEED
    if (highlightRef.current) highlightRef.current.rotation.y += ROTATION_SPEED
  })

  return (
    <group>
      {/* Main globe — chrome mirror ball with country map */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[GLOBE_RADIUS, 128, 128]} />
        <meshStandardMaterial
          map={baseMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.3, 0.3)}
          metalness={0.9}
          roughness={0.08}
          envMapIntensity={2.5}
        />
      </mesh>

      {/* Highlight overlay — additive blending pink glow for selected countries */}
      <mesh ref={highlightRef}>
        <sphereGeometry args={[GLOBE_RADIUS + 0.005, 128, 128]} />
        <meshBasicMaterial
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Inner dark sphere for depth */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS - 0.02, 48, 48]} />
        <meshBasicMaterial color="#050608" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}
