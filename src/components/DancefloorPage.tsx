import { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react'
import { languages } from '../data/languages'
import type { Language } from '../data/languages'

const Globe3D = lazy(() => import('./Globe3D'))

const TRACK_URL = 'https://ykjntvewdxdgbmzmvmwa.supabase.co/storage/v1/object/public/records/Dancefloor.mp3'
const LAUNCH_DATE = new Date('2026-04-17T00:00:00Z')

// Timing: seconds each editorial scene stays visible before auto-advancing
const SCENE_DURATIONS = [5000, 5000, 5000, 3000, 5000]

function useCountdown() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, LAUNCH_DATE.getTime() - now.getTime())
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000),
    secs: Math.floor((diff % 60000) / 1000),
    launched: diff === 0,
  }
}

function pad(n: number) { return String(n).padStart(2, '0') }

function GrainOverlay() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number
    const draw = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight
      const img = ctx.createImageData(canvas.width, canvas.height)
      const d = img.data
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 18; d[i] = v; d[i+1] = v; d[i+2] = v; d[i+3] = 10
      }
      ctx.putImageData(img, 0, 0)
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-[100] mix-blend-overlay" />
}

export default function DancefloorPage() {
  const [scene, setScene] = useState(0)
  const [selected, setSelected] = useState<Language>(languages[0])
  const [playing, setPlaying] = useState(false)
  const [gridOpen, setGridOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const countdown = useCountdown()

  const cycleLang = useCallback((dir: number) => {
    const idx = languages.findIndex(l => l.id === selected.id)
    const next = (idx + dir + languages.length) % languages.length
    setSelected(languages[next])
  }, [selected])

  // Auto-advancing cinematic sequence
  useEffect(() => {
    if (scene >= 5) return
    const timer = setTimeout(() => setScene(s => s + 1), SCENE_DURATIONS[scene])
    return () => clearTimeout(timer)
  }, [scene])

  // Allow tap/click/scroll to skip ahead during editorial
  useEffect(() => {
    if (scene >= 5) return
    const skip = () => setScene(s => Math.min(s + 1, 5))
    const onWheel = (e: WheelEvent) => { e.preventDefault(); if (e.deltaY > 20) skip() }
    const onTouch = () => skip()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowDown' || e.key === ' ') skip() }
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchend', onTouch, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchend', onTouch)
      window.removeEventListener('keydown', onKey)
    }
  }, [scene])

  // Keyboard for globe language cycling
  useEffect(() => {
    if (scene < 5) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') cycleLang(-1)
      else if (e.key === 'ArrowRight') cycleLang(1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [scene, cycleLang])

  useEffect(() => {
    const existing = document.getElementById('dancefloor-audio') as HTMLAudioElement | null
    if (existing) { audioRef.current = existing; setPlaying(!existing.paused) }
  }, [])

  const handlePlay = () => {
    if (!countdown.launched) return
    let audio = audioRef.current
    if (!audio) {
      const existing = document.getElementById('dancefloor-audio') as HTMLAudioElement | null
      if (existing) { audio = existing }
      else {
        const el = document.createElement('audio')
        el.id = 'dancefloor-audio'; el.src = TRACK_URL; el.preload = 'none'
        document.body.appendChild(el); audio = el
      }
      audioRef.current = audio
    }
    if (audio.paused) { audio.play(); setPlaying(true) }
    else { audio.pause(); setPlaying(false) }
  }

  const sceneStyle = (idx: number): React.CSSProperties => ({
    position: 'fixed', inset: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    opacity: scene === idx ? 1 : 0,
    transition: 'opacity 1200ms ease',
    pointerEvents: scene === idx ? 'auto' : 'none',
    zIndex: scene === idx ? 10 : 1,
  })

  const moreCount = selected.moreCountries
  const tickerNames = languages.map(l => l.name)
  const tickerDuped = [...tickerNames, ...tickerNames]

  return (
    <div className="w-full h-[100dvh] overflow-hidden bg-[#050608]">
      <GrainOverlay />
      <div className="fixed inset-0 pointer-events-none z-[99]"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5,6,8,0.8) 100%)' }} />

      {/* ====== SCENE 0: THE HOOK ====== */}
      <div style={sceneStyle(0)}>
        <div className="px-6 sm:px-10 max-w-[860px]">
          <p className="text-[24px] sm:text-[36px] md:text-[48px] font-bold text-white leading-[1.15] text-center"
            style={{ fontFamily: 'Poppins' }}>
            Music has always been the thing that brings strangers together.
          </p>
          <p className="text-[12px] sm:text-[15px] md:text-[18px] font-normal text-white/35 text-center mt-5 sm:mt-6 tracking-[0.15em] uppercase"
            style={{ fontFamily: 'Poppins' }}>
            Across borders. Across cultures. Across languages you&apos;ve never spoken.
          </p>
        </div>
      </div>

      {/* ====== SCENE 1: THE FEELING ====== */}
      <div style={sceneStyle(1)}>
        <div className="px-6 sm:px-10 max-w-[720px]">
          <p className="text-[16px] sm:text-[20px] md:text-[24px] font-normal text-white/55 text-center leading-[1.8]"
            style={{ fontFamily: 'Poppins' }}>
            You know that feeling — when a song takes over and you can&apos;t help but sing along. The joy, the release, the shared moment on the dancefloor when nothing else matters.
          </p>
        </div>
      </div>

      {/* ====== SCENE 2: THE TRUTH ====== */}
      <div style={sceneStyle(2)}>
        <div className="px-6 sm:px-10 max-w-[720px]">
          <p className="text-[16px] sm:text-[20px] md:text-[24px] font-normal text-white/45 text-center leading-[1.8]"
            style={{ fontFamily: 'Poppins' }}>
            But sometimes you don&apos;t understand the lyrics. You&apos;re singing sounds, not words. And you&apos;ve never known what you were actually singing.
          </p>
        </div>
      </div>

      {/* ====== SCENE 3: THE DROP ====== */}
      <div style={sceneStyle(3)}>
        <p className="text-[32px] sm:text-[52px] md:text-[72px] font-bold text-[#FF0CB6] text-center tracking-tight"
          style={{ fontFamily: 'Poppins', textShadow: '0 0 40px rgba(255,12,182,0.6), 0 0 80px rgba(255,12,182,0.25)' }}>
          Not anymore.
        </p>
      </div>

      {/* ====== SCENE 4: THE REVEAL ====== */}
      <div style={sceneStyle(4)}>
        <div className="px-6 sm:px-10 max-w-[780px]">
          <p className="text-[14px] sm:text-[17px] md:text-[19px] font-normal text-white/45 text-center leading-[1.9]"
            style={{ fontFamily: 'Poppins' }}>
            For the first time in history, a commercially released single is dropping in multiple languages — allowing over <span className="text-white font-semibold">5 billion</span> people around the world to sing along, and actually understand every word they&apos;re singing.
          </p>
        </div>
      </div>

      {/* ====== SCENE 5: THE GLOBE ====== */}
      <div style={{ ...sceneStyle(5), justifyContent: 'flex-start', alignItems: 'center' }}>
        {gridOpen && (
          <div className="fixed inset-0 z-[60] bg-[#050608]/95 backdrop-blur-xl flex flex-col">
            <header className="flex justify-between items-center px-6 py-6">
              <div className="text-xl font-extrabold tracking-[0.1em] text-[#FF0CB6]" style={{ fontFamily: 'Poppins' }}>DANCEFLOOR</div>
              <button onClick={() => setGridOpen(false)} className="material-symbols-outlined text-white/60 hover:text-[#FF0CB6] transition-all duration-300">close</button>
            </header>
            <div className="flex-1 overflow-y-auto selection-scroll px-6 sm:px-8 py-4">
              <p className="text-[10px] tracking-[0.2em] font-semibold text-[#FF0CB6] uppercase mb-6" style={{ fontFamily: 'Poppins' }}>Select Language</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {languages.map(lang => (
                  <button key={lang.id} onClick={() => { setSelected(lang); setGridOpen(false) }}
                    className={`text-left px-4 py-3 rounded-sm border transition-all ${lang.id === selected.id ? 'border-[#FF0CB6]/50 bg-[#FF0CB6]/10 text-white' : 'border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-white/20'}`}>
                    <span className="text-xs font-bold tracking-wider uppercase">{lang.name}</span>
                    <span className="block text-[8px] tracking-widest text-white/30 mt-1 uppercase">{lang.speakers}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Title + Chain + Ball layout */}
        <div className="w-full h-full flex flex-col items-center relative overflow-visible" style={{ paddingTop: 'max(1rem, 2vh)' }}>
          {/* DANCEFLOOR — big, bold, aligned with language text */}
          <h1 className="text-[9vw] sm:text-[7vw] md:text-[52px] font-extrabold tracking-tight text-[#FF0CB6] leading-none z-20 text-center uppercase"
            style={{ fontFamily: 'Poppins', textShadow: '0 0 40px rgba(255,12,182,0.35)' }}>
            DANCEFLOOR
          </h1>

          {/* Countdown — bold, wide spacing */}
          {!countdown.launched && (
            <div className="mt-1 flex items-center justify-center gap-[0.3em] font-mono text-[4vw] sm:text-[3vw] md:text-[20px] font-bold text-white/25 z-20 tracking-[0.08em]">
              <span>{pad(countdown.days)}</span>
              <span className="text-[#FF0CB6]/30">:</span>
              <span>{pad(countdown.hours)}</span>
              <span className="text-[#FF0CB6]/30">:</span>
              <span>{pad(countdown.mins)}</span>
              <span className="text-[#FF0CB6]/30">:</span>
              <span>{pad(countdown.secs)}</span>
            </div>
          )}

          {/* Chain */}
          <div className="w-[1px] flex-shrink-0 z-20 bg-gradient-to-b from-white/15 via-white/8 to-transparent" style={{ height: 'max(16px, 2.5vh)' }} />

          {/* Background language name */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
            <span className="text-[16vw] font-black leading-none tracking-tighter text-[#FF0CB6] opacity-[0.04] uppercase">{selected.name}</span>
          </div>

          {/* Mirror Ball — always fully visible, never clipped */}
          <div className="relative z-10 flex-shrink-0" style={{ width: 'min(65vw, 65vh, 500px)', height: 'min(65vw, 65vh, 500px)' }}>
            <button onClick={() => cycleLang(-1)}
              className="absolute -left-8 sm:-left-12 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/25 hover:text-[#FF0CB6] transition-all duration-200 z-20 text-2xl select-none">
              &#8249;
            </button>
            <button onClick={() => cycleLang(1)}
              className="absolute -right-8 sm:-right-12 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/25 hover:text-[#FF0CB6] transition-all duration-200 z-20 text-2xl select-none">
              &#8250;
            </button>
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#FF0CB6]/30 border-t-[#FF0CB6] rounded-full animate-spin" /></div>}>
              <Globe3D selected={selected} />
            </Suspense>
          </div>
        </div>

        {/* Info Card — glassmorphism */}
        <aside className="fixed md:left-8 bottom-12 left-3 right-3 md:right-auto md:w-[380px] rounded-sm z-30"
          style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start mb-5">
              <div className="space-y-1.5">
                <p className="text-[9px] tracking-[0.25em] font-semibold text-[#FF0CB6] uppercase" style={{ fontFamily: 'Poppins' }}>Active Linguistic Region</p>
                <h3 className="text-[22px] sm:text-[28px] font-bold text-white tracking-tight uppercase leading-none" style={{ fontFamily: 'Poppins' }}>{selected.name}</h3>
              </div>
              <button onClick={() => setGridOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-sm bg-white/5 border border-white/8 hover:border-[#FF0CB6]/30 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[#FF0CB6] text-base">language</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5 border-t border-white/[0.05] pt-5">
              <div>
                <p className="text-[8px] tracking-[0.2em] font-semibold text-white/20 mb-1 uppercase">Speakers</p>
                <p className="text-[12px] font-semibold text-white/80" style={{ fontFamily: 'Poppins' }}>{selected.speakers}</p>
              </div>
              <div>
                <p className="text-[8px] tracking-[0.2em] font-semibold text-white/20 mb-1 uppercase">Rank</p>
                <p className="text-[12px] font-semibold text-white/80" style={{ fontFamily: 'Poppins' }}>{selected.globalRank}</p>
              </div>
            </div>
            <div className="border-t border-white/[0.05] pt-4 mb-5">
              <p className="text-[8px] tracking-[0.2em] font-semibold text-white/20 mb-2.5 uppercase">Regions</p>
              <div className="grid grid-cols-3 gap-y-1.5 gap-x-1">
                {selected.countries.slice(0, 6).map(c => (
                  <div key={c} className="text-[9px] font-semibold text-white/60 uppercase truncate">{c}</div>
                ))}
              </div>
              {moreCount > 0 && <p className="text-[9px] text-white/20 mt-1.5 uppercase">+{moreCount} more</p>}
            </div>
            {countdown.launched ? (
              <button onClick={handlePlay}
                className="w-full bg-[#FF0CB6] text-white py-3 rounded-sm font-semibold text-[10px] tracking-[0.15em] uppercase hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(255,12,182,0.25)]">
                {playing ? 'PAUSE' : 'LISTEN NOW'}
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{playing ? 'pause' : 'play_arrow'}</span>
              </button>
            ) : (
              <div className="w-full bg-white/[0.02] border border-white/[0.05] text-white/30 py-3 rounded-sm font-bold text-[9px] tracking-[0.12em] uppercase flex items-center justify-center gap-2 cursor-not-allowed">
                <span style={{ fontFamily: 'Poppins' }}>UNLOCKS ON RELEASE</span>
              </div>
            )}
          </div>
        </aside>

        {/* Ticker */}
        <div className="fixed bottom-0 left-0 right-0 h-8 bg-[#050608]/40 backdrop-blur-sm border-t border-white/[0.03] overflow-hidden z-40 flex items-center">
          <div className="flex items-center gap-10 whitespace-nowrap ticker-marquee">
            {tickerDuped.map((name, i) => (
              <span key={`${name}-${i}`}
                className={`text-[9px] tracking-[0.12em] uppercase ${name === selected.name ? 'text-[#FF0CB6]/50' : 'text-white/10'}`}
                style={{ fontFamily: 'Poppins' }}>
                {name}
              </span>
            ))}
          </div>
        </div>

        <footer className="fixed bottom-8 left-0 right-0 px-6 py-1 pointer-events-none hidden md:block z-30">
          <div className="flex justify-between items-center text-[8px] font-medium text-white/12 uppercase">
            <div className="pointer-events-auto">&copy; 2026 HOTTR RECORDS</div>
            <div className="flex gap-5 pointer-events-auto">
              <a className="hover:text-white/30 transition-colors" href="https://instagram.com/hottr" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a className="hover:text-white/30 transition-colors" href="https://tiktok.com/@hottr" target="_blank" rel="noopener noreferrer">TikTok</a>
              <a className="hover:text-white/30 transition-colors" href="https://x.com/hottr" target="_blank" rel="noopener noreferrer">X</a>
              <a className="hover:text-white/30 transition-colors" href="mailto:press@hottr.world">Contact</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Progress dots */}
      {scene < 5 && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${scene === i ? 'bg-[#FF0CB6] shadow-[0_0_6px_rgba(255,12,182,0.5)]' : scene > i ? 'bg-white/10' : 'bg-white/5'}`} />
          ))}
        </div>
      )}
    </div>
  )
}
