const featuredCities = [
  { country: 'AUSTRALIA', city: 'MELBOURNE', language: 'English' },
  { country: 'TURKEY', city: 'ISTANBUL', language: 'Turkish' },
  { country: 'JAPAN', city: 'TOKYO', language: 'Japanese' },
  { country: 'GERMANY', city: 'BERLIN', language: 'German' },
]

export default function Cities() {
  return (
    <section className="py-20 px-4 bg-surface-container-lowest">
      <div className="grid grid-cols-2 gap-2">
        {featuredCities.map(({ country, city, language }) => (
          <div
            key={city}
            className="glass-pane p-4 flex flex-col justify-between aspect-square hover:bg-white/10 transition-colors duration-300"
          >
            <span className="font-[var(--font-manrope)] text-[10px] text-[#ff3db9] font-bold tracking-widest uppercase">
              {country}
            </span>
            <div>
              <h3 className="font-[var(--font-jakarta)] text-lg font-bold text-white leading-none">
                {city}
              </h3>
              <p className="font-[var(--font-manrope)] text-[9px] text-white/40 uppercase mt-1 tracking-wider">
                {language}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <a
          className="text-[#ff3db9] font-[var(--font-jakarta)] text-xs font-bold tracking-widest underline underline-offset-8 uppercase cursor-pointer"
          href="#"
        >
          VIEW FULL ROSTER
        </a>
      </div>
    </section>
  )
}
