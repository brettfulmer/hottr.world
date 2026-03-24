import { useSectionReveal } from '../hooks/useSectionReveal'

const cities = [
  // Row 1 — Oceania + Americas
  { country: 'Oceania', city: 'Melbourne', language: 'English', slug: 'melbourne' },
  { country: 'Americas', city: 'Santiago', language: 'Chilean Spanish', slug: 'santiago' },
  { country: 'Americas', city: 'Medellín', language: 'Colombian Spanish', slug: 'medellin' },
  { country: 'Americas', city: 'Mexico City', language: 'Mexican Spanish', slug: 'mexico-city' },
  { country: 'Americas', city: 'São Paulo', language: 'Brazilian Portuguese', slug: 'sao-paulo' },
  // Row 2 — Europe West
  { country: 'Europe', city: 'Madrid', language: 'Madrid Spanish', slug: 'madrid' },
  { country: 'Europe', city: 'Paris', language: 'French', slug: 'paris' },
  { country: 'Europe', city: 'Milan', language: 'Italian', slug: 'milan' },
  { country: 'Europe', city: 'Amsterdam', language: 'Dutch', slug: 'amsterdam' },
  { country: 'Europe', city: 'Berlin', language: 'German', slug: 'berlin' },
  // Row 3 — Europe North/East
  { country: 'Europe', city: 'Belfast', language: 'Belfast English', slug: 'belfast' },
  { country: 'Europe', city: 'Stockholm', language: 'Swedish', slug: 'stockholm' },
  { country: 'Europe', city: 'Warsaw', language: 'Polish', slug: 'warsaw' },
  { country: 'Europe', city: 'Bucharest', language: 'Romanian', slug: 'bucharest' },
  { country: 'Europe', city: 'Istanbul', language: 'Turkish', slug: 'istanbul' },
  // Row 4 — Europe East + Middle East + Africa
  { country: 'Europe', city: 'Moscow', language: 'Russian', slug: 'moscow' },
  { country: 'Middle East', city: 'Cairo', language: 'Egyptian Arabic', slug: 'cairo' },
  { country: 'Middle East', city: 'Tel Aviv', language: 'Hebrew', slug: 'tel-aviv' },
  { country: 'Africa', city: 'Johannesburg', language: 'Afrikaans', slug: 'johannesburg' },
  { country: 'Africa', city: 'Nairobi', language: 'Swahili', slug: 'nairobi' },
  // Row 5 — South Asia + Southeast Asia
  { country: 'Asia', city: 'Mumbai', language: 'Hindi', slug: 'mumbai' },
  { country: 'Asia', city: 'Bangkok', language: 'Thai', slug: 'bangkok' },
  { country: 'Asia', city: 'Ho Chi Minh City', language: 'Vietnamese', slug: 'ho-chi-minh-city' },
  { country: 'Asia', city: 'Manila', language: 'Tagalog', slug: 'manila' },
  { country: 'Asia', city: 'Bali', language: 'Indonesian', slug: 'bali' },
  // Row 6 — East Asia + West Africa
  { country: 'Asia', city: 'Tokyo', language: 'Japanese', slug: 'tokyo' },
  { country: 'Asia', city: 'Seoul', language: 'Korean', slug: 'seoul' },
  { country: 'Asia', city: 'Shanghai', language: 'Mandarin', slug: 'shanghai' },
  { country: 'Europe', city: 'Mykonos', language: 'Greek', slug: 'mykonos' },
  { country: 'Africa', city: 'Lagos', language: 'Nigerian Pidgin', slug: 'lagos' },
]

export default function Cities() {
  const sectionRef = useSectionReveal<HTMLElement>()

  return (
    <section ref={sectionRef} data-section="2" className="snap-section-scrollable flex flex-col">
      <div className="section-content flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-5">
            {cities.map(({ country, city, language, slug }) => (
              <a
                key={city}
                href={`#spotify-${slug}`}
                className="group block rounded-sm border border-white/10 bg-white/5 backdrop-blur-xl p-4 transition-all duration-300 hover:border-[#FF0CB6]/40 hover:shadow-[0_0_24px_rgba(255,12,182,0.3)] hover:translate-y-[-2px]"
              >
                <p className="text-xs font-semibold text-[#FF0CB6] uppercase tracking-wider font-['Poppins'] mb-2">
                  {country}
                </p>
                <p className="text-base font-semibold text-white font-['Poppins']">{city}</p>
                <p className="text-xs text-white/60 font-['Poppins'] mt-1">{language}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
