/**
 * GlobeScene — Complete R3F canvas scene
 *
 * Assembles the disco ball globe, 3D text, lighting, camera controls,
 * and post-processing bloom into a single Canvas component.
 */
import { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'

import DiscoBallGlobe from './DiscoBallGlobe'
import DancefloorText3D from './DancefloorText3D'
import NightclubLighting from './NightclubLighting'
import type { Language } from '../../data/languages-50'

interface CountryFeature {
  name: string
  rings: number[][][]
  bbox: { mnLng: number; mxLng: number; mnLat: number; mxLat: number }
}

interface Props {
  selected: Language | null
  showText?: boolean
}

export default function GlobeScene({ selected, showText = true }: Props) {
  const [countryData, setCountryData] = useState<CountryFeature[]>([])

  // Load TopoJSON once
  useEffect(() => {
    (async () => {
      try {
        const topo = await (await fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json')).json() as Topology<{ countries: GeometryCollection }>
        const geo = feature(topo, topo.objects.countries)
        const data: CountryFeature[] = geo.features.map(feat => {
          const geom = feat.geometry
          const rings: number[][][] = []
          if (geom.type === 'Polygon') rings.push(...geom.coordinates)
          else if (geom.type === 'MultiPolygon') for (const p of geom.coordinates) rings.push(...p)
          let mnLng = Infinity, mxLng = -Infinity, mnLat = Infinity, mxLat = -Infinity
          for (const r of rings) for (const [ln, lt] of r) {
            if (ln < mnLng) mnLng = ln; if (ln > mxLng) mxLng = ln
            if (lt < mnLat) mnLat = lt; if (lt > mxLat) mxLat = lt
          }
          return { name: (feat.properties as Record<string, string>)?.name || '', rings, bbox: { mnLng, mxLng, mnLat, mxLat } }
        })
        setCountryData(data)
      } catch (e) {
        console.error('[GlobeScene] Failed to load country data:', e)
      }
    })()
  }, [])

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ antialias: true, toneMapping: 3 /* ACESFilmic */ }}
      style={{ background: '#000000' }}
    >
      <Suspense fallback={null}>
        <NightclubLighting />

        <DiscoBallGlobe
          selected={selected}
          countryData={countryData}
        />

        <DancefloorText3D
          visible={showText}
          position={[0, -0.5, 2.8]}
        />

        {/* Orbit controls — horizontal spin only */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI / 1.7}
          autoRotate={false}
          enableDamping
          dampingFactor={0.05}
        />

        {/* Post-processing bloom — makes pink highlights bleed */}
        <EffectComposer>
          <Bloom
            intensity={0.6}
            luminanceThreshold={0.3}
            luminanceSmoothing={0.4}
            mipmapBlur
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
