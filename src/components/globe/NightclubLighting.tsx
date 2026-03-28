/**
 * NightclubLighting — Cinematic rim lighting for the disco scene
 *
 * - Key light: white, sweeping from above
 * - Pink accent: magenta wash from below
 * - Fill: subtle white from behind
 * - Ambient: very dim
 * - HDRI environment for reflections (generated procedurally)
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'

export default function NightclubLighting() {
  const keyRef = useRef<THREE.PointLight>(null)
  const pinkRef = useRef<THREE.PointLight>(null)

  // Orbit the lights slowly for dynamic reflections
  useFrame(() => {
    const t = Date.now() * 0.001
    if (keyRef.current) {
      keyRef.current.position.set(
        Math.sin(t * 0.3) * 5,
        Math.sin(t * 0.2) * 2 + 3,
        Math.cos(t * 0.4) * 5
      )
    }
    if (pinkRef.current) {
      pinkRef.current.position.set(
        Math.cos(t * 0.25) * 4,
        Math.cos(t * 0.15) * 2 - 2,
        Math.sin(t * 0.35) * 4
      )
    }
  })

  return (
    <>
      {/* HDRI environment for reflections — studio preset for clean highlights */}
      <Environment preset="studio" background={false} />

      {/* Ambient — very dim base */}
      <ambientLight intensity={0.15} color="#111111" />

      {/* Key light — white, orbiting above */}
      <pointLight
        ref={keyRef}
        color="#ffffff"
        intensity={40}
        distance={20}
        position={[4, 3, 4]}
      />

      {/* Pink accent — magenta wash from below */}
      <pointLight
        ref={pinkRef}
        color="#FF0CB6"
        intensity={30}
        distance={20}
        position={[-3, -2, 4]}
      />

      {/* Fill — subtle white from behind */}
      <pointLight
        color="#ffffff"
        intensity={10}
        distance={15}
        position={[0, 0, -5]}
      />

      {/* Rim light — strong pink edge highlight */}
      <pointLight
        color="#FF0CB6"
        intensity={15}
        distance={10}
        position={[0, 3, -3]}
      />
    </>
  )
}
