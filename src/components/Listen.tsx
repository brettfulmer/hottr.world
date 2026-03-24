import { useSectionReveal } from '../hooks/useSectionReveal'

const platforms = [
  { name: 'Spotify', href: 'https://open.spotify.com' },
  { name: 'Apple Music', href: 'https://music.apple.com' },
  { name: 'YouTube Music', href: 'https://music.youtube.com' },
  { name: 'Amazon Music', href: 'https://music.amazon.com' },
  { name: 'Tidal', href: 'https://tidal.com' },
  { name: 'Deezer', href: 'https://www.deezer.com' },
]

export default function Listen() {
  const sectionRef = useSectionReveal<HTMLElement>()

  return (
    <section ref={sectionRef} data-section="4" className="snap-section flex flex-col items-center justify-center">
      <div className="section-content flex flex-col items-center justify-center h-full w-full">
        {/* Top half — Streaming links */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {platforms.map(({ name, href }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm border border-white/10 bg-white/5 px-5 py-3 font-['Poppins'] text-sm text-white/70 transition-all duration-300 hover:border-[#FF0CB6]/40 hover:text-white hover:shadow-[0_0_16px_rgba(255,12,182,0.3)]"
              >
                {name}
              </a>
            ))}
          </div>
          <p className="mt-8 font-['Poppins'] text-sm tracking-wider text-white/50">
            Search 'Hottr' on any platform
          </p>
        </div>
        {/* Bottom half — Footer */}
        <div className="py-12 px-6 text-center w-full">
          <div className="flex flex-wrap items-center justify-center gap-6 font-['Poppins'] text-sm text-white/50">
            <a href="https://instagram.com/hottr" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white/80">
              Instagram @hottr
            </a>
            <a href="https://tiktok.com/@hottr" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white/80">
              TikTok @hottr
            </a>
            <a href="https://x.com/hottr" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white/80">
              X @hottr
            </a>
          </div>
          <p className="mt-6 font-['Poppins'] text-xs text-white/30">
            &copy; 2026 Hottr Records
          </p>
          <p className="mt-2 font-['Poppins'] text-xs text-white/30">
            <a href="mailto:press@hottr.world" className="transition-colors hover:text-white/50">
              press@hottr.world
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
