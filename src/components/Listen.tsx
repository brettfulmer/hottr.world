import { useScrollReveal } from '../hooks/useScrollReveal'

const platforms = [
  { name: 'Spotify', href: '#' },
  { name: 'Apple Music', href: '#' },
  { name: 'YouTube Music', href: '#' },
  { name: 'Amazon Music', href: '#' },
  { name: 'Tidal', href: '#' },
  { name: 'Deezer', href: '#' },
]

export default function Listen() {
  const ref = useScrollReveal<HTMLElement>()

  return (
    <section ref={ref} className="fade-in px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {platforms.map(({ name, href }) => (
            <a
              key={name}
              href={href}
              className="rounded-sm border border-white/12 bg-white/5 backdrop-blur-xl px-6 py-3 font-[Poppins] text-sm font-semibold text-white transition-all duration-300 hover:border-[#FF0CB6]/40 hover:shadow-[0_0_16px_rgba(255,12,182,0.3)]"
            >
              {name}
            </a>
          ))}
        </div>
        <p className="mt-10 font-[Poppins] text-sm tracking-wider text-white/50">
          Search 'Hottr' on any platform
        </p>
      </div>
    </section>
  )
}
