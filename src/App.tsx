import { useState } from 'react'
import { useSnapScroll } from './hooks/useSnapScroll'
import PinGate from './components/PinGate'
import Hero from './components/Hero'
import Concept from './components/Concept'
import Cities from './components/Cities'
import Counter from './components/Counter'
import Listen from './components/Listen'
import SectionDots from './components/SectionDots'

const SECTION_COUNT = 5

export default function App() {
  const [unlocked, setUnlocked] = useState(false)
  const { activeSection, goTo } = useSnapScroll(SECTION_COUNT)

  if (!unlocked) {
    return <PinGate onUnlock={() => setUnlocked(true)} />
  }

  const sectionClass = (idx: number) => {
    if (idx === activeSection) return 'active'
    if (idx < activeSection) return 'exit-up'
    return 'exit-down'
  }

  return (
    <>
      <SectionDots active={activeSection} count={SECTION_COUNT} goTo={goTo} />
      <div className={`snap-section ${sectionClass(0)}`}><Hero /></div>
      <div className={`snap-section ${sectionClass(1)}`}><Concept isActive={activeSection === 1} /></div>
      <div className={`snap-section-scrollable ${sectionClass(2)}`}><Cities /></div>
      <div className={`snap-section ${sectionClass(3)}`}><Counter isActive={activeSection === 3} /></div>
      <div className={`snap-section ${sectionClass(4)}`}><Listen /></div>
    </>
  )
}
