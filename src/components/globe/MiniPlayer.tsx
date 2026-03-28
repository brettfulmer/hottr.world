/**
 * MiniPlayer — Persistent audio player with pink progress bar
 */
import { useRef, useState, useEffect } from 'react'

const TRACK_URL = 'https://ykjntvewdxdgbmzmvmwa.supabase.co/storage/v1/object/public/records/Dancefloor.mp3'

interface Props {
  languageName: string
  visible: boolean
}

export default function MiniPlayer({ languageName, visible }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(TRACK_URL)
      audioRef.current.loop = true
      audioRef.current.volume = 0.3
    }
    const audio = audioRef.current
    const update = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration)
      requestAnimationFrame(update)
    }
    update()
    return () => { audio.pause() }
  }, [])

  const toggle = () => {
    const audio = audioRef.current!
    if (audio.paused) { audio.play(); setPlaying(true) }
    else { audio.pause(); setPlaying(false) }
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
    }}>
      {/* Play/pause */}
      <button onClick={toggle} style={{
        width: 36, height: 36, borderRadius: '50%', border: 'none',
        background: '#FF0CB6', color: '#fff', fontSize: 14, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {playing ? '⏸' : '▶'}
      </button>

      {/* Track info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 12, textTransform: 'uppercase', color: '#e2e2e2' }}>
          DANCEFLOOR — {languageName}
        </div>
        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress * 100}%`, borderRadius: 2,
            background: 'linear-gradient(90deg, #FF0CB6, #ff4dcc)',
            boxShadow: '0 0 8px rgba(255,12,182,0.5)',
            transition: 'width 0.3s linear',
          }} />
        </div>
      </div>
    </div>
  )
}
