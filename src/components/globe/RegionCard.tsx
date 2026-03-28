/**
 * RegionCard — Glassmorphism floating card for the active language
 */
import { motion, AnimatePresence } from 'framer-motion'
import type { Language } from '../../data/languages-50'

interface Props {
  language: Language | null
  onPrev: () => void
  onNext: () => void
  index: number
  total: number
}

export default function RegionCard({ language, onPrev, onNext, index, total }: Props) {
  if (!language) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={language.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          width: '92%', maxWidth: '380px', zIndex: 50,
          background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px',
          padding: '1.25rem', color: '#e2e2e2',
        }}
      >
        {/* Pink top edge */}
        <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(to right, transparent, rgba(255,12,182,0.25), transparent)' }} />

        {/* Header with arrows */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <button onClick={onPrev} style={arrowStyle}>&#8249;</button>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#FF0CB6' }}>
              Active Linguistic Region
            </div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 'clamp(1.2rem,4vw,1.6rem)', textTransform: 'uppercase', letterSpacing: '-0.02em', marginTop: 2 }}>
              {language.name}
            </div>
          </div>
          <button onClick={onNext} style={arrowStyle}>&#8250;</button>
        </div>

        {/* Big speaker count */}
        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 'clamp(1.5rem,5vw,2rem)', color: '#FF0CB6' }}>
            {language.speakers}
          </span>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, color: '#919090', marginLeft: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            speakers
          </span>
        </div>

        {/* City */}
        <div style={{ textAlign: 'center', fontFamily: "'Sora',sans-serif", fontSize: 12, color: '#919090', marginBottom: '0.75rem' }}>
          {language.city}
        </div>

        {/* Countries */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#919090', marginBottom: 6 }}>
            Countries &amp; Regions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
            {language.countries.map(c => (
              <div key={c} style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, fontWeight: 500, color: '#e2e2e2', textTransform: 'uppercase' }}>
                {c}
              </div>
            ))}
          </div>
        </div>

        {/* Counter */}
        <div style={{ textAlign: 'center', marginTop: '0.75rem', fontFamily: "'Sora',sans-serif", fontSize: 10, color: 'rgba(226,226,226,0.3)', letterSpacing: '0.1em' }}>
          {index + 1} / {total}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

const arrowStyle: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 4,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
  color: 'rgba(226,226,226,0.5)',
  fontSize: 18, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
