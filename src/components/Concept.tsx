import { lazy, Suspense } from 'react'

const Globe = lazy(() => import('./Globe'))

interface Props {
  isActive: boolean
}

export default function Concept({ isActive }: Props) {
  return (
    <div className="w-full h-full flex flex-col items-center relative">
      <div className="flex-1 w-full max-w-2xl mx-auto">
        {isActive && (
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-4 h-4 bg-[#FF0CB6] rounded-sm animate-pulse" />
            </div>
          }>
            <Globe />
          </Suspense>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 text-center">
        <p className="font-['Poppins'] text-[14px] md:text-[16px] font-normal leading-relaxed text-white/80 max-w-[720px] mx-auto">
          The dancefloor doesn't care what language you speak. We just made sure 4.5 billion people can sing along.
        </p>
      </div>
    </div>
  )
}
