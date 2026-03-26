import { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react'
import { languages } from '../data/languages'
import type { Language } from '../data/languages'

const Globe3D = lazy(() => import('./Globe3D'))

const TRACK_URL = 'https://ykjntvewdxdgbmzmvmwa.supabase.co/storage/v1/object/public/records/Dancefloor.mp3'
const LAUNCH_DATE = new Date('2026-04-17T00:00:00Z')
const SCENE_DURATIONS = [5500, 5500, 5500, 3500, 5500]

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
        const v = Math.random() * 16; d[i] = v; d[i+1] = v; d[i+2] = v; d[i+3] = 8
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
  const transitioning = useRef(false)

  const countdown = useCountdown()

  const cycleLang = useCallback((dir: number) => {
    const idx = languages.findIndex(l => l.id === selected.id)
    const next = (idx + dir + languages.length) % languages.length
    setSelected(languages[next])
  }, [selected])

  // Auto-advancing cinematic sequence
  useEffect(() => {
    if (scene >= 5) return
    const timer = setTimeout(() => {
      transitioning.current = true
      setScene(s => s + 1)
      setTimeout(() => { transitioning.current = false }, 1000)
    }, SCENE_DURATIONS[scene])
    return () => clearTimeout(timer)
  }, [scene])

  // Scroll/swipe/tap to skip ahead during editorial
  useEffect(() => {
    if (scene >= 5) return
    const skip = () => {
      if (transitioning.current) return
      transitioning.current = true
      setScene(s => Math.min(s + 1, 5))
      setTimeout(() => { transitioning.current = false }, 1000)
    }
    const onWheel = (e: WheelEvent) => { e.preventDefault(); if (e.deltaY > 20) skip() }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Enter') skip()
    }
    // Touch: swipe up only
    let touchY = 0
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY }
    const onTouchEnd = (e: TouchEvent) => {
      const dy = e.changedTouches[0].clientY - touchY
      if (dy < -40) skip()
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [scene])

  // Globe: horizontal = language, keyboard arrows
  useEffect(() => {
    if (scene < 5) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') cycleLang(-1)
      else if (e.key === 'ArrowRight') cycleLang(1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [scene, cycleLang])

  // Globe: horizontal swipe = language
  useEffect(() => {
    if (scene < 5) return
    let sx = 0
    const onStart = (e: TouchEvent) => { sx = e.touches[0].clientX }
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx
      if (Math.abs(dx) > 50) {
        if (dx < 0) cycleLang(1)
        else cycleLang(-1)
      }
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
    }
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

  // Cinematic transition: fade + slight upward drift + scale
  const sceneStyle = (idx: number): React.CSSProperties => {
    const active = scene === idx
    const passed = scene > idx
    return {
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: active ? 1 : 0,
      transform: active ? 'translateY(0) scale(1)' : passed ? 'translateY(-30px) scale(0.97)' : 'translateY(20px) scale(1.01)',
      transition: 'opacity 1000ms ease, transform 1000ms ease',
      pointerEvents: active ? 'auto' : 'none',
      zIndex: active ? 10 : 1,
    }
  }

  const moreCount = selected.moreCountries
  const tickerNames = languages.map(l => l.name)
  const tickerDuped = [...tickerNames, ...tickerNames]

  return (
    <div className="w-full h-[100dvh] overflow-hidden bg-[#050608]">
      <GrainOverlay />
      {/* Vignette */}
      <div className="fixed inset-0 pointer-events-none z-[99]"
        style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(5,6,8,0.85) 100%)' }} />

      {/* ── SCENE 0: THE HOOK ── */}
      <div style={sceneStyle(0)}>
        <div className="px-8 sm:px-12 max-w-[820px]">
          <p className="text-[22px] sm:text-[34px] md:text-[44px] font-bold text-white leading-[1.15] text-center"
            style={{ fontFamily: 'Poppins' }}>
            Music has always been the thing that brings strangers together.
          </p>
          <p className="text-[11px] sm:text-[14px] md:text-[16px] font-normal text-white/30 text-center mt-5 tracking-[0.18em] uppercase"
            style={{ fontFamily: 'Poppins' }}>
            Across borders. Across cultures. Across languages you&apos;ve never spoken.
          </p>
        </div>
        {/* Subtle continue cue */}
        <p className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.3em] text-white/15 uppercase animate-pulse"
          style={{ fontFamily: 'Poppins' }}>
          Swipe up
        </p>
      </div>

      {/* ── SCENE 1: THE FEELING ── */}
      <div style={sceneStyle(1)}>
        <div className="px-8 sm:px-12 max-w-[700px]">
          <p className="text-[15px] sm:text-[19px] md:text-[23px] font-normal text-white/50 text-center leading-[1.85]"
            style={{ fontFamily: 'Poppins' }}>
            You know that feeling — when a song takes over and you can&apos;t help but sing along. The joy, the release, the shared moment on the dancefloor when nothing else matters.
          </p>
        </div>
      </div>

      {/* ── SCENE 2: THE TRUTH ── */}
      <div style={sceneStyle(2)}>
        <div className="px-8 sm:px-12 max-w-[700px]">
          <p className="text-[15px] sm:text-[19px] md:text-[23px] font-normal text-white/40 text-center leading-[1.85]"
            style={{ fontFamily: 'Poppins' }}>
            But sometimes you don&apos;t understand the lyrics. You&apos;re singing sounds, not words. And you&apos;ve never known what you were actually singing.
          </p>
        </div>
      </div>

      {/* ── SCENE 3: THE DROP ── */}
      <div style={sceneStyle(3)}>
        <p className="text-[30px] sm:text-[48px] md:text-[68px] font-bold text-[#FF0CB6] text-center tracking-tight"
          style={{ fontFamily: 'Poppins', textShadow: '0 0 50px rgba(255,12,182,0.5), 0 0 100px rgba(255,12,182,0.2)' }}>
          Not anymore.
        </p>
      </div>

      {/* ── SCENE 4: THE REVEAL ── */}
      <div style={sceneStyle(4)}>
        <div className="px-8 sm:px-12 max-w-[740px]">
          <p className="text-[13px] sm:text-[16px] md:text-[18px] font-normal text-white/40 text-center leading-[1.9]"
            style={{ fontFamily: 'Poppins' }}>
            For the first time in history, a commercially released single is dropping in multiple languages — allowing over{' '}
            <span className="text-white font-semibold">5 billion</span>{' '}
            people around the world to sing along, and actually understand every word they&apos;re singing.
          </p>
        </div>
      </div>

      {/* ── SCENE 5: THE GLOBE ── */}
      <div style={{ ...sceneStyle(5), justifyContent: 'flex-start', alignItems: 'center' }}>
        {/* Language Grid */}
        {gridOpen && (
          <div className="fixed inset-0 z-[60] bg-[#050608]/95 backdrop-blur-xl flex flex-col">
            <header className="flex justify-between items-center px-6 py-6">
              <div className="text-lg font-extrabold tracking-tight text-[#FF0CB6]" style={{ fontFamily: 'Poppins' }}>DANCEFLOOR</div>
              <button onClick={() => setGridOpen(false)} className="material-symbols-outlined text-white/50 hover:text-[#FF0CB6] transition-colors">close</button>
            </header>
            <div className="flex-1 overflow-y-auto selection-scroll px-6 sm:px-8 py-4">
              <p className="text-[9px] tracking-[0.25em] font-semibold text-[#FF0CB6] uppercase mb-5" style={{ fontFamily: 'Poppins' }}>Select Language</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {languages.map(lang => (
                  <button key={lang.id} onClick={() => { setSelected(lang); setGridOpen(false) }}
                    className={`text-left px-3.5 py-2.5 rounded-sm border transition-all ${lang.id === selected.id ? 'border-[#FF0CB6]/40 bg-[#FF0CB6]/8 text-white' : 'border-white/8 bg-white/[0.02] text-white/45 hover:text-white hover:border-white/15'}`}>
                    <span className="text-[11px] font-bold tracking-wider uppercase">{lang.name}</span>
                    <span className="block text-[8px] tracking-widest text-white/25 mt-0.5 uppercase">{lang.speakers}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Suspended Mirror Ball Layout */}
        <div className="w-full h-full flex flex-col items-center relative" style={{ paddingTop: 'max(0.75rem, 1.5vh)' }}>

          {/* DANCEFLOOR title */}
          <h1 className="text-[8vw] sm:text-[6vw] md:text-[48px] font-extrabold tracking-tight text-[#FF0CB6] leading-none z-20 text-center uppercase"
            style={{ fontFamily: 'Poppins', textShadow: '0 0 30px rgba(255,12,182,0.3)' }}>
            DANCEFLOOR
          </h1>

          {/* Countdown */}
          {!countdown.launched && (
            <div className="mt-1 flex items-center justify-center gap-[0.35em] font-mono text-[3.5vw] sm:text-[2.5vw] md:text-[18px] font-bold text-white/20 z-20">
              <span>{pad(countdown.days)}</span>
              <span className="text-[#FF0CB6]/25">:</span>
              <span>{pad(countdown.hours)}</span>
              <span className="text-[#FF0CB6]/25">:</span>
              <span>{pad(countdown.mins)}</span>
              <span className="text-[#FF0CB6]/25">:</span>
              <span>{pad(countdown.secs)}</span>
            </div>
          )}

          {/* Suspension: hook cap + chain */}
          <div className="flex flex-col items-center z-20 flex-shrink-0">
            {/* Small hook/cap */}
            <div className="w-3 h-1.5 rounded-sm bg-white/15" />
            {/* Chain */}
            <div className="w-[1px] bg-gradient-to-b from-white/20 via-white/8 to-transparent" style={{ height: 'max(12px, 2vh)' }} />
          </div>

          {/* Background language name — cinematic film-poster feel */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
            <span className="text-[15vw] font-black leading-none tracking-tighter text-[#FF0CB6] opacity-[0.035] uppercase"
              style={{ fontFamily: 'Poppins' }}>
              {selected.name}
            </span>
          </div>

          {/* Mirror Ball — fully circular, never cropped */}
          <div className="relative z-10 flex-shrink-0" style={{ width: 'min(60vw, 52vh, 460px)', height: 'min(60vw, 52vh, 460px)' }}>
            {/* Nav arrows */}
            <button onClick={() => cycleLang(-1)}
              className="absolute -left-6 sm:-left-10 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/20 hover:text-[#FF0CB6] transition-colors z-20 text-xl select-none">
              &#8249;
            </button>
            <button onClick={() => cycleLang(1)}
              className="absolute -right-6 sm:-right-10 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/20 hover:text-[#FF0CB6] transition-colors z-20 text-xl select-none">
              &#8250;
            </button>
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#FF0CB6]/30 border-t-[#FF0CB6] rounded-full animate-spin" /></div>}>
              <Globe3D selected={selected} />
            </Suspense>
          </div>

          {/* Language Card — centered beneath globe, premium plaque */}
          <div className="w-full flex justify-center z-30 mt-3 px-4">
            <div className="w-full max-w-[360px] rounded-sm"
              style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="px-6 py-5 sm:px-7 sm:py-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[8px] tracking-[0.25em] font-semibold text-[#FF0CB6] uppercase mb-1" style={{ fontFamily: 'Poppins' }}>Active Linguistic Region</p>
                    <h3 className="text-[20px] sm:text-[26px] font-bold text-white tracking-tight uppercase leading-none" style={{ fontFamily: 'Poppins' }}>{selected.name}</h3>
                  </div>
                  <button onClick={() => setGridOpen(true)}
                    className="w-7 h-7 flex items-center justify-center rounded-sm bg-white/[0.04] border border-white/[0.06] hover:border-[#FF0CB6]/25 transition-colors cursor-pointer mt-1">
                    <span className="material-symbols-outlined text-[#FF0CB6] text-sm">language</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-5 gap-y-2 mb-4 border-t border-white/[0.04] pt-4">
                  <div>
                    <p className="text-[7px] tracking-[0.2em] font-semibold text-white/18 mb-0.5 uppercase">Speakers</p>
                    <p className="text-[11px] font-semibold text-white/75" style={{ fontFamily: 'Poppins' }}>{selected.speakers}</p>
                  </div>
                  <div>
                    <p className="text-[7px] tracking-[0.2em] font-semibold text-white/18 mb-0.5 uppercase">Rank</p>
                    <p className="text-[11px] font-semibold text-white/75" style={{ fontFamily: 'Poppins' }}>{selected.globalRank}</p>
                  </div>
                </div>
                <div className="border-t border-white/[0.04] pt-3 mb-4">
                  <p className="text-[7px] tracking-[0.2em] font-semibold text-white/18 mb-2 uppercase">Regions</p>
                  <div className="grid grid-cols-3 gap-y-1 gap-x-1">
                    {selected.countries.slice(0, 6).map(c => (
                      <div key={c} className="text-[8px] font-semibold text-white/55 uppercase truncate">{c}</div>
                    ))}
                  </div>
                  {moreCount > 0 && <p className="text-[8px] text-white/18 mt-1 uppercase">+{moreCount} more</p>}
                </div>
                {countdown.launched ? (
                  <button onClick={handlePlay}
                    className="w-full bg-[#FF0CB6] text-white py-2.5 rounded-sm font-semibold text-[9px] tracking-[0.15em] uppercase hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(255,12,182,0.2)]">
                    {playing ? 'PAUSE' : 'LISTEN NOW'}
                    <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>{playing ? 'pause' : 'play_arrow'}</span>
                  </button>
                ) : (
                  <div className="w-full bg-white/[0.015] border border-white/[0.04] text-white/25 py-2.5 rounded-sm font-bold text-[8px] tracking-[0.12em] uppercase flex items-center justify-center gap-2 cursor-not-allowed">
                    <span className="material-symbols-outlined text-xs text-white/20" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                    <span style={{ fontFamily: 'Poppins' }}>Unlocks on release</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ticker */}
        <div className="fixed bottom-0 left-0 right-0 h-7 bg-[#050608]/30 backdrop-blur-sm border-t border-white/[0.03] overflow-hidden z-40 flex items-center">
          <div className="flex items-center gap-10 whitespace-nowrap ticker-marquee">
            {tickerDuped.map((name, i) => (
              <span key={`${name}-${i}`}
                className={`text-[8px] tracking-[0.12em] uppercase ${name === selected.name ? 'text-[#FF0CB6]/40' : 'text-white/8'}`}
                style={{ fontFamily: 'Poppins' }}>
                {name}
              </span>
            ))}
          </div>
        </div>

        <footer className="fixed bottom-7 left-0 right-0 px-5 py-1 pointer-events-none hidden md:block z-30">
          <div className="flex justify-between items-center text-[7px] font-medium text-white/10 uppercase">
            <div className="pointer-events-auto">&copy; 2026 HOTTR RECORDS</div>
            <div className="flex gap-4 pointer-events-auto">
              <a className="hover:text-white/25 transition-colors" href="https://instagram.com/hottr" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a className="hover:text-white/25 transition-colors" href="https://tiktok.com/@hottr" target="_blank" rel="noopener noreferrer">TikTok</a>
              <a className="hover:text-white/25 transition-colors" href="https://x.com/hottr" target="_blank" rel="noopener noreferrer">X</a>
              <a className="hover:text-white/25 transition-colors" href="mailto:press@hottr.world">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
