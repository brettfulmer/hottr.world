import { useSectionReveal } from '../hooks/useSectionReveal'
import { cities } from '../data/cities'

const scrollToListen = () => {
  const section = document.querySelector('[data-section="4"]')
  if (section) section.scrollIntoView({ behavior: 'smooth' })
}

export default function Cities() {
  const sectionRef = useSectionReveal<HTMLElement>()

  return (
    <section ref={sectionRef} data-section="2" className="snap-section-scrollable flex flex-col">
      <div className="section-content flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-5">
            {cities.map(({ country, city, language }) => (
              <button
                key={city}
                onClick={scrollToListen}
                className="group block rounded-sm border border-white/10 bg-white/5 backdrop-blur-xl p-4 transition-all duration-300 hover:border-[#FF0CB6]/40 hover:shadow-[0_0_24px_rgba(255,12,182,0.3)] hover:translate-y-[-2px] text-left w-full"
              >
                <p className="text-xs font-semibold text-[#FF0CB6] uppercase tracking-wider font-['Poppins'] mb-2">
                  {country}
                </p>
                <p className="text-base font-semibold text-white font-['Poppins']">{city}</p>
                <p className="text-xs text-white/60 font-['Poppins'] mt-1">{language}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
