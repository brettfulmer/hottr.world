import { useScrollReveal } from '../hooks/useScrollReveal'

export default function Concept() {
  const ref = useScrollReveal<HTMLElement>()

  return (
    <section ref={ref} className="fade-in px-6 py-28 md:py-36">
      <div className="mx-auto max-w-[720px] text-center">
        <p className="font-[Poppins] text-xl font-semibold leading-relaxed text-white sm:text-2xl md:text-3xl">
          One club track. Twenty-five languages. The most widely localized single release in music history.
        </p>
        <p className="mt-6 font-[Poppins] text-base leading-relaxed text-white/72 sm:text-lg">
          The dancefloor doesn't care what language you speak. We just made sure 25 cities can sing along.
        </p>
      </div>
    </section>
  )
}
