import { useState } from 'react'
import PinGate from './components/PinGate'
import DancefloorPage from './components/DancefloorPage'

export default function App() {
  const [unlocked, setUnlocked] = useState(false)

  if (!unlocked) {
    return <PinGate onUnlock={() => setUnlocked(true)} />
  }

  return <DancefloorPage />
}
