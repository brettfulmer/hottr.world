import { useState, useEffect, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import PinGate from './components/PinGate'
import DancefloorPage from './components/DancefloorPage'
import ShowcasePage from './components/ShowcasePage'
import { detectUserCountry, type GeoResult } from './i18n/geoDetect'
import { loadLocale } from './i18n'
import { languages as LANGS } from './data/languages-50'

const GlobeExplorer = lazy(() => import('./components/globe/GlobeExplorer'))

const Loading = () => (
  <div style={{ width: '100%', height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF0CB6', fontFamily: "'Poppins', sans-serif" }}>Loading...</div>
)

export default function App() {
  const { t } = useTranslation()
  const [route, setRoute] = useState<'locked' | 'detect' | 'main' | 'showcase' | 'explore'>('locked')
  const [geoResult, setGeoResult] = useState<GeoResult | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [chosenLangId, setChosenLangId] = useState<string | undefined>(undefined)

  // Start geo-detection as soon as PIN is unlocked
  useEffect(() => {
    if (route !== 'detect') return
    detectUserCountry().then(result => {
      if (result) {
        setGeoResult(result)
      } else {
        setShowPicker(true)
      }
    })
  }, [route])

  const acceptGeo = (geo: GeoResult) => {
    loadLocale(geo.language.id)
    setChosenLangId(geo.language.id)
    setRoute('main')
  }

  const declineGeo = () => {
    setChosenLangId('en')
    setRoute('main')
  }

  const pickLanguage = (langId: string) => {
    loadLocale(langId)
    setChosenLangId(langId)
    setRoute('main')
  }

  if (route === 'locked') {
    return <PinGate onUnlock={(label) => {
      if (label === 'showcase') setRoute('showcase')
      else setRoute('detect')
    }} />
  }

  // ?explore override (for either PIN)
  if (new URLSearchParams(window.location.search).has('explore')) {
    return <Suspense fallback={<Loading />}><GlobeExplorer /></Suspense>
  }

  if (route === 'showcase') return <ShowcasePage />

  // Geo-detection / language picker screen
  if (route === 'detect') {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center" style={{ fontFamily: "'Sora', sans-serif" }}>

        {/* Geo popup */}
        {geoResult && !showPicker && (
          <div style={{
            borderRadius: '1.5rem',
            background: 'rgba(10,10,10,0.85)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,12,182,0.3)',
            boxShadow: '0 0 30px rgba(255,12,182,0.2)',
            padding: '28px 32px',
            maxWidth: 380,
            width: '90%',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 18, color: '#fff', marginBottom: 6 }}>
              {t('geo.detected', { country: geoResult.country })}
            </div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, color: '#a0a0a0', marginBottom: 20 }}>
              {t('geo.suggestion', { language: geoResult.language.name })}
            </div>
            <button onClick={() => acceptGeo(geoResult)} style={{
              display: 'block', width: '100%', padding: '12px 0', borderRadius: '2rem',
              background: '#FF0CB6', border: 'none', color: '#fff',
              fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14,
              cursor: 'pointer', marginBottom: 10,
              boxShadow: '0 0 15px rgba(255,12,182,0.4)',
            }}>
              {t('geo.accept', { language: geoResult.language.name })}
            </button>
            <button onClick={declineGeo} style={{
              display: 'block', width: '100%', padding: '10px 0', borderRadius: '2rem',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#a0a0a0',
              fontFamily: "'Sora', sans-serif", fontWeight: 500, fontSize: 13,
              cursor: 'pointer', marginBottom: 14,
            }}>
              {t('geo.decline')}
            </button>
            <button onClick={() => setShowPicker(true)} style={{
              background: 'none', border: 'none', color: 'rgba(255,12,182,0.5)',
              fontFamily: "'Sora', sans-serif", fontSize: 11, cursor: 'pointer',
              letterSpacing: '0.5px',
            }}>
              Choose a different language
            </button>
          </div>
        )}

        {/* Language picker */}
        {showPicker && (
          <div style={{
            borderRadius: '1.5rem',
            background: 'rgba(10,10,10,0.9)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,12,182,0.3)',
            boxShadow: '0 0 30px rgba(255,12,182,0.2)',
            padding: '24px',
            maxWidth: 440,
            width: '92%',
            maxHeight: '75vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column' as const,
          }}>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 18, color: '#fff', textAlign: 'center', marginBottom: 4 }}>
              {t('geo.pickLanguage')}
            </div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, color: '#a0a0a0', textAlign: 'center', marginBottom: 16 }}>
              {t('geo.pickSubtitle')}
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div className="grid grid-cols-2 gap-2">
                {LANGS.map((l) => (
                  <button key={l.id} onClick={() => pickLanguage(l.id)} style={{
                    padding: '10px 12px', borderRadius: '1rem',
                    background: 'rgba(255,12,182,0.06)',
                    border: '1px solid rgba(255,12,182,0.15)',
                    color: '#e2e2e2', cursor: 'pointer',
                    textAlign: 'left', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,12,182,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,12,182,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,12,182,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,12,182,0.15)' }}
                  >
                    <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{l.name}</div>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 10, color: '#a0a0a0', marginTop: 2 }}>{l.city}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading state while detecting */}
        {!geoResult && !showPicker && (
          <div style={{ color: 'rgba(255,12,182,0.4)', fontFamily: "'Sora', sans-serif", fontSize: 13, letterSpacing: '1px' }}>
            Detecting your location...
          </div>
        )}
      </div>
    )
  }

  return <DancefloorPage initialLangId={chosenLangId} />
}
