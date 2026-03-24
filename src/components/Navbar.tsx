export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#050608]/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-6 h-16">
      <button className="active:scale-95 transition-transform" aria-label="Menu">
        <span className="material-symbols-outlined text-[#FF0CB6]">menu</span>
      </button>
      <div className="text-xl font-black tracking-widest text-[#FF0CB6] drop-shadow-[0_0_15px_rgba(255,12,182,0.6)] font-headline uppercase">
        DANCEFLOOR
      </div>
      <button className="active:scale-95 transition-transform" aria-label="Share">
        <span className="material-symbols-outlined text-[#FF0CB6]">share</span>
      </button>
    </nav>
  )
}
