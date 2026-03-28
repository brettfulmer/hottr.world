import { useState, lazy, Suspense } from 'react'
import PinGate from './components/PinGate'
import DancefloorPage from './components/DancefloorPage'

// R3F Globe Explorer — alternative route at ?explore
const GlobeExplorer = lazy(() => import('./components/globe/GlobeExplorer'))

export default function App() {
  const [unlocked, setUnlocked] = useState(false)

  if (!unlocked) {
    return <PinGate onUnlock={() => setUnlocked(true)} />
  }

  // Check if ?explore query param is set
  const isExplore = new URLSearchParams(window.location.search).has('explore')

  if (isExplore) {
    return (
      <Suspense fallback={<div style={{ width: '100%', height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF0CB6', fontFamily: "'Poppins', sans-serif" }}>Loading...</div>}>
        <GlobeExplorer />
      </Suspense>
    )
  }

  return <DancefloorPage />
}
