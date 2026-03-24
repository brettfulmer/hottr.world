export default function Counter() {
  return (
    <section className="py-32 px-6 flex flex-col items-center text-center">
      <div className="relative mb-8">
        <span className="font-mono text-[160px] leading-none font-black text-white tracking-tighter mix-blend-screen opacity-90">
          25
        </span>
        <div className="absolute inset-0 bg-[#ff3db9]/20 blur-[60px] -z-10" />
      </div>
      <div className="space-y-2">
        <h4 className="font-[var(--font-jakarta)] text-2xl font-black text-white uppercase tracking-tighter">
          LANGUAGES.
        </h4>
        <h4 className="font-[var(--font-jakarta)] text-2xl font-black text-white uppercase tracking-tighter">
          ONE SONG.
        </h4>
        <h4 className="font-[var(--font-jakarta)] text-2xl font-black text-white uppercase tracking-tighter">
          EVERY PLATFORM.
        </h4>
      </div>
    </section>
  )
}
