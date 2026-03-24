export default function Footer() {
  return (
    <footer className="bg-[#050608] border-t border-white/5 py-12 px-8 flex flex-col items-center gap-8 w-full">
      <div className="text-[#FF0CB6] font-black text-xl tracking-tighter font-[var(--font-jakarta)] uppercase">
        HOTTR
      </div>
      <div className="flex flex-wrap justify-center gap-6">
        <a className="font-[var(--font-jakarta)] text-[10px] font-bold tracking-[0.1em] uppercase text-white/40 hover:text-[#FF0CB6] transition-all duration-200 cursor-pointer">
          PRIVACY
        </a>
        <a className="font-[var(--font-jakarta)] text-[10px] font-bold tracking-[0.1em] uppercase text-white/40 hover:text-[#FF0CB6] transition-all duration-200 cursor-pointer">
          TERMS
        </a>
        <a className="font-[var(--font-jakarta)] text-[10px] font-bold tracking-[0.1em] uppercase text-white/40 hover:text-[#FF0CB6] transition-all duration-200 cursor-pointer">
          CONTACT
        </a>
        <a className="font-[var(--font-jakarta)] text-[10px] font-bold tracking-[0.1em] uppercase text-white/40 hover:text-[#FF0CB6] transition-all duration-200 cursor-pointer underline underline-offset-4">
          INSTAGRAM
        </a>
      </div>
      <p className="font-[var(--font-jakarta)] text-[10px] font-bold tracking-[0.1em] uppercase text-white/40 text-center max-w-xs leading-relaxed">
        &copy; 2024 HOTTR / NEON MONOLITH RECORDS. ALL RIGHTS RESERVED.
      </p>
    </footer>
  )
}
