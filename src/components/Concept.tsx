export default function Concept() {
  return (
    <section className="relative py-20 px-6 overflow-hidden flex flex-col items-center">
      <div className="w-full max-w-sm aspect-square relative flex items-center justify-center">
        {/* Decorative Rotating "Globe" Element */}
        <div className="absolute inset-0 border border-white/5 rounded-full" />
        <div className="absolute inset-4 border border-white/10 rounded-full animate-[spin_20s_linear_infinite]" />
        <div className="relative w-72 h-72 rounded-full overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,1)]"
          style={{ background: 'radial-gradient(circle at 35% 38%, #1a0a12 0%, #0a0008 55%, #020102 100%)' }}
        >
          {/* Pulse Points (Cities) */}
          <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-[#ff3db9] rounded-full pulse-pink shadow-[0_0_10px_#FF0CB6]" />
          <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-[#ff3db9] rounded-full pulse-pink shadow-[0_0_10px_#FF0CB6]" />
          <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-[#ff3db9] rounded-full pulse-pink shadow-[0_0_10px_#FF0CB6]" />
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-[#ff3db9] rounded-full pulse-pink shadow-[0_0_10px_#FF0CB6]" />
          <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-[#ff3db9] rounded-full pulse-pink shadow-[0_0_10px_#FF0CB6]" />
        </div>
        {/* Tooltip Mockup */}
        <div className="absolute top-10 right-0 glass-pane p-2 px-3 z-10">
          <div className="flex items-center gap-2 border border-[#ff3db9]/30 rounded-md">
            <div className="live-signal" />
            <span className="font-[var(--font-manrope)] text-[9px] font-bold tracking-widest text-white uppercase">MELBOURNE</span>
          </div>
        </div>
      </div>
      <div className="mt-12 text-center max-w-xs">
        <h2 className="font-[var(--font-jakarta)] text-lg font-semibold uppercase tracking-widest mb-4">GLOBAL SYNC</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          A singular composition fractured across 25 global epicenters. Seamlessly translated, unified by the beat.
        </p>
      </div>
    </section>
  )
}
