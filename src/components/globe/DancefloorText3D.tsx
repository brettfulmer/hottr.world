/**
 * DancefloorText3D — 3D metallic pink "DANCEFLOOR" text
 *
 * Uses @react-three/drei Text3D with a premium metallic pink material.
 * Floats in front of the globe, catches environment reflections.
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text3D, Center } from '@react-three/drei'
import * as THREE from 'three'

const FONT_URL = 'https://unpkg.com/three@0.164.1/examples/fonts/helvetiker_bold.typeface.json'

interface Props {
  visible: boolean
  position?: [number, number, number]
}

export default function DancefloorText3D({ visible, position = [0, 0, 0] }: Props) {
  const groupRef = useRef<THREE.Group>(null)

  // Slow gentle float
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1
    }
  })

  if (!visible) return null

  return (
    <group ref={groupRef} position={position}>
      <Center>
        <Text3D
          font={FONT_URL}
          size={0.35}
          height={0.08}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.015}
          bevelSize={0.01}
          bevelSegments={4}
        >
          DANCEFLOOR
          <meshStandardMaterial
            color="#FF0CB6"
            emissive="#FF0CB6"
            emissiveIntensity={0.4}
            metalness={1}
            roughness={0.1}
            envMapIntensity={3}
          />
        </Text3D>
      </Center>
    </group>
  )
}
