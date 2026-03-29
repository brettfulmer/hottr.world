import { useState, lazy, Suspense } from 'react'
import PinGate from './components/PinGate'
import DancefloorPage from './components/DancefloorPage'
import ShowcasePage from './components/ShowcasePage'

const GlobeExplorer = lazy(() => import('./components/globe/GlobeExplorer'))

const Loading = () => (
  <div style={{ width: '100%', height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF0CB6', fontFamily: "'Poppins', sans-serif" }}>Loading...</div>
)

export default function App() {
  const [route, setRoute] = useState<'locked' | 'main' | 'showcase' | 'explore'>('locked')

  if (route === 'locked') {
    return <PinGate onUnlock={(label) => {
      if (label === 'showcase') setRoute('showcase')
      else setRoute('main')
    }} />
  }

  // ?explore override (for either PIN)
  if (new URLSearchParams(window.location.search).has('explore')) {
    return <Suspense fallback={<Loading />}><GlobeExplorer /></Suspense>
  }

  if (route === 'showcase') return <ShowcasePage />

  return <DancefloorPage />
}
