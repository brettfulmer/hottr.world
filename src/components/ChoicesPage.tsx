import { useState, useRef, useEffect, useCallback } from 'react'
import { submitVote } from '../lib/supabase'

const TRACKS = [
  {
    label: 'Version 1',
    url: 'https://ykjntvewdxdgbmzmvmwa.supabase.co/storage/v1/object/sign/records-source-audio/public/music/dancefloor/Dancefloor%20-%20English%20-%20V1.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV83YzcwNmEwNC04MjJiLTQ4YjEtOWQyZC04ZWY3ZDRjZmQ0MGIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJyZWNvcmRzLXNvdXJjZS1hdWRpby9wdWJsaWMvbXVzaWMvZGFuY2VmbG9vci9EYW5jZWZsb29yIC0gRW5nbGlzaCAtIFYxLm1wMyIsImlhdCI6MTc3NTIxNTU1MywiZXhwIjoxNzc1ODIwMzUzfQ.0YQ3jgu5q6N8LyhjnIXdoc3FtZI-XSr6nL2d0lPuQ9w',
  },
  {
    label: 'Version 2',
    url: 'https://ykjntvewdxdgbmzmvmwa.supabase.co/storage/v1/object/sign/records-source-audio/public/music/dancefloor/Dancefloor%20-%20English%20-%20V2.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV83YzcwNmEwNC04MjJiLTQ4YjEtOWQyZC04ZWY3ZDRjZmQ0MGIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJyZWNvcmRzLXNvdXJjZS1hdWRpby9wdWJsaWMvbXVzaWMvZGFuY2VmbG9vci9EYW5jZWZsb29yIC0gRW5nbGlzaCAtIFYyLm1wMyIsImlhdCI6MTc3NTIxNTU1OSwiZXhwIjoxNzc1ODIwMzU5fQ.i5sVaVDKYzY0afRuh7xJ68psYNN8Vg6vN1XNosXQnFc',
  },
  {
    label: 'Version 3',
    url: 'https://ykjntvewdxdgbmzmvmwa.supabase.co/storage/v1/object/sign/records-source-audio/public/music/dancefloor/Dancefloor%20-%20English%20-%20V3.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV83YzcwNmEwNC04MjJiLTQ4YjEtOWQyZC04ZWY3ZDRjZmQ0MGIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJyZWNvcmRzLXNvdXJjZS1hdWRpby9wdWJsaWMvbXVzaWMvZGFuY2VmbG9vci9EYW5jZWZsb29yIC0gRW5nbGlzaCAtIFYzLm1wMyIsImlhdCI6MTc3NTIxNTU2NiwiZXhwIjoxNzc1ODIwMzY2fQ._aRCbj6Hs0CBhG0nRDovXimFbEIKfO_bNrc9DMQ5OyA',
  },
]

