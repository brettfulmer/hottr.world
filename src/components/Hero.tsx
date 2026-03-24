export default function Hero() {
  return (
    <section className="relative min-h-[700px] flex flex-col items-center justify-center px-6 text-center py-20">
      {/* Background glow */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#ff3db9] rounded-full blur-[120px]" />
      </div>

      <p className="relative font-headline text-[10px] font-bold tracking-[0.3em] uppercase mb-4 text-white/50">
        by HOTTR
      </p>
      <h1 className="relative font-headline text-6xl md:text-8xl font-black text-white tracking-tighter mb-4 leading-none">
        DANCE<br />FLOOR
      </h1>
      <p className="relative font-headline text-sm font-semibold tracking-widest text-[#ff3db9] neon-glow mb-12">
        25 LANGUAGES. ONE NIGHT.
      </p>
      <button
        type="button"
        className="relative bg-[#FF0CB6] text-white px-8 py-4 font-headline font-bold text-xs tracking-[0.2em] hover:shadow-[0_0_15px_rgba(255,12,182,0.4)] active:scale-95 transition-all duration-300"
      >
        LISTEN NOW
      </button>
    </section>
  )
}
