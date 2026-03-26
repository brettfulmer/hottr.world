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

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf: number
    const particles: { x: number; y: number; vx: number; vy: number; o: number }[] = []
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        o: 0.15 + Math.random() * 0.2,
      })
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 12, 182, ${p.o})`; ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
}

export default function DancefloorPage() {
  const [showGlobe, setShowGlobe] = useState(false)
  const [selected, setSelected] = useState<Language>(languages[0]) // Start on Afrikaans
  const [playing, setPlaying] = useState(false)
  const [gridOpen, setGridOpen] = useState(false)
  const [linesVisible, setLinesVisible] = useState([false, false, false, false, false])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const editorialRef = useRef<HTMLDivElement>(null)

  const countdown = useCountdown()

  const cycleLang = useCallback((dir: number) => {
    const idx = languages.findIndex(l => l.id === selected.id)
    const next = (idx + dir + languages.length) % languages.length
    setSelected(languages[next])
  }, [selected])

  // Stagger editorial lines on mount
  useEffect(() => {
    const delays = [300, 1200, 2100, 3000, 3800]
    delays.forEach((d, i) => {
      setTimeout(() => setLinesVisible(prev => { const n = [...prev]; n[i] = true; return n }), d)
    })
  }, [])

  // Scroll detection — when user scrolls past editorial, show globe
  useEffect(() => {
    const handler = () => {
      if (!editorialRef.current) return
      const rect = editorialRef.current.getBoundingClientRect()
      if (rect.bottom < window.innerHeight * 0.3) {
        setShowGlobe(true)
      }
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Keyboard: arrows cycle languages when on globe
  useEffect(() => {
    if (!showGlobe) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') cycleLang(-1)
      else if (e.key === 'ArrowRight') cycleLang(1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showGlobe, cycleLang])

  // Audio
  useEffect(() => {
    const existing = document.getElementById('dancefloor-audio') as HTMLAudioElement | null
    if (existing) { audioRef.current = existing; setPlaying(!existing.paused) }
  }, [])

  const handlePlay = () => {
    if (!countdown.launched) return // Locked until launch
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

  const moreCount = selected.moreCountries

  // Language names for marquee ticker (duplicated for seamless loop)
  const tickerNames = languages.map(l => l.name)
  const tickerDuped = [...tickerNames, ...tickerNames]

  const lineStyle = (idx: number): React.CSSProperties => ({
    opacity: linesVisible[idx] ? 1 : 0,
    transform: linesVisible[idx] ? 'translateY(0)' : 'translateY(14px)',
    transition: 'opacity 0.8s ease, transform 0.8s ease',
  })

  return (
    <div className="w-full min-h-screen bg-[#050608]">
      {/* ====== EDITORIAL SECTION ====== */}
      <div ref={editorialRef} className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <ParticleCanvas />
        <div className="relative z-10 flex flex-col items-center gap-7 max-w-[720px]">
          <p className="text-[17px] md:text-[22px] font-normal text-white/80 text-center leading-[1.8]"
            style={{ fontFamily: 'Poppins', ...lineStyle(0) }}>
            Music has always been the thing that brings strangers together. Across borders, across cultures, across languages you&apos;ve never spoken.
          </p>
          <p className="text-[16px] md:text-[20px] font-normal text-white/60 text-center leading-[1.8]"
            style={{ fontFamily: 'Poppins', ...lineStyle(1) }}>
            You know that feeling — when a song takes over and you can&apos;t help but sing along. The joy, the release, the shared moment on the dancefloor when nothing else matters.
          </p>
          <p className="text-[16px] md:text-[20px] font-normal text-white/60 text-center leading-[1.8]"
            style={{ fontFamily: 'Poppins', ...lineStyle(2) }}>
            But sometimes you don&apos;t understand the lyrics. You&apos;re singing sounds, not words. And you&apos;ve never known what you were actually singing.
          </p>
          <p className="text-[22px] md:text-[30px] font-bold text-[#FF0CB6] text-center mt-4"
            style={{ fontFamily: 'Poppins', ...lineStyle(3), textShadow: '0 0 24px rgba(255,12,182,0.5)' }}>
            Not anymore.
          </p>
          <p className="text-[14px] md:text-[17px] font-normal text-white/50 text-center leading-[1.8] mt-4"
            style={{ fontFamily: 'Poppins', ...lineStyle(4) }}>
            For the first time in history, a commercially released single is dropping in multiple languages — allowing over 5 billion people around the world to sing along, and actually understand every word they&apos;re singing.
          </p>
        </div>
        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/15 animate-bounce text-2xl z-10">&#8595;</div>
      </div>

      {/* ====== GLOBE SECTION ====== */}
      <div className={`fixed inset-0 bg-[#050608] transition-opacity duration-700 ${showGlobe ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} style={{ zIndex: 40 }}>
        {/* DANCEFLOOR wordmark */}
        <header className="fixed top-0 w-full z-50 flex items-center px-6 py-6">
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

        {/* Globe + UI */}
        <div className="w-full h-full flex items-center justify-center relative">
          {/* Background Typography */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
            <h1 className="text-[20vw] font-black leading-none tracking-tighter text-[#FF0CB6] opacity-[0.06] uppercase">{selected.name}</h1>
          </div>

          {/* Globe Container */}
          <div className="relative w-[85vw] max-w-[650px] aspect-square z-10">
            {/* Left Arrow */}
            <button onClick={() => cycleLang(-1)}
              className="absolute left-1 md:-left-14 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/40 hover:text-[#FF0CB6] transition-all duration-200 z-20 text-xl select-none"
              style={{ fontFamily: 'Poppins', fontWeight: 300, pointerEvents: 'auto' }}>
              &#8249;
            </button>
            {/* Right Arrow */}
            <button onClick={() => cycleLang(1)}
              className="absolute right-1 md:-right-14 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/40 hover:text-[#FF0CB6] transition-all duration-200 z-20 text-xl select-none"
              style={{ fontFamily: 'Poppins', fontWeight: 300, pointerEvents: 'auto' }}>
              &#8250;
            </button>

            {/* Three.js Globe */}
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#FF0CB6]/30 border-t-[#FF0CB6] rounded-full animate-spin" /></div>}>
              <Globe3D selected={selected} />
            </Suspense>
          </div>
        </div>

        {/* Language Info Card — glassmorphism */}
        <aside className="fixed md:left-10 bottom-16 left-4 right-4 md:right-auto md:w-[420px] rounded-sm z-30"
          style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.08)', pointerEvents: 'auto' }}>
          <div className="p-10 md:p-12">
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-3">
                <p className="text-[10px] tracking-[0.2em] font-semibold text-[#FF0CB6] uppercase" style={{ fontFamily: 'Poppins' }}>Active Linguistic Region</p>
                <h3 className="text-[26px] md:text-[34px] font-bold text-white tracking-tight uppercase leading-none" style={{ fontFamily: 'Poppins' }}>{selected.name}</h3>
              </div>
              <button onClick={() => setGridOpen(true)} style={{ pointerEvents: 'auto' }}
                className="w-10 h-10 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 hover:border-[#FF0CB6]/30 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[#FF0CB6] text-xl">language</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-10 gap-y-5 mb-8 border-t border-white/[0.06] pt-8">
              <div>
                <p className="text-[9px] tracking-[0.2em] font-semibold text-white/30 mb-2 uppercase">Native Speakers</p>
                <p className="text-[14px] font-semibold text-white" style={{ fontFamily: 'Poppins' }}>{selected.speakers}</p>
              </div>
              <div>
                <p className="text-[9px] tracking-[0.2em] font-semibold text-white/30 mb-2 uppercase">Global Rank</p>
                <p className="text-[14px] font-semibold text-white" style={{ fontFamily: 'Poppins' }}>{selected.globalRank}</p>
              </div>
            </div>

            <div className="border-t border-white/[0.06] pt-6 mb-8">
              <p className="text-[9px] tracking-[0.2em] font-semibold text-white/30 mb-4 uppercase">Primary Regions / Nations</p>
              <div className="grid grid-cols-3 gap-y-3 gap-x-2">
                {selected.countries.slice(0, 9).map(c => (
                  <div key={c} className="text-[11px] font-semibold text-white uppercase">{c}</div>
                ))}
              </div>
              {moreCount > 0 && <p className="text-[11px] text-white/30 mt-3 uppercase">+{moreCount} more</p>}
            </div>

            {/* Listen button — locked until launch */}
            {countdown.launched ? (
              <button onClick={handlePlay} style={{ pointerEvents: 'auto' }}
                className="w-full bg-[#FF0CB6] text-white py-4 rounded-sm font-semibold text-[12px] tracking-[0.15em] uppercase hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_0_24px_rgba(255,12,182,0.4)]">
                {playing ? 'PAUSE' : 'LISTEN NOW'}
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{playing ? 'pause' : 'play_arrow'}</span>
              </button>
            ) : (
              <div className="w-full bg-white/[0.04] border border-white/[0.08] text-white/40 py-4 rounded-sm font-semibold text-[11px] tracking-[0.15em] uppercase flex items-center justify-center gap-4 cursor-not-allowed">
                <span style={{ fontFamily: 'Poppins' }}>APRIL 17, 2026</span>
                <span className="font-mono text-[12px] text-white/50">
                  {pad(countdown.days)}:{pad(countdown.hours)}:{pad(countdown.mins)}:{pad(countdown.secs)}
                </span>
              </div>
            )}
          </div>
        </aside>

        {/* Passive auto-scrolling ticker */}
        <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#050608]/60 backdrop-blur-md border-t border-white/[0.06] overflow-hidden z-40 flex items-center">
          <div className="flex items-center gap-12 whitespace-nowrap ticker-marquee">
            {tickerDuped.map((name, i) => (
              <span key={`${name}-${i}`}
                className={`text-[11px] tracking-[0.15em] uppercase ${name === selected.name ? 'text-[#FF0CB6]' : 'text-white/20'}`}
                style={{ fontFamily: 'Poppins' }}>
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="fixed bottom-10 left-0 right-0 px-8 py-2 pointer-events-none hidden md:block z-30">
          <div className="flex justify-between items-center text-[10px] font-medium text-white/20 uppercase">
            <div className="pointer-events-auto">&copy; 2026 HOTTR RECORDS</div>
            <div className="pointer-events-auto text-white/15">press@hottr.world</div>
            <div className="flex gap-6 pointer-events-auto">
              <a className="hover:text-white/50 transition-colors" href="https://instagram.com/hottr" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a className="hover:text-white/50 transition-colors" href="https://tiktok.com/@hottr" target="_blank" rel="noopener noreferrer">TikTok</a>
              <a className="hover:text-white/50 transition-colors" href="https://x.com/hottr" target="_blank" rel="noopener noreferrer">X</a>
              <a className="hover:text-white/50 transition-colors" href="mailto:press@hottr.world">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