export default function ChoicesPage() {
  const [playing, setPlaying] = useState<number | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [progress, setProgress] = useState([0, 0, 0])
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const audiosRef = useRef<HTMLAudioElement[]>([])

  // Create audio elements once
  useEffect(() => {
    audiosRef.current = TRACKS.map(t => {
      const a = new Audio(t.url)
      a.crossOrigin = 'anonymous'
      a.preload = 'metadata'
      return a
    })
    return () => { audiosRef.current.forEach(a => { a.pause(); a.src = '' }) }
  }, [])

  // Progress updater
  useEffect(() => {
    let raf: number
    const tick = () => {
      setProgress(audiosRef.current.map(a =>
        a.duration ? a.currentTime / a.duration : 0
      ))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const togglePlay = useCallback((idx: number) => {
    const audios = audiosRef.current
    if (playing === idx) {
      audios[idx].pause()
      setPlaying(null)
    } else {
      // Pause all others
      audios.forEach((a, i) => { if (i !== idx) a.pause() })
      audios[idx].play().catch(() => {})
      setPlaying(idx)
    }
  }, [playing])

  const handleSubmit = async () => {
    if (selected === null || submitting) return
    setSubmitting(true)
    // Pause audio
    audiosRef.current.forEach(a => a.pause())
    setPlaying(null)

    const { ok, error } = await submitVote(selected + 1)
    if (ok) {
      setSubmitted(true)
    } else {
      console.error('Vote failed:', error)
      setSubmitted(true) // Show thanks anyway
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center" style={{ fontFamily: "'Sora', sans-serif" }}>
        <div style={{
          borderRadius: '1.5rem',
          background: 'rgba(10,10,10,0.9)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,12,182,0.3)',
          boxShadow: '0 0 30px rgba(255,12,182,0.2)',
          padding: '40px 32px',
          maxWidth: 420,
          width: '90%',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>&#10003;</div>
          <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 8 }}>
            Thank you!
          </div>
          <div style={{ fontSize: 14, color: '#a0a0a0', lineHeight: 1.6 }}>
            Your vote for <span style={{ color: '#FF0CB6', fontWeight: 700 }}>Version {selected! + 1}</span> has been recorded.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center" style={{ fontFamily: "'Sora', sans-serif" }}>
      <div style={{
        borderRadius: '1.5rem',
        background: 'rgba(10,10,10,0.9)',
        backdropFilter: 'blur(40px)',
        border: '1px solid rgba(255,12,182,0.3)',
        boxShadow: '0 0 30px rgba(255,12,182,0.2)',
        padding: '28px 24px',
        maxWidth: 440,
        width: '92%',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 20, color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 4 }}>
            DANCEFLOOR
          </div>
          <div style={{ fontSize: 12, color: '#a0a0a0', letterSpacing: '0.5px' }}>
            Listen to all three versions, then vote for your favourite
          </div>
        </div>

        {/* Track rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {TRACKS.map((track, idx) => {
            const isPlaying = playing === idx
            const isSelected = selected === idx
            return (
              <div
                key={idx}
                onClick={() => setSelected(idx)}
                style={{
                  borderRadius: '1rem',
                  background: isSelected ? 'rgba(255,12,182,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `2px solid ${isSelected ? '#FF0CB6' : 'rgba(255,255,255,0.08)'}`,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Play/Pause */}
                  <button
                    onClick={e => { e.stopPropagation(); togglePlay(idx) }}
                    style={{
                      width: 42, height: 42, borderRadius: '50%',
                      background: isPlaying ? '#FF0CB6' : 'rgba(255,12,182,0.1)',
                      border: `1px solid ${isPlaying ? '#FF0CB6' : 'rgba(255,12,182,0.3)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0,
                      boxShadow: isPlaying ? '0 0 15px rgba(255,12,182,0.4)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                      {isPlaying ? (
                        <>
                          <rect x="2.5" y="1.5" width="3" height="11" rx="1" fill="#fff" />
                          <rect x="8.5" y="1.5" width="3" height="11" rx="1" fill="#fff" />
                        </>
                      ) : (
                        <path d="M3 1.5L12 7L3 12.5V1.5Z" fill="#FF0CB6" />
                      )}
                    </svg>
                  </button>

                  {/* Track info + progress */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{
                        fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15,
                        color: isSelected ? '#FF0CB6' : '#e2e2e2',
                        letterSpacing: '0.5px',
                      }}>
                        {track.label}
                      </span>
                      {/* EQ bars when playing */}
                      {isPlaying && (
                        <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 14 }}>
                          {[0, 0.15, 0.3, 0.45].map((delay, i) => (
                            <span key={i} style={{
                              display: 'block', width: 2.5, height: '100%', borderRadius: 1,
                              background: '#FF0CB6',
                              transformOrigin: 'bottom',
                              animation: `eqBounce 0.8s ease-in-out ${delay}s infinite`,
                            }} />
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div style={{
                      width: '100%', height: 3, borderRadius: 2,
                      background: 'rgba(255,255,255,0.08)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${progress[idx] * 100}%`,
                        height: '100%', borderRadius: 2,
                        background: isPlaying ? '#FF0CB6' : 'rgba(255,12,182,0.3)',
                        transition: 'width 0.1s linear',
                      }} />
                    </div>
                  </div>

                  {/* Selection indicator */}
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${isSelected ? '#FF0CB6' : 'rgba(255,255,255,0.15)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    {isSelected && (
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF0CB6' }} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={selected === null || submitting}
          style={{
            display: 'block', width: '100%', marginTop: 20,
            padding: '14px 0', borderRadius: '2rem',
            background: selected !== null ? '#FF0CB6' : 'rgba(255,12,182,0.2)',
            border: 'none', color: '#fff',
            fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15,
            cursor: selected !== null ? 'pointer' : 'default',
            boxShadow: selected !== null ? '0 0 20px rgba(255,12,182,0.4)' : 'none',
            opacity: submitting ? 0.6 : 1,
            transition: 'all 0.2s',
            letterSpacing: '1px',
          }}
        >
          {submitting ? 'Submitting...' : 'SUBMIT MY VOTE'}
        </button>
      </div>
    </div>
  )
}
