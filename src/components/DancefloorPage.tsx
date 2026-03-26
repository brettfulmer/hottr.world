import { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react'
import { languages } from '../data/languages'
import type { Language } from '../data/languages'

const Globe3D = lazy(() => import('./Globe3D'))

const TRACK_URL = 'https://ykjntvewdxdgbmzmvmwa.supabase.co/storage/v1/object/public/records/Dancefloor.mp3'
const LAUNCH_DATE = new Date('2026-04-17T00:00:00Z')

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

// Film grain overlay for cinematic texture
function GrainOverlay() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number
    const draw = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      const imageData = ctx.createImageData(canvas.width, canvas.height)
      const d = imageData.data
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 20
        d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 12
      }
      ctx.putImageData(imageData, 0, 0)
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-[100] mix-blend-overlay" />
}

export default function DancefloorPage() {
  const [scene, setScene] = useState(0) // 0-4 editorial scenes, 5 = globe
  const [selected, setSelected] = useState<Language>(languages[0])
  const [playing, setPlaying] = useState(false)
  const [gridOpen, setGridOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const transitioning = useRef(false)
  const touchStart = useRef<{ y: number } | null>(null)

  const countdown = useCountdown()

  const cycleLang = useCallback((dir: number) => {
    const idx = languages.findIndex(l => l.id === selected.id)
    const next = (idx + dir + languages.length) % languages.length
    setSelected(languages[next])
  }, [selected])

  // Scene transition
  const goNext = useCallback(() => {
    if (transitioning.current || scene >= 5) return
    transitioning.current = true
    setScene(s => s + 1)
    setTimeout(() => { transitioning.current = false }, 900)
  }, [scene])

  // Wheel/scroll handler for editorial scenes
  useEffect(() => {
    if (scene >= 5) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      if (e.deltaY > 20) goNext()
    }
    window.addEventListener('wheel', handler, { passive: false })
    return () => window.removeEventListener('wheel', handler)
  }, [scene, goNext])

  // Touch handlers
  useEffect(() => {
    if (scene >= 5) return
    const onStart = (e: TouchEvent) => { touchStart.current = { y: e.touches[0].clientY } }
    const onEnd = (e: TouchEvent) => {
      if (!touchStart.current) return
      const dy = e.changedTouches[0].clientY - touchStart.current.y
      touchStart.current = null
      if (dy < -40) goNext()
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd) }
  }, [scene, goNext])

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (scene < 5) {
        if (e.key === 'ArrowDown' || e.key === ' ') goNext()
      } else {
        if (e.key === 'ArrowLeft') cycleLang(-1)
        else if (e.key === 'ArrowRight') cycleLang(1)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [scene, goNext, cycleLang])

  // Audio
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
        el.id = 'dancefloor-audio'
        el.src = TRACK_URL
        el.preload = 'none'
        document.body.appendChild(el)
        audio = el
      }
      audioRef.current = audio
    }
    if (audio.paused) { audio.play(); setPlaying(true) }
    else { audio.pause(); setPlaying(false) }
  }

  // Scene styling: each editorial beat is a full viewport
  const sceneStyle = (idx: number): React.CSSProperties => ({
    position: 'fixed', inset: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    opacity: scene === idx ? 1 : 0,
    transform: scene === idx ? 'scale(1)' : (scene > idx ? 'scale(0.96)' : 'scale(1.02)'),
    transition: 'opacity 800ms ease, transform 800ms ease',
    pointerEvents: scene === idx ? 'auto' : 'none',
    zIndex: scene === idx ? 10 : 1,
  })

  const moreCount = selected.moreCountries
  const tickerNames = languages.map(l => l.name)
  const tickerDuped = [...tickerNames, ...tickerNames]

  return (
    <div className="w-full h-screen overflow-hidden bg-[#050608]">
      <GrainOverlay />

      {/* Vignette overlay */}
      <div className="fixed inset-0 pointer-events-none z-[99]"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(5,6,8,0.7) 100%)' }} />

      {/* ====== SCENE 0: THE HOOK ====== */}
      <div style={sceneStyle(0)}>
        <div className="px-8 max-w-[900px]">
          <p className="text-[28px] md:text-[48px] font-bold text-white leading-[1.2] text-center"
            style={{ fontFamily: 'Poppins' }}>
            Music has always been the thing that brings strangers together.
          </p>
          <p className="text-[14px] md:text-[18px] font-normal text-white/40 text-center mt-6 tracking-wide uppercase"
            style={{ fontFamily: 'Poppins' }}>
            Across borders. Across cultures. Across languages you&apos;ve never spoken.
          </p>
        </div>
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/20 animate-bounce text-lg">&#8595;</div>
      </div>

      {/* ====== SCENE 1: THE FEELING ====== */}
      <div style={sceneStyle(1)}>
        <div className="px-8 max-w-[750px]">
          <p className="text-[18px] md:text-[24px] font-normal text-white/60 text-center leading-[1.8]"
            style={{ fontFamily: 'Poppins' }}>
            You know that feeling — when a song takes over and you can&apos;t help but sing along. The joy, the release, the shared moment on the dancefloor when nothing else matters.
          </p>
        </div>
      </div>

      {/* ====== SCENE 2: THE TRUTH ====== */}
      <div style={sceneStyle(2)}>
        <div className="px-8 max-w-[750px]">
          <p className="text-[18px] md:text-[24px] font-normal text-white/50 text-center leading-[1.8]"
            style={{ fontFamily: 'Poppins' }}>
            But sometimes you don&apos;t understand the lyrics. You&apos;re singing sounds, not words. And you&apos;ve never known what you were actually singing.
          </p>
        </div>
      </div>

      {/* ====== SCENE 3: THE DROP ====== */}
      <div style={sceneStyle(3)}>
        <p className="text-[36px] md:text-[72px] font-bold text-[#FF0CB6] text-center tracking-tight"
          style={{ fontFamily: 'Poppins', textShadow: '0 0 40px rgba(255,12,182,0.6), 0 0 80px rgba(255,12,182,0.3)' }}>
          Not anymore.
        </p>
      </div>

      {/* ====== SCENE 4: THE REVEAL ====== */}
      <div style={sceneStyle(4)}>
        <div className="px-8 max-w-[800px]">
          <p className="text-[15px] md:text-[19px] font-normal text-white/50 text-center leading-[1.9]"
            style={{ fontFamily: 'Poppins' }}>
            For the first time in history, a commercially released single is dropping in multiple languages — allowing over <span className="text-white font-semibold">5 billion</span> people around the world to sing along, and actually understand every word they&apos;re singing.
          </p>
        </div>
      </div>

      {/* ====== SCENE 5: THE GLOBE ====== */}
      <div style={{
        ...sceneStyle(5),
        justifyContent: 'flex-start',
        alignItems: 'stretch',
      }}>
        {/* DANCEFLOOR wordmark */}
        <header className="fixed top-0 w-full z-50 flex items-center px-6 py-5">
          <div className="text-xl font-extrabold tracking-[-0.04em] text-[#FF0CB6]" style={{ fontFamily: 'Poppins' }}>DANCEFLOOR</div>
        </header>

        {/* Language Grid Overlay */}
        {gridOpen && (
          <div className="fixed inset-0 z-[60] bg-[#050608]/95 backdrop-blur-xl flex flex-col">
            <header className="flex justify-between items-center px-6 py-6">
              <div className="text-xl font-extrabold tracking-[-0.04em] text-[#FF0CB6]" style={{ fontFamily: 'Poppins' }}>DANCEFLOOR</div>
              <button onClick={() => setGridOpen(false)} className="material-symbols-outlined text-white/60 hover:text-[#FF0CB6] transition-all duration-300">close</button>
            </header>
            <div className="flex-1 overflow-y-auto selection-scroll px-8 py-4">
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

        {/* Globe */}
        <div className="w-full h-full flex items-center justify-center relative">
          {/* Background Typography */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
            <h1 className="text-[18vw] font-black leading-none tracking-tighter text-[#FF0CB6] opacity-[0.05] uppercase">{selected.name}</h1>
          </div>

          {/* Globe Container */}
          <div className="relative w-[80vw] max-w-[620px] aspect-square z-10">
            <button onClick={() => cycleLang(-1)}
              className="absolute left-0 md:-left-14 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/30 hover:text-[#FF0CB6] transition-all duration-200 z-20 text-xl select-none"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
              &#8249;
            </button>
            <button onClick={() => cycleLang(1)}
              className="absolute right-0 md:-right-14 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/30 hover:text-[#FF0CB6] transition-all duration-200 z-20 text-xl select-none"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
              &#8250;
            </button>

            <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#FF0CB6]/30 border-t-[#FF0CB6] rounded-full animate-spin" /></div>}>
              <Globe3D selected={selected} />
            </Suspense>
          </div>
        </div>

        {/* Language Info Card — glassmorphism */}
        <aside className="fixed md:left-10 bottom-14 left-4 right-4 md:right-auto md:w-[400px] rounded-sm z-30"
          style={{ background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="p-8 md:p-10">
            <div className="flex justify-between items-start mb-7">
              <div className="space-y-2">
                <p className="text-[10px] tracking-[0.25em] font-semibold text-[#FF0CB6] uppercase" style={{ fontFamily: 'Poppins' }}>Active Linguistic Region</p>
                <h3 className="text-[24px] md:text-[30px] font-bold text-white tracking-tight uppercase leading-none" style={{ fontFamily: 'Poppins' }}>{selected.name}</h3>
              </div>
              <button onClick={() => setGridOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 hover:border-[#FF0CB6]/30 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[#FF0CB6] text-lg">language</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-7 border-t border-white/[0.06] pt-7">
              <div>
                <p className="text-[9px] tracking-[0.2em] font-semibold text-white/25 mb-2 uppercase">Native Speakers</p>
                <p className="text-[13px] font-semibold text-white/90" style={{ fontFamily: 'Poppins' }}>{selected.speakers}</p>
              </div>
              <div>
                <p className="text-[9px] tracking-[0.2em] font-semibold text-white/25 mb-2 uppercase">Global Rank</p>
                <p className="text-[13px] font-semibold text-white/90" style={{ fontFamily: 'Poppins' }}>{selected.globalRank}</p>
              </div>
            </div>

            <div className="border-t border-white/[0.06] pt-5 mb-7">
              <p className="text-[9px] tracking-[0.2em] font-semibold text-white/25 mb-3 uppercase">Primary Regions / Nations</p>
              <div className="grid grid-cols-3 gap-y-2 gap-x-2">
                {selected.countries.slice(0, 9).map(c => (
                  <div key={c} className="text-[10px] font-semibold text-white/70 uppercase">{c}</div>
                ))}
              </div>
              {moreCount > 0 && <p className="text-[10px] text-white/25 mt-2 uppercase">+{moreCount} more</p>}
            </div>

            {countdown.launched ? (
              <button onClick={handlePlay}
                className="w-full bg-[#FF0CB6] text-white py-3.5 rounded-sm font-semibold text-[11px] tracking-[0.15em] uppercase hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,12,182,0.3)]">
                {playing ? 'PAUSE' : 'LISTEN NOW'}
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{playing ? 'pause' : 'play_arrow'}</span>
              </button>
            ) : (
              <div className="w-full bg-white/[0.03] border border-white/[0.06] text-white/35 py-3.5 rounded-sm font-semibold text-[10px] tracking-[0.12em] uppercase flex items-center justify-center gap-3 cursor-not-allowed">
                <span style={{ fontFamily: 'Poppins' }}>APRIL 17, 2026</span>
                <span className="font-mono text-[11px] text-white/45 countdown-colon">
                  {pad(countdown.days)}:{pad(countdown.hours)}:{pad(countdown.mins)}:{pad(countdown.secs)}
                </span>
              </div>
            )}
          </div>
        </aside>

        {/* Passive ticker marquee */}
        <div className="fixed bottom-0 left-0 right-0 h-9 bg-[#050608]/50 backdrop-blur-sm border-t border-white/[0.04] overflow-hidden z-40 flex items-center">
          <div className="flex items-center gap-12 whitespace-nowrap ticker-marquee">
            {tickerDuped.map((name, i) => (
              <span key={`${name}-${i}`}
                className={`text-[10px] tracking-[0.15em] uppercase ${name === selected.name ? 'text-[#FF0CB6]/60' : 'text-white/15'}`}
                style={{ fontFamily: 'Poppins' }}>
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="fixed bottom-9 left-0 right-0 px-8 py-2 pointer-events-none hidden md:block z-30">
          <div className="flex justify-between items-center text-[9px] font-medium text-white/15 uppercase">
            <div className="pointer-events-auto">&copy; 2026 HOTTR RECORDS</div>
            <div className="pointer-events-auto text-white/10">press@hottr.world</div>
            <div className="flex gap-6 pointer-events-auto">
              <a className="hover:text-white/40 transition-colors" href="https://instagram.com/hottr" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a className="hover:text-white/40 transition-colors" href="https://tiktok.com/@hottr" target="_blank" rel="noopener noreferrer">TikTok</a>
              <a className="hover:text-white/40 transition-colors" href="https://x.com/hottr" target="_blank" rel="noopener noreferrer">X</a>
              <a className="hover:text-white/40 transition-colors" href="mailto:press@hottr.world">Contact</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Scene progress dots (editorial only) */}
      {scene < 5 && (
        <div className="fixed right-5 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2.5">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${scene === i ? 'bg-[#FF0CB6] shadow-[0_0_6px_rgba(255,12,182,0.6)]' : scene > i ? 'bg-white/15' : 'bg-white/8'}`} />
          ))}
        </div>
      )}
    </div>
  )
}
