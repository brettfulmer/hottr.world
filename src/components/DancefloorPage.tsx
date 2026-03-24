import { useState, useRef, useEffect } from 'react'
import { languages } from '../data/languages'
import type { Language } from '../data/languages'

const TRACK_URL = 'https://ykjntvewdxdgbmzmvmwa.supabase.co/storage/v1/object/public/records/Dancefloor.mp3'
const GLOBE_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoY4QNlU1j_j87-dhBhteovBKpMknAiQCtPbodMtRnpcSb5pFqHikGdZ0edVst-pFolhnDhXzrS0vlr66K7ptRXDZNop2staUW4JLa5rnmqqFwkd_QTBHB5vAMBSsVZpVIMMnnxr_rhhRv3AoEbWiAO5B1Cmh6rzfuSPlOyR7qhFu6JjaTcci4c4WmLxzCbd4A8DMT4qB8eYutamtKAaFuLHiClpZYuFXVjp9IquOZJ52AEJCUK2XBShToRyTQFcrlB-6ErK_u51rW'

export default function DancefloorPage() {
  const [selected, setSelected] = useState<Language>(languages.find(l => l.name === 'French')!)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#050608]">
      {/* Top Navigation */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-6 bg-transparent">
        <div className="text-xl font-extrabold tracking-[-0.04em] text-[#FF0CB6] transition-all duration-700 hover:opacity-80">
          DANCEFLOOR
        </div>
        <div className="flex items-center gap-8">
          <button className="material-symbols-outlined text-white/60 hover:text-[#FF0CB6] transition-all duration-300">
            shopping_bag
          </button>
          <button className="material-symbols-outlined text-white/60 hover:text-[#FF0CB6] transition-all duration-300">
            menu
          </button>
        </div>
      </header>

      {/* Ambient Blooms */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[60%] h-[60%] noir-bloom rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] noir-bloom rounded-full" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 w-full h-screen flex flex-col items-center justify-center">
        {/* Background Typography */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden">
          <h1 className="text-[20vw] font-black leading-none tracking-tighter text-white opacity-[0.02] translate-y-[-5%] uppercase">
            {selected.name}
          </h1>
        </div>

        {/* Globe Visualizer */}
        <div className="relative w-[85vw] max-w-[700px] aspect-square flex items-center justify-center">
          {/* Inner Glow */}
          <div className="absolute inset-0 rounded-full bg-[#FF0CB6]/5 blur-[60px] animate-pulse" />

          {/* Globe */}
          <div className="relative w-full h-full rounded-full overflow-hidden globe-container group">
            <img
              alt="satellite view of earth at night"
              className="w-full h-full object-cover scale-110 transition-transform duration-[20000ms] ease-linear group-hover:scale-125 globe-texture"
              src={GLOBE_IMG}
            />
            {/* Atmospheric Inner Overlay */}
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_80px_rgba(255,255,255,0.05)] pointer-events-none" />

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
      <aside className="fixed md:left-12 bottom-20 left-6 right-6 md:right-auto md:w-[420px] glass-module flex flex-col max-h-[60vh] z-30 transition-all duration-500 hover:border-white/20">
        {/* Header */}
        <div className="p-6 md:p-8 border-b divider-low-contrast shrink-0">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[9px] tracking-[0.4em] font-bold text-[#FF0CB6] opacity-80">ACTIVE LINGUA</p>
              <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase brightness-125">
                {selected.name}
              </h3>
            </div>
            <div className="w-10 h-10 flex items-center justify-center glass-module bg-white/5 border-white/5">
              <span className="material-symbols-outlined text-[#FF0CB6] text-xl">language</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto selection-scroll p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-[8px] tracking-[0.2em] font-semibold text-white/30 mb-1 uppercase">Speakers</p>
              <p className="text-xl font-black text-white/90 tracking-tight">{selected.speakers}</p>
            </div>
            <div>
              <p className="text-[8px] tracking-[0.2em] font-semibold text-white/30 mb-1 uppercase">Official In</p>
              <p className="text-xl font-black text-white/90 tracking-tight">{selected.officialIn}</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[8px] tracking-[0.2em] font-semibold text-white/30 uppercase border-b divider-low-contrast pb-2">
              Global Jurisdictions
            </p>
            <div className="grid grid-cols-2 gap-y-3 text-[10px] font-bold text-white/70 tracking-widest uppercase">
              {selected.countries.map((c, i) => (
                <div key={c} className="flex items-center gap-2">
                  <span className={`w-1 h-1 rounded-full ${i < 2 ? 'bg-[#FF0CB6]' : 'bg-[#FF0CB6]/40'}`} />
                  {c}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t divider-low-contrast">
            <p className="text-[8px] tracking-[0.2em] font-semibold text-white/30 mb-2 uppercase">Core Cultural Hubs</p>
            <div className="flex flex-wrap gap-2">
              {selected.culturalHubs.map(hub => (
                <span key={hub} className="px-2 py-1 bg-white/5 border border-white/10 text-[9px] font-bold tracking-wider">
                  {hub}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 md:p-8 border-t divider-low-contrast shrink-0 bg-[#11131A]/20">
          <button
            onClick={handlePlay}
            className="w-full bg-[#FF0CB6] text-black py-4 rounded-[4px] font-extrabold text-[10px] tracking-[0.4em] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(255,12,182,0.2)]"
          >
            {playing ? 'PAUSE' : 'LISTEN NOW'}
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              {playing ? 'pause' : 'play_arrow'}
            </span>
          </button>
        </div>
      </aside>

      {/* Audio Visualizer (Top Right) */}
      <div className="fixed top-24 right-8 z-40 flex flex-col items-end gap-3 pointer-events-none">
        <div className="flex items-end gap-[3px] h-10 opacity-60">
          {[30, 70, 50, 90, 40, 60].map((h, i) => (
            <div
              key={i}
              className="w-[2px] bg-[#FF0CB6]"
              style={{
                height: `${h}%`,
                animation: `bounce ${0.7 + i * 0.2}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
        <p className="text-[7px] tracking-[0.5em] font-black text-[#FF0CB6] opacity-70">
          SYSTEM_NOMINAL // STREAM_ACTIVE
        </p>
      </div>

      {/* Bottom Navigation Tray */}
      <div
        ref={navRef}
        className="fixed bottom-0 left-0 right-0 h-14 bg-[#11131A]/40 backdrop-blur-xl border-t border-white/5 flex items-center px-6 md:px-12 gap-8 overflow-x-auto no-scrollbar z-40"
      >
        <div className="flex-shrink-0 flex items-center gap-2 pr-4 border-r border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF0CB6] shadow-[0_0_8px_rgba(255,12,182,0.6)]" />
          <span className="text-[9px] tracking-[0.3em] font-bold text-white/60 whitespace-nowrap">
            ACTIVE: {selected.name.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-8 whitespace-nowrap">
          {languages.map(lang => (
            <button
              key={lang.id}
              onClick={() => setSelected(lang)}
              className={`text-[9px] tracking-[0.3em] font-bold transition-colors uppercase ${
                lang.id === selected.id
                  ? 'text-[#FF0CB6]'
                  : 'text-white/40 hover:text-white cursor-pointer'
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
          <div className="pointer-events-auto">&copy; 2026 Hottr Records</div>
          <div className="flex gap-6 pointer-events-auto">
            <a className="hover:text-white transition-colors" href="https://instagram.com/hottr" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a className="hover:text-white transition-colors" href="https://tiktok.com/@hottr" target="_blank" rel="noopener noreferrer">TikTok</a>
            <a className="hover:text-white transition-colors" href="https://x.com/hottr" target="_blank" rel="noopener noreferrer">X</a>
            <a className="hover:text-white transition-colors" href="mailto:press@hottr.world">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
