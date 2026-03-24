import { lazy, Suspense } from 'react'
import { useSectionReveal } from '../hooks/useSectionReveal'

const Globe = lazy(() => import('./Globe'))

export default function Concept() {
  const sectionRef = useSectionReveal<HTMLElement>()

  return (
    <section ref={sectionRef} data-section="1" className="snap-section flex flex-col items-center justify-center">
      <div className="section-content flex flex-col items-center w-full h-full">
        <div className="flex-1 w-full max-w-2xl mx-auto">
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-4 h-4 bg-[#FF0CB6] rounded-sm animate-pulse" />
            </div>
          }>
            <Globe />
          </Suspense>
        </div>
        <div className="px-6 pb-12 text-center max-w-[720px] mx-auto">
          <p className="font-['Poppins'] text-base leading-relaxed text-white/70 sm:text-lg">
            The dancefloor doesn't care what language you speak. We just made sure 30 cities can sing along.
          </p>
        </div>
      </div>
    </section>
  )
}
