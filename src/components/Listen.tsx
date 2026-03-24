const platforms = ['Spotify', 'Apple Music', 'YouTube Music', 'Amazon Music', 'Tidal', 'Deezer']

export default function Listen() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
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
