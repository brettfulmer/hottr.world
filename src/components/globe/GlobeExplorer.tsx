/**
 * GlobeExplorer — R3F version of the Dancefloor experience
 *
 * Alternative route at /explore — uses React Three Fiber instead of vanilla Three.js.
 * Assembles: GlobeScene, RegionCard, MiniPlayer, ScrollFade sections.
 */
import { useState, useCallback } from 'react'
import GlobeScene from './GlobeScene'
import RegionCard from './RegionCard'
import MiniPlayer from './MiniPlayer'
import ScrollFade from './ScrollFade'
import { languages } from '../../data/languages-50'

export default function GlobeExplorer() {
  const [langIdx, setLangIdx] = useState(0)
  const selected = languages[langIdx]

  const cycleLang = useCallback((dir: number) => {
    setLangIdx(prev => ((prev + dir) % languages.length + languages.length) % languages.length)
  }, [])

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#000', color: '#e2e2e2', fontFamily: "'Sora', sans-serif" }}>
      {/* 3D Globe Hero — full viewport */}
      <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
        <GlobeScene selected={selected} showText />

        {/* Countdown overlay */}
        <div style={{
          position: 'absolute', top: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 40,
          fontFamily: "'Poppins', sans-serif", fontWeight: 900,
          fontSize: 'clamp(1rem, 3vw, 1.5rem)', color: 'rgba(226,226,226,0.5)',
          textTransform: 'uppercase', letterSpacing: '-0.02em',
        }}>
          17 APRIL 2026
        </div>

        {/* Region card */}
        <RegionCard
          language={selected}
          onPrev={() => cycleLang(-1)}
          onNext={() => cycleLang(1)}
          index={langIdx}
          total={languages.length}
        />

        {/* Mini player */}
        <MiniPlayer languageName={selected.name} visible />
      </div>

      {/* Scroll content below the hero */}
      <div style={{ padding: '4rem 1.5rem', maxWidth: 720, margin: '0 auto' }}>
        <ScrollFade>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', textTransform: 'uppercase', color: '#e2e2e2', marginBottom: '1rem' }}>
            50 Languages<span style={{ color: '#FF0CB6' }}>.</span> One Dancefloor<span style={{ color: '#FF0CB6' }}>.</span>
          </h2>
        </ScrollFade>

        <ScrollFade delay={0.2}>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: '#919090', lineHeight: 1.8, marginBottom: '2rem' }}>
            For the first time in history, a commercially released single is dropping simultaneously in 50 languages — allowing over 5.8 billion people around the world to sing along, and actually understand every word they're singing.
          </p>
        </ScrollFade>

        <ScrollFade delay={0.4}>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: '#919090', lineHeight: 1.8, marginBottom: '2rem' }}>
            Each version was written natively — not translated, not AI-generated. Real writers in real cities crafting real lyrics that feel like they belong on the dancefloor of that language.
          </p>
        </ScrollFade>

        <ScrollFade delay={0.6}>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: '#FF0CB6', textTransform: 'uppercase', textAlign: 'center', marginTop: '3rem' }}>
            The dancefloor doesn't care what language you speak.
          </p>
        </ScrollFade>
      </div>
    </div>
  )
}
