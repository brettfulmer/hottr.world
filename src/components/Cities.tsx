import { useScrollReveal } from '../hooks/useScrollReveal'

const cities = [
  // Row 1 — Americas
  { city: 'Melbourne', language: 'English' },
  { city: 'Santiago', language: 'Chilean Spanish' },
  { city: 'Medellín', language: 'Colombian Spanish' },
  { city: 'Mexico City', language: 'Mexican Spanish' },
  { city: 'São Paulo', language: 'Brazilian Portuguese' },
  // Row 2 — Europe West
  { city: 'Madrid', language: 'Madrid Spanish' },
  { city: 'Paris', language: 'French' },
  { city: 'Milan', language: 'Italian' },
  { city: 'Amsterdam', language: 'Dutch' },
  { city: 'Berlin', language: 'German' },
  // Row 3 — Europe North/East
  { city: 'Belfast', language: 'Belfast English' },
  { city: 'Stockholm', language: 'Swedish' },
  { city: 'Warsaw', language: 'Polish' },
  { city: 'Mykonos', language: 'Greek' },
  { city: 'Istanbul', language: 'Turkish' },
  // Row 4 — Middle East/Africa
  { city: 'Cairo', language: 'Egyptian Arabic' },
  { city: 'Tel Aviv', language: 'Hebrew' },
  { city: 'Johannesburg', language: 'Afrikaans' },
  { city: 'Mumbai', language: 'Hindi' },
  { city: 'Bangkok', language: 'Thai' },
  // Row 5 — Asia Pacific
  { city: 'Tokyo', language: 'Japanese' },
  { city: 'Seoul', language: 'Korean' },
  { city: 'Shanghai', language: 'Mandarin' },
  { city: 'Manila', language: 'Tagalog' },
  { city: 'Bali', language: 'Indonesian' },
]

export default function Cities() {
  const ref = useScrollReveal<HTMLElement>()

  return (
    <section ref={ref} className="fade-in px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {cities.map(({ city, language }) => (
            <a
              key={city}
              href="#"
              className="group rounded-sm border border-white/10 bg-white/5 backdrop-blur-xl p-5 cursor-pointer transition-all duration-300 hover:border-[#FF0CB6]/40 hover:shadow-[0_0_24px_rgba(255,12,182,0.3)] hover:translate-y-[-2px]"
            >
              <p className="text-lg font-semibold text-white font-[Poppins]">{city}</p>
              <p className="text-sm text-white/60 font-[Poppins] mt-1">{language}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
