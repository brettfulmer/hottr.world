import { useState, useRef, useEffect, useCallback } from 'react'
import { languages } from '../data/languages'
import type { Language } from '../data/languages'

const TRACK_URL = 'https://ykjntvewdxdgbmzmvmwa.supabase.co/storage/v1/object/public/records/Dancefloor.mp3'
const GLOBE_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoY4QNlU1j_j87-dhBhteovBKpMknAiQCtPbodMtRnpcSb5pFqHikGdZ0edVst-pFolhnDhXzrS0vlr66K7ptRXDZNop2staUW4JLa5rnmqqFwkd_QTBHB5vAMBSsVZpVIMMnnxr_rhhRv3AoEbWiAO5B1Cmh6rzfuSPlOyR7qhFu6JjaTcci4c4WmLxzCbd4A8DMT4qB8eYutamtKAaFuLHiClpZYuFXVjp9IquOZJ52AEJCUK2XBShToRyTQFcrlB-6ErK_u51rW'

const LAUNCH_DATE = new Date('2026-03-30T00:00:00Z')
const TOTAL_SECTIONS = 4

function useCountdown() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, LAUNCH_DATE.getTime() - now.getTime())
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  return { days, hours, mins, secs, launched: diff === 0 }
}

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
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        o: 0.15 + Math.random() * 0.2,
      })
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 12, 182, ${p.o})`
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
}

function pad(n: number) { return String(n).padStart(2, '0') }

export default function DancefloorPage() {
  const [section, setSection] = useState(0)
  const [selected, setSelected] = useState<Language>(languages.find(l => l.name === 'French')!)
  const [playing, setPlaying] = useState(false)
  const [gridOpen, setGridOpen] = useState(false)
  const [countStarted, setCountStarted] = useState(false)
  const [countValue, setCountValue] = useState(0)
  const [statLine1, setStatLine1] = useState(false)
  const [statLine2, setStatLine2] = useState(false)
  const [quoteLine1, setQuoteLine1] = useState(false)
  const [quoteLine2, setQuoteLine2] = useState(false)
  const [quoteLine3, setQuoteLine3] = useState(false)
  const [dotsVisible, setDotsVisible] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const tickerRef = useRef<HTMLDivElement>(null)
  const transitioning = useRef(false)
  const dotsTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const countdown = useCountdown()

  // Cinematic section navigation
  const goToSection = useCallback((next: number) => {
    if (transitioning.current || next < 0 || next >= TOTAL_SECTIONS) return
    transitioning.current = true
    setSection(next)
    setTimeout(() => { transitioning.current = false }, 800)
  }, [])

  // Section 2: count-up trigger
  useEffect(() => {
    if (section === 1 && !countStarted) {
      setCountStarted(true)
      let v = 0
      const step = () => {
        v += 0.1
        if (v >= 4.5) {
          setCountValue(4.5)
          setTimeout(() => setStatLine1(true), 500)
          setTimeout(() => setStatLine2(true), 800)
          return
        }
        setCountValue(Math.round(v * 10) / 10)
        const delay = 30 + (v / 4.5) * 40
        setTimeout(step, delay)
      }
      setTimeout(step, 300)
    }
  }, [section, countStarted])

  // Section 3: stagger lines
  useEffect(() => {
    if (section === 2) {
      setQuoteLine1(false); setQuoteLine2(false); setQuoteLine3(false)
      setTimeout(() => setQuoteLine1(true), 200)
      setTimeout(() => setQuoteLine2(true), 600)
      setTimeout(() => setQuoteLine3(true), 900)
    }
  }, [section])

  // Dots indicator auto-hide
  useEffect(() => {
    if (section < 3) {
      setDotsVisible(true)
      clearTimeout(dotsTimer.current)
      dotsTimer.current = setTimeout(() => setDotsVisible(false), 3000)
    }
    return () => clearTimeout(dotsTimer.current)
  }, [section])

  // Wheel handler for cinematic sections
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if (section >= 3) return
      e.preventDefault()
      if (e.deltaY > 30) goToSection(section + 1)
      else if (e.deltaY < -30) goToSection(section - 1)
    }
    window.addEventListener('wheel', handler, { passive: false })
    return () => window.removeEventListener('wheel', handler)
  }, [section, goToSection])

  // Keyboard: arrows for cinematic + language cycling
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (section < 3) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') goToSection(section + 1)
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') goToSection(section - 1)
      } else {
        if (e.key === 'ArrowLeft') cycleLang(-1)
        else if (e.key === 'ArrowRight') cycleLang(1)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [section, selected, goToSection])

  // Touch handlers
  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    const onEnd = (e: TouchEvent) => {
      if (!touchStart.current) return
      const dx = e.changedTouches[0].clientX - touchStart.current.x
      const dy = e.changedTouches[0].clientY - touchStart.current.y
      touchStart.current = null
      if (section < 3) {
        if (Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx)) {
          if (dy < 0) goToSection(section + 1)
          else goToSection(section - 1)
        }
      } else {
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) cycleLang(1)
          else cycleLang(-1)
        }
      }
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd) }
  }, [section, selected, goToSection])

  const cycleLang = useCallback((dir: number) => {
    const idx = languages.findIndex(l => l.id === selected.id)
    const next = (idx + dir + languages.length) % languages.length
    setSelected(languages[next])
  }, [selected])

  // Scroll active language into view in ticker
  useEffect(() => {
    if (!tickerRef.current) return
    const active = tickerRef.current.querySelector('[data-active="true"]') as HTMLElement | null
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [selected])

  // Audio setup
  useEffect(() => {
    const existing = document.getElementById('dancefloor-audio') as HTMLAudioElement | null
    if (existing) {
      audioRef.current = existing
      setPlaying(!existing.paused)
    }
  }, [])

  const handlePlay = () => {
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
      audioRef.current = audio
    }
    if (audio.paused) {
      audio.play()
      setPlaying(true)
    } else {
      audio.pause()
      setPlaying(false)
    }
  }

  const sectionStyle = (idx: number): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: section === idx ? 1 : 0,
    transform: section === idx ? 'scale(1) translateY(0)' : (section > idx ? 'scale(0.98) translateY(-20px)' : 'scale(0.98) translateY(20px)'),
    transition: 'opacity 600ms cubic-bezier(0.4,0,0.2,1), transform 600ms cubic-bezier(0.4,0,0.2,1)',
    pointerEvents: section === idx ? 'auto' : 'none',
  })

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#050608]">
      {/* ====== SECTION 1: COUNTDOWN ====== */}
      <div style={sectionStyle(0)}>
        <ParticleCanvas />
        <div className="relative z-10 flex flex-col items-center gap-6 px-6">
          {countdown.launched ? (
            <>
              <p className="text-[12px] font-semibold text-[#FF0CB6] uppercase tracking-[0.25em]" style={{ fontFamily: 'Poppins' }}>
                Out Now
              </p>
              <h1 className="text-[48px] md:text-[80px] font-bold text-white leading-none" style={{ fontFamily: 'Poppins' }}>
                DANCEFLOOR
              </h1>
              <p className="text-[14px] font-normal text-white/50 uppercase tracking-[0.2em]" style={{ fontFamily: 'Poppins' }}>
                by HOTTR
              </p>
              <button
                onClick={() => { handlePlay(); goToSection(3) }}
                className="mt-4 bg-[#FF0CB6] text-white rounded-sm px-8 py-4 text-[13px] uppercase tracking-[0.15em] font-semibold shadow-[0_0_24px_rgba(255,12,182,0.6)] animate-[pulse_3s_ease-in-out_infinite]"
                style={{ fontFamily: 'Poppins' }}
              >
                Listen Now
              </button>
            </>
          ) : (
            <>
              <p className="text-[12px] font-semibold text-white/40 uppercase tracking-[0.25em]" style={{ fontFamily: 'Poppins' }}>
                Something is Coming
              </p>
              <div className="flex items-start gap-2 md:gap-4">
                {[
                  { val: countdown.days, label: 'DAYS' },
                  { val: countdown.hours, label: 'HOURS' },
                  { val: countdown.mins, label: 'MINS' },
                  { val: countdown.secs, label: 'SECS' },
                ].map((unit, i) => (
                  <div key={unit.label} className="flex items-start">
                    <div className="flex flex-col items-center">
                      <span className="font-mono text-[36px] md:text-[64px] text-white leading-none">
                        {pad(unit.val)}
                      </span>
                      <span className="text-white/25 text-[9px] uppercase tracking-[0.2em] font-mono mt-2">
                        {unit.label}
                      </span>
                    </div>
                    {i < 3 && (
                      <span
                        className="font-mono text-[36px] md:text-[64px] leading-none mx-1 md:mx-3"
                        style={{ animation: 'colon-pulse 3s ease-in-out infinite' }}
                      >
                        :
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[14px] font-normal text-white/30 mt-6" style={{ fontFamily: 'Poppins' }}>
                MARCH 30, 2026
              </p>
            </>
          )}
        </div>
        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/15 animate-bounce text-2xl">
          &#8595;
        </div>
      </div>

      {/* ====== SECTION 2: THE NUMBER ====== */}
      <div style={sectionStyle(1)}>
        <div className="flex flex-col items-center gap-6 px-6">
          <span
            className="font-mono text-[100px] md:text-[200px] text-white leading-none"
            style={{ textShadow: '0 0 40px rgba(255,12,182,0.6), 0 0 80px rgba(255,12,182,0.3)' }}
          >
            {countValue.toFixed(1)}B
          </span>
          <p
            className="text-[14px] md:text-[18px] font-semibold text-white uppercase tracking-[0.12em] text-center transition-opacity duration-500"
            style={{ fontFamily: 'Poppins', opacity: statLine1 ? 1 : 0 }}
          >
            People will hear a song in their own language
          </p>
          <p
            className="text-[12px] md:text-[14px] font-semibold text-[#FF0CB6] uppercase tracking-[0.2em] text-center transition-opacity duration-300"
            style={{ fontFamily: 'Poppins', opacity: statLine2 ? 1 : 0, textShadow: '0 0 16px rgba(255,12,182,0.4)' }}
          >
            For the first time in music history
          </p>
        </div>
      </div>

      {/* ====== SECTION 3: THE STATEMENT ====== */}
      <div style={sectionStyle(2)}>
        <div className="flex flex-col items-center gap-6 px-6 max-w-[800px]">
          <p
            className="text-[22px] md:text-[32px] font-semibold text-white text-center leading-snug transition-all duration-500"
            style={{ fontFamily: 'Poppins', opacity: quoteLine1 ? 1 : 0, transform: quoteLine1 ? 'translateY(0)' : 'translateY(10px)' }}
          >
            The dancefloor doesn&apos;t care what language you speak.
          </p>
          <p
            className="text-[16px] md:text-[20px] font-normal text-white/70 text-center leading-snug transition-all duration-500"
            style={{ fontFamily: 'Poppins', opacity: quoteLine2 ? 1 : 0, transform: quoteLine2 ? 'translateY(0)' : 'translateY(10px)' }}
          >
            We just made sure 4.5 billion people can sing along.
          </p>
          <p
            className="text-[14px] font-normal text-white/35 uppercase tracking-[0.15em] text-center transition-all duration-500"
            style={{ fontFamily: 'Poppins', opacity: quoteLine3 ? 1 : 0, transform: quoteLine3 ? 'translateY(0)' : 'translateY(10px)' }}
          >
            One song. 30 languages. Every platform. March 30.
          </p>
        </div>
      </div>

      {/* Section Dot Indicators */}
      {section < 3 && (
        <div
          className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 transition-opacity duration-500"
          style={{ opacity: dotsVisible ? 1 : 0.2 }}
        >
          {[0, 1, 2, 3].map(i => (
            <button
              key={i}
              onClick={() => goToSection(i)}
              className={`w-1 h-1 transition-all ${
                section === i
                  ? 'bg-[#FF0CB6] shadow-[0_0_6px_rgba(255,12,182,0.6)]'
                  : 'border border-white/20 bg-transparent'
              }`}
            />
          ))}
        </div>
      )}

      {/* ====== SECTION 4: THE GLOBE ====== */}
      <div style={{
        ...sectionStyle(3),
        justifyContent: 'flex-start',
      }}>
        {/* DANCEFLOOR wordmark */}
        <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-6 bg-transparent">
          <div className="text-xl font-extrabold tracking-[-0.04em] text-[#FF0CB6] transition-all duration-700 hover:opacity-80" style={{ fontFamily: 'Poppins' }}>
            DANCEFLOOR
          </div>
        </header>

        {/* Language Grid Overlay */}
        {gridOpen && (
          <div className="fixed inset-0 z-50 bg-[#050608]/95 backdrop-blur-xl flex flex-col">
            <header className="flex justify-between items-center px-6 py-6">
              <div className="text-xl font-extrabold tracking-[-0.04em] text-[#FF0CB6]" style={{ fontFamily: 'Poppins' }}>DANCEFLOOR</div>
              <button
                onClick={() => setGridOpen(false)}
                className="material-symbols-outlined text-white/60 hover:text-[#FF0CB6] transition-all duration-300"
              >
                close
              </button>
            </header>
            <div className="flex-1 overflow-y-auto selection-scroll px-8 py-4">
              <p className="text-[9px] tracking-[0.4em] font-bold text-[#FF0CB6] opacity-80 uppercase mb-6" style={{ fontFamily: 'Poppins' }}>Select Language</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {languages.map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => { setSelected(lang); setGridOpen(false) }}
                    className={`text-left px-4 py-3 rounded-sm border transition-all ${
                      lang.id === selected.id
                        ? 'border-[#FF0CB6]/50 bg-[#FF0CB6]/10 text-white'
                        : 'border-white/5 bg-white/[0.02] text-white/50 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs font-bold tracking-wider uppercase">{lang.name}</span>
                    <span className="block text-[8px] tracking-widest text-white/30 mt-1 uppercase">{lang.speakers}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Ambient Blooms */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[10%] left-[20%] w-[60%] h-[60%] noir-bloom rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] noir-bloom rounded-full" />
        </div>

        {/* Globe Content */}
        <main className="relative z-10 w-full h-full flex flex-col items-center justify-center">
          {/* Background Typography */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden">
            <h1 className="text-[20vw] font-black leading-none tracking-tighter text-white opacity-[0.02] translate-y-[-5%] uppercase">
              {selected.name}
            </h1>
          </div>

          {/* Globe Visualizer with arrows */}
          <div className="relative w-[85vw] max-w-[700px] aspect-square flex items-center justify-center">
            {/* Pink Glow (replaces white) */}
            <div className="absolute inset-0 rounded-full globe-glow pointer-events-none" />

            {/* Left Arrow (desktop) */}
            <button
              onClick={() => cycleLang(-1)}
              className="hidden md:flex absolute -left-16 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center text-white/30 hover:text-white transition-colors z-20 text-2xl"
            >
              &#8249;
            </button>

            {/* Right Arrow (desktop) */}
            <button
              onClick={() => cycleLang(1)}
              className="hidden md:flex absolute -right-16 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center text-white/30 hover:text-white transition-colors z-20 text-2xl"
            >
              &#8250;
            </button>

            {/* Globe */}
            <div className="relative w-full h-full rounded-full overflow-hidden globe-container group">
              <img
                alt="satellite view of earth at night"
                className="w-full h-full object-cover scale-110 transition-transform duration-[20000ms] ease-linear group-hover:scale-125 globe-texture"
                src={GLOBE_IMG}
              />
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_80px_rgba(255,12,182,0.05)] pointer-events-none" />

              {/* City Dots */}
              {selected.dots.map((dot, i) => (
                <div
                  key={`${selected.id}-${i}`}
                  className="absolute transition-all duration-500"
                  style={{ top: dot.top, left: dot.left }}
                >
                  {dot.primary ? (
                    <>
                      <div className="w-4 h-4 bg-[#FF0CB6] rounded-full city-pulse relative z-10 transition-transform hover:scale-125 cursor-pointer" />
                      <div className="w-10 h-10 bg-[#FF0CB6]/30 rounded-full absolute -top-3 -left-3 animate-ping opacity-60" />
                    </>
                  ) : (
                    <div className="w-2 h-2 bg-[#FF0CB6]/60 rounded-full" />
                  )}
                </div>
              ))}
            </div>

            {/* Rotating Rings */}
            <div className="absolute inset-[-20px] rounded-full border border-white/5 animate-[spin_80s_linear_infinite]" />
            <div className="absolute inset-[-40px] rounded-full border border-[#FF0CB6]/5 animate-[spin_120s_linear_infinite_reverse]" />
          </div>
        </main>

        {/* Language Panel */}
        <aside className="fixed md:left-12 bottom-20 left-6 right-6 md:right-auto md:w-[420px] glass-module p-6 md:p-8 z-30 transition-all duration-500 hover:border-white/20">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <p className="text-[9px] tracking-[0.4em] font-bold text-[#FF0CB6] opacity-80 uppercase" style={{ fontFamily: 'Poppins' }}>Active Linguistic Region</p>
              <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase brightness-125">
                {selected.name}
              </h3>
            </div>
            <button
              onClick={() => setGridOpen(true)}
              className="w-10 h-10 flex items-center justify-center glass-module bg-white/5 border-white/5 hover:border-[#FF0CB6]/30 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[#FF0CB6] text-xl">language</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-6 border-t divider-low-contrast pt-6">
            <div>
              <p className="text-[8px] tracking-[0.2em] font-semibold text-white/30 mb-1 uppercase">Native Speakers</p>
              <p className="text-xs font-bold text-white/90 tracking-widest uppercase">{selected.speakers}</p>
            </div>
            <div>
              <p className="text-[8px] tracking-[0.2em] font-semibold text-white/30 mb-1 uppercase">Global Rank</p>
              <p className="text-xs font-bold text-white/90 tracking-widest uppercase">{selected.globalRank}</p>
            </div>
          </div>

          <div className="border-t divider-low-contrast pt-4 mb-8">
            <p className="text-[8px] tracking-[0.2em] font-semibold text-white/30 mb-3 uppercase">Primary Regions / Nations</p>
            <div className="grid grid-cols-3 gap-y-2">
              {selected.regions.slice(0, 9).map(r => (
                <div key={r} className="text-[9px] font-bold text-white/80 tracking-wider">{r}</div>
              ))}
            </div>
          </div>

          <button
            onClick={handlePlay}
            className="w-full bg-[#FF0CB6] text-black py-5 rounded-sm font-black text-[11px] tracking-[0.4em] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_4px_30px_rgba(255,12,182,0.4)]"
          >
            {playing ? 'PAUSE' : 'LISTEN NOW'}
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              {playing ? 'pause' : 'play_arrow'}
            </span>
          </button>
        </aside>

        {/* Bottom Language Ticker */}
        <div
          ref={tickerRef}
          className="fixed bottom-0 left-0 right-0 h-14 bg-[#11131A]/40 backdrop-blur-xl border-t border-white/5 flex items-center px-6 md:px-12 overflow-x-auto no-scrollbar z-40"
        >
          <div className="flex items-center gap-6 whitespace-nowrap">
            {languages.map(lang => (
              <button
                key={lang.id}
                data-active={lang.id === selected.id}
                onClick={() => setSelected(lang)}
                className={`text-[9px] tracking-[0.3em] font-bold transition-colors uppercase ${
                  lang.id === selected.id
                    ? 'text-[#FF0CB6] font-semibold'
                    : 'text-white/30 hover:text-white cursor-pointer'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="fixed bottom-14 left-0 right-0 px-8 py-4 pointer-events-none hidden md:block z-30">
          <div className="flex justify-between items-center text-[8px] tracking-[0.2em] font-medium text-white/20 uppercase">
            <div className="pointer-events-auto">&copy; 2026 HOTTR RECORDS</div>
            <div className="flex gap-6 pointer-events-auto">
              <a className="hover:text-white transition-colors" href="https://instagram.com/hottr" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a className="hover:text-white transition-colors" href="https://tiktok.com/@hottr" target="_blank" rel="noopener noreferrer">TikTok</a>
              <a className="hover:text-white transition-colors" href="https://x.com/hottr" target="_blank" rel="noopener noreferrer">X</a>
              <a className="hover:text-white transition-colors" href="mailto:press@hottr.world">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
