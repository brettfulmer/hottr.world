import { useRef, useState, useEffect, useCallback } from 'react'

const TRACK_URL = 'https://ykjntvewdxdgbmzmvmwa.supabase.co/storage/v1/object/public/records/Dancefloor.mp3'
const platforms = ['Spotify', 'Apple Music', 'YouTube Music', 'Amazon Music', 'Tidal', 'Deezer']

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function Listen() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Sync with global audio element from Hero
  useEffect(() => {
    const existing = document.getElementById('dancefloor-audio') as HTMLAudioElement | null
    if (existing) {
      (audioRef as React.MutableRefObject<HTMLAudioElement>).current = existing
      setPlaying(!existing.paused)
    }
  }, [])

  const syncState = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    setPlaying(!audio.paused)
    setCurrentTime(audio.currentTime)
    setDuration(audio.duration || 0)
    setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0)
  }, [])

  useEffect(() => {
    const interval = setInterval(syncState, 250)
    return () => clearInterval(interval)
  }, [syncState])

  const getOrCreateAudio = () => {
    let audio = audioRef.current
    if (!audio) {
      const existing = document.getElementById('dancefloor-audio') as HTMLAudioElement | null
      if (existing) {
        audio = existing
      } else {
        const el = document.createElement('audio')
        el.id = 'dancefloor-audio'
        el.src = TRACK_URL
        el.preload = 'none'
        document.body.appendChild(el)
        audio = el
      }
      (audioRef as React.MutableRefObject<HTMLAudioElement>).current = audio
    }
    return audio
  }

  const togglePlay = () => {
    const audio = getOrCreateAudio()
    if (audio.paused) {
      audio.play()
      setPlaying(true)
    } else {
      audio.pause()
      setPlaying(false)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = getOrCreateAudio()
    if (!audio.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = pct * audio.duration
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Player */}
        <div className="w-full max-w-[420px] mb-12">
          <p className="font-['Poppins'] text-[11px] font-semibold tracking-[0.3em] uppercase text-white/40 mb-3 text-center">
            NOW STREAMING
          </p>
          <div className="rounded-sm border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={togglePlay}
                className="w-12 h-12 flex items-center justify-center rounded-sm bg-[#FF0CB6] transition-all duration-300 hover:bg-[#ff4dcc] hover:shadow-[0_0_16px_rgba(255,12,182,0.4)] shrink-0"
              >
                {playing ? (
                  <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
                    <rect x="1" y="0" width="5" height="18" rx="1" fill="white" />
                    <rect x="10" y="0" width="5" height="18" rx="1" fill="white" />
                  </svg>
                ) : (
                  <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
                    <path d="M2 1L14 9L2 17V1Z" fill="white" />
                  </svg>
                )}
              </button>
              <div className="min-w-0">
                <p className="font-['Poppins'] text-[16px] font-semibold text-white truncate">
                  Dancefloor
                </p>
                <p className="font-['Poppins'] text-[13px] text-white/50">
                  HOTTR
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div
              className="w-full h-[3px] bg-white/10 rounded-full cursor-pointer group"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-[#FF0CB6] rounded-full relative transition-all duration-150"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[9px] h-[9px] rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="font-mono text-[11px] text-white/30">{formatTime(currentTime)}</span>
              <span className="font-mono text-[11px] text-white/30">{duration ? formatTime(duration) : '--:--'}</span>
            </div>
          </div>
        </div>

        {/* Platform links */}
        <div className="flex flex-wrap justify-center gap-3">
          {platforms.map((name) => (
            <a
              key={name}
              href="#"
              className="rounded-sm border border-white/10 bg-white/5 px-5 py-3 font-['Poppins'] text-sm text-white/60 transition-all duration-300 hover:border-[#FF0CB6]/40 hover:text-white hover:shadow-[0_0_16px_rgba(255,12,182,0.3)]"
            >
              {name}
            </a>
          ))}
        </div>
        <p className="mt-6 font-['Poppins'] text-[13px] text-white/40">
          Search 'Hottr' on any platform
        </p>
      </div>
      <footer className="absolute bottom-0 w-full pb-8 text-center">
        <div className="flex justify-center gap-6 text-[13px] text-white/40 font-['Poppins']">
          <a href="https://instagram.com/hottr" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            Instagram
          </a>
          <a href="https://tiktok.com/@hottr" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            TikTok
          </a>
          <a href="https://x.com/hottr" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            X
          </a>
        </div>
        <p className="text-[12px] text-white/25 font-['Poppins'] mt-4">&copy; 2026 Hottr Records</p>
        <p className="text-[11px] text-white/20 font-['Poppins'] mt-1">press@hottr.world</p>
      </footer>
    </div>
  )
}
