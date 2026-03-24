export default function NavBar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#050608]/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-6 h-16 max-w-none">
      <button
        type="button"
        className="flex items-center gap-2 active:scale-95 transition-transform cursor-pointer"
        aria-label="Open navigation menu"
      >
        <span className="material-symbols-outlined text-[#FF0CB6]">menu</span>
      </button>
      <div className="text-xl font-black tracking-widest text-[#FF0CB6] drop-shadow-[0_0_15px_rgba(255,12,182,0.6)] font-[var(--font-jakarta)] uppercase">
        DANCEFLOOR
      </div>
      <button
        type="button"
        className="flex items-center gap-2 active:scale-95 transition-transform cursor-pointer"
        aria-label="Share this page"
      >
        <span className="material-symbols-outlined text-[#FF0CB6]">share</span>
      </button>
    </nav>
  )
}
