export default function Footer() {
  return (
    <footer className="px-6 py-16 text-center">
      <div className="flex flex-wrap items-center justify-center gap-6 font-[Poppins] text-sm text-white/50">
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
      <p className="mt-6 font-[Poppins] text-xs text-white/30">
        &copy; 2026 Hottr Records
      </p>
      <p className="mt-2 font-[Poppins] text-xs text-white/30">
        <a href="mailto:press@hottr.world" className="transition-colors hover:text-white/50">
          press@hottr.world
        </a>
      </p>
    </footer>
  )
}
