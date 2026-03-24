import { useScrollReveal } from '../hooks/useScrollReveal'

const platforms = [
  { name: 'Spotify', icon: 'brand_family' },
  { name: 'Apple Music', icon: 'music_note' },
  { name: 'YouTube', icon: 'play_circle' },
  { name: 'Tidal', icon: 'podcasts' },
]

export default function Listen() {
  const ref = useScrollReveal<HTMLElement>()

  return (
    <section ref={ref} className="fade-in pb-32 px-6">
      <div className="flex flex-wrap justify-center items-center gap-10 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
        {platforms.map(({ name, icon }) => (
          <button
            key={name}
            type="button"
            aria-label={name}
            className="transition-opacity hover:opacity-100 bg-transparent border-0 p-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-3xl">{icon}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
