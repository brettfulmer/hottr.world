const cities = [
  { country: 'Australia', city: 'Melbourne', language: 'English', slug: 'melbourne' },
  { country: 'Chile', city: 'Santiago', language: 'Chilean Spanish', slug: 'santiago' },
  { country: 'Colombia', city: 'Medellín', language: 'Colombian Spanish', slug: 'medellin' },
  { country: 'Mexico', city: 'Mexico City', language: 'Mexican Spanish', slug: 'mexico-city' },
  { country: 'Brazil', city: 'São Paulo', language: 'Brazilian Portuguese', slug: 'sao-paulo' },
  { country: 'Spain', city: 'Madrid', language: 'Madrid Spanish', slug: 'madrid' },
  { country: 'France', city: 'Paris', language: 'French', slug: 'paris' },
  { country: 'Italy', city: 'Milan', language: 'Italian', slug: 'milan' },
  { country: 'Netherlands', city: 'Amsterdam', language: 'Dutch', slug: 'amsterdam' },
  { country: 'Germany', city: 'Berlin', language: 'German', slug: 'berlin' },
  { country: 'Northern Ireland', city: 'Belfast', language: 'Belfast English', slug: 'belfast' },
  { country: 'Sweden', city: 'Stockholm', language: 'Swedish', slug: 'stockholm' },
  { country: 'Poland', city: 'Warsaw', language: 'Polish', slug: 'warsaw' },
  { country: 'Romania', city: 'Bucharest', language: 'Romanian', slug: 'bucharest' },
  { country: 'Turkey', city: 'Istanbul', language: 'Turkish', slug: 'istanbul' },
  { country: 'Russia', city: 'Moscow', language: 'Russian', slug: 'moscow' },
  { country: 'Egypt', city: 'Cairo', language: 'Egyptian Arabic', slug: 'cairo' },
  { country: 'Israel', city: 'Tel Aviv', language: 'Hebrew', slug: 'tel-aviv' },
  { country: 'South Africa', city: 'Johannesburg', language: 'Afrikaans', slug: 'johannesburg' },
  { country: 'Kenya', city: 'Nairobi', language: 'Swahili', slug: 'nairobi' },
  { country: 'India', city: 'Mumbai', language: 'Hindi', slug: 'mumbai' },
  { country: 'Thailand', city: 'Bangkok', language: 'Thai', slug: 'bangkok' },
  { country: 'Vietnam', city: 'Ho Chi Minh City', language: 'Vietnamese', slug: 'ho-chi-minh-city' },
  { country: 'Philippines', city: 'Manila', language: 'Tagalog', slug: 'manila' },
  { country: 'Indonesia', city: 'Bali', language: 'Indonesian', slug: 'bali' },
  { country: 'Japan', city: 'Tokyo', language: 'Japanese', slug: 'tokyo' },
  { country: 'South Korea', city: 'Seoul', language: 'Korean', slug: 'seoul' },
  { country: 'China', city: 'Shanghai', language: 'Mandarin', slug: 'shanghai' },
  { country: 'Greece', city: 'Mykonos', language: 'Greek', slug: 'mykonos' },
  { country: 'Nigeria', city: 'Lagos', language: 'Nigerian Pidgin', slug: 'lagos' },
]

export default function Cities() {
  return (
    <div className="w-full h-full flex flex-col">
      <h2 className="font-['Poppins'] text-[24px] font-semibold text-white text-center pt-6 pb-4 flex-shrink-0">
        30 CITIES. 30 LANGUAGES.
      </h2>
      <div className="flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-5">
            {cities.map(({ country, city, language, slug }) => (
              <a
                key={city}
                href={`#spotify-${slug}`}
                className="group block rounded-sm border border-white/10 bg-white/5 backdrop-blur-xl p-4 transition-all duration-300 hover:border-[#FF0CB6]/40 hover:shadow-[0_0_24px_rgba(255,12,182,0.3)] hover:translate-y-[-2px]"
              >
                <p className="text-[10px] font-semibold text-[#FF0CB6] uppercase tracking-[0.15em] font-['Poppins'] mb-2">
                  {country}
                </p>
                <p className="text-base font-semibold text-white font-['Poppins']">{city}</p>
                <p className="text-xs text-white/50 font-['Poppins'] mt-1">{language}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
