import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import PinGate from './components/PinGate'
import DancefloorPage from './components/DancefloorPage'
import ShowcasePage from './components/ShowcasePage'
import ChoicesPage from './components/ChoicesPage'
import ChoicesResultsPage from './components/ChoicesResultsPage'
import { detectUserCountry, type GeoResult } from './i18n/geoDetect'
import { loadLocale } from './i18n'
import { languages as LANGS } from './data/languages-50'

// Display names for picker — group variants under main language
const PICKER_NAMES: Record<string, string> = {
  'ar-eg': 'Arabic (Egyptian)',
  'ar-lv': 'Arabic (Levantine)',
  'ar-ma': 'Arabic (Maghrebi)',
  'pt-br': 'Portuguese (Brazilian)',
  'pt-eu': 'Portuguese (European)',
  'es-ar': 'Spanish (Argentine)',
  'es-cl': 'Spanish (Chilean)',
  'es-co': 'Spanish (Colombian)',
  'es-es': 'Spanish (Madrid)',
  'es-mx': 'Spanish (Mexican)',
}
const pickerName = (id: string, name: string) => PICKER_NAMES[id] || name

const GlobeExplorer = lazy(() => import('./components/globe/GlobeExplorer'))

const Loading = () => (
  <div style={{ width: '100%', height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF0CB6', fontFamily: "'Poppins', sans-serif" }}>Loading...</div>
)

export default function App() {
  const [route, setRoute] = useState<'locked' | 'detect' | 'main' | 'showcase' | 'explore'>('locked')
  const [geoResult, setGeoResult] = useState<GeoResult | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [chosenLangId, setChosenLangId] = useState<string | undefined>(undefined)
  const [localeReady, setLocaleReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.6)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const INSTRUMENTAL_URL = 'https://ykjntvewdxdgbmzmvmwa.supabase.co/storage/v1/object/sign/records-source-audio/public/music/dancefloor/Dancefloor-Intrumental-master.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV83YzcwNmEwNC04MjJiLTQ4YjEtOWQyZC04ZWY3ZDRjZmQ0MGIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJyZWNvcmRzLXNvdXJjZS1hdWRpby9wdWJsaWMvbXVzaWMvZGFuY2VmbG9vci9EYW5jZWZsb29yLUludHJ1bWVudGFsLW1hc3Rlci5tcDMiLCJpYXQiOjE3NzUxOTcwMjYsImV4cCI6MTgwNjczMzAyNn0.KYPY9E73nd9V3vNcNuVqKQJAablAfNI2NfBoqEfegWE'

  const startAudio = () => {
    if (!audioRef.current) {
      const audio = new Audio(INSTRUMENTAL_URL)
      audio.crossOrigin = 'anonymous'
      audio.loop = true
      audio.volume = 0.6
      audioRef.current = audio

      // Set up Web Audio API analyser for globe reactivity
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      const source = ctx.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(ctx.destination)
      analyserRef.current = analyser
    }
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true)).catch(() => {})
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }

  // Geo-detect + preload their locale so the popup shows in their language
  useEffect(() => {
    if (route !== 'detect') return
    detectUserCountry().then(async result => {
      if (result) {
        // Load their locale FIRST so the popup renders in their language
        await loadLocale(result.language.id)
        setGeoResult(result)
        setLocaleReady(true)
      } else {
        // No detection — show picker directly, default English
        setShowPicker(true)
        setLocaleReady(true)
      }
    })
  }, [route])

  const acceptGeo = async (geo: GeoResult) => {
    startAudio()
    setChosenLangId(geo.language.id)
    setRoute('main')
  }

  const pickLanguage = async (langId: string) => {
    await loadLocale(langId)
    startAudio()
    setChosenLangId(langId)
    setRoute('main')
  }

  // Direct link routes — no PIN required
  const params = new URLSearchParams(window.location.search)
  if (params.has('choices')) return <ChoicesPage />
  if (params.has('results')) return <ChoicesResultsPage />

  if (route === 'locked') {
    return <PinGate onUnlock={(label) => {
      if (label === 'showcase') setRoute('showcase')
      else setRoute('detect')
    }} />
  }

  if (params.has('explore')) {
    return <Suspense fallback={<Loading />}><GlobeExplorer /></Suspense>
  }

  if (route === 'showcase') return <ShowcasePage />

  // Geo-detection / language picker screen
  if (route === 'detect') {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center" style={{ fontFamily: "'Sora', sans-serif" }}>

        {/* Unified language selection card */}
        {(geoResult && localeReady) || showPicker ? (
          <div style={{
            borderRadius: '1.5rem',
            background: 'rgba(10,10,10,0.9)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,12,182,0.3)',
            boxShadow: '0 0 30px rgba(255,12,182,0.2)',
            padding: '24px 28px',
            maxWidth: 420,
            width: '92%',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column' as const,
            textAlign: 'center',
          }}>
            {/* Detected language suggestion */}
            {geoResult && localeReady && (
              <>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, color: '#a0a0a0', marginBottom: 6 }}>
                  We've detected
                </div>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 22, color: '#FF0CB6', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {geoResult.language.name}
                </div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, color: '#a0a0a0', marginBottom: 16 }}>
                  might be your preferred language
                </div>
                <button onClick={() => acceptGeo(geoResult)} style={{
                  display: 'block', width: '100%', padding: '13px 0', borderRadius: '2rem',
                  background: '#FF0CB6', border: 'none', color: '#fff',
                  fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(255,12,182,0.4)',
                }}>
                  Continue
                </button>
              </>
            )}

            {/* Divider + expand trigger */}
            <div style={{ marginTop: geoResult ? 18 : 0, marginBottom: 12 }}>
              <button onClick={() => setShowPicker(!showPicker)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'Sora', sans-serif", fontSize: 12, color: '#a0a0a0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                width: '100%',
              }}>
                {geoResult ? 'Or, select from:' : 'Choose your language'}
                <span style={{ fontSize: 10, transition: 'transform 0.2s', display: 'inline-block', transform: showPicker ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </button>
            </div>

            {/* Expandable language grid */}
            {showPicker && (
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <div className="grid grid-cols-2 gap-2">
                  {[...LANGS].sort((a, b) => pickerName(a.id, a.name).localeCompare(pickerName(b.id, b.name))).map((l) => (
                    <button key={l.id} onClick={() => pickLanguage(l.id)} style={{
                      padding: '10px 12px', borderRadius: '1rem',
                      background: geoResult && l.id === geoResult.language.id ? 'rgba(255,12,182,0.15)' : 'rgba(255,12,182,0.06)',
                      border: `1px solid ${geoResult && l.id === geoResult.language.id ? 'rgba(255,12,182,0.4)' : 'rgba(255,12,182,0.15)'}`,
                      color: '#e2e2e2', cursor: 'pointer',
                      textAlign: 'left', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,12,182,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,12,182,0.4)' }}
                    onMouseLeave={e => { if (!(geoResult && l.id === geoResult.language.id)) { e.currentTarget.style.background = 'rgba(255,12,182,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,12,182,0.15)' } }}
                    >
                      <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{pickerName(l.id, l.name)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Loading state while detecting */}
        {!geoResult && !showPicker && (
          <div style={{ color: 'rgba(255,12,182,0.4)', fontFamily: "'Sora', sans-serif", fontSize: 13, letterSpacing: '1px' }}>
            Detecting your location...
          </div>
        )}

      </div>
    )
  }

  return (
    <>
      <DancefloorPage initialLangId={chosenLangId} analyser={analyserRef.current} />
      {/* Audio controls — top right */}
      <div className="fixed top-6 right-6 z-[300] flex items-center gap-2">
        {/* Play/Pause */}
        <button onClick={togglePlay} className="flex items-center gap-2" style={{
          background: 'rgba(255,12,182,0.12)',
          border: '1px solid rgba(255,12,182,0.3)',
          borderRadius: '2rem',
          padding: '8px 16px',
          cursor: 'pointer',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 12px rgba(255,12,182,0.1)',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            {isPlaying ? (
              <>
                <rect x="2" y="1" width="3.5" height="12" rx="1" fill="#FF0CB6" />
                <rect x="8.5" y="1" width="3.5" height="12" rx="1" fill="#FF0CB6" />
              </>
            ) : (
              <path d="M2.5 1.5L12 7L2.5 12.5V1.5Z" fill="#FF0CB6" />
            )}
          </svg>
          <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, color: '#FF0CB6', fontWeight: 600, letterSpacing: '0.5px' }}>
            {isPlaying ? 'PLAYING' : 'PLAY'}
          </span>
        </button>
        {/* Volume */}
        <div className="flex items-center gap-1.5" style={{
          background: 'rgba(255,12,182,0.12)',
          border: '1px solid rgba(255,12,182,0.3)',
          borderRadius: '2rem',
          padding: '8px 12px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 12px rgba(255,12,182,0.1)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF0CB6" style={{ flexShrink: 0 }}>
            {volume === 0 ? (
              <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            ) : (
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            )}
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={e => {
              const v = parseFloat(e.target.value)
              setVolume(v)
              if (audioRef.current) audioRef.current.volume = v
            }}
            style={{
              width: 60,
              height: 3,
              appearance: 'none',
              background: `linear-gradient(to right, #FF0CB6 ${volume * 100}%, rgba(255,255,255,0.15) ${volume * 100}%)`,
              borderRadius: 2,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </div>
      </div>
    </>
  )
}
