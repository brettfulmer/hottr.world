export default function Footer() {
  return (
    <footer className="bg-[#050608] border-t border-white/5 py-12 px-8 flex flex-col items-center gap-8 w-full">
      <div className="text-[#FF0CB6] font-black text-xl tracking-tighter font-headline uppercase">
        HOTTR
      </div>
      <div className="flex flex-wrap justify-center gap-6">
        {['PRIVACY', 'TERMS', 'CONTACT'].map((link) => (
          <button
            key={link}
            type="button"
            className="font-headline text-[10px] font-bold tracking-[0.1em] uppercase text-white/40 hover:text-[#FF0CB6] transition-all duration-200 bg-transparent border-0 p-0 cursor-pointer"
          >
            {link}
          </button>
        ))}
        <a
          href="https://instagram.com/hottr"
          target="_blank"
          rel="noopener noreferrer"
          className="font-headline text-[10px] font-bold tracking-[0.1em] uppercase text-white/40 hover:text-[#FF0CB6] transition-all duration-200 underline underline-offset-4"
        >
          INSTAGRAM
        </a>
      </div>
      <p className="font-headline text-[10px] font-bold tracking-[0.1em] uppercase text-white/40 text-center max-w-xs leading-relaxed">
        &copy; 2024 HOTTR / NEON MONOLITH RECORDS. ALL RIGHTS RESERVED.
      </p>
    </footer>
  )
}
