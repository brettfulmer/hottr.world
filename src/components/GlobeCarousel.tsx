import { useState, useRef, useCallback, useEffect } from 'react'
import { cities } from '../data/cities'
import GlobeCanvas from './GlobeCanvas'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function GlobeCarousel() {
  const sectionRef = useScrollReveal<HTMLElement>()
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStart = useRef(0)
  const touchDelta = useRef(0)
  const [dragOffset, setDragOffset] = useState(0)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [globeSize, setGlobeSize] = useState(320)

  const activeCity = cities[activeIndex]

  useEffect(() => {
    const update = () => {
      setGlobeSize(Math.min(window.innerWidth - 48, 380))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const goTo = useCallback((index: number) => {
    setActiveIndex(Math.max(0, Math.min(cities.length - 1, index)))
    setDragOffset(0)
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX
    isDragging.current = true
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    touchDelta.current = e.touches[0].clientX - touchStart.current
    setDragOffset(touchDelta.current)
  }

  const handleTouchEnd = () => {
    isDragging.current = false
    const threshold = 50
    if (touchDelta.current < -threshold && activeIndex < cities.length - 1) {
      goTo(activeIndex + 1)
    } else if (touchDelta.current > threshold && activeIndex > 0) {
      goTo(activeIndex - 1)
    } else {
      setDragOffset(0)
    }
    touchDelta.current = 0
  }

  // Mouse drag support
  const handleMouseDown = (e: React.MouseEvent) => {
    touchStart.current = e.clientX
    isDragging.current = true
    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    touchDelta.current = e.clientX - touchStart.current
    setDragOffset(touchDelta.current)
  }

  const handleMouseUp = () => {
    if (!isDragging.current) return
    isDragging.current = false
    const threshold = 50
    if (touchDelta.current < -threshold && activeIndex < cities.length - 1) {
      goTo(activeIndex + 1)
    } else if (touchDelta.current > threshold && activeIndex > 0) {
      goTo(activeIndex - 1)
    } else {
      setDragOffset(0)
    }
    touchDelta.current = 0
  }

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(activeIndex + 1)
      if (e.key === 'ArrowLeft') goTo(activeIndex - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeIndex, goTo])

  return (
    <section ref={sectionRef} className="fade-in relative py-20 px-6 overflow-hidden flex flex-col items-center">
      {/* Globe */}
      <div className="relative flex items-center justify-center" style={{ width: globeSize, height: globeSize }}>
        {/* Decorative rings */}
        <div className="absolute inset-0 border border-white/5 rounded-full" />
        <div className="absolute inset-4 border border-white/[0.08] rounded-full animate-[spin_30s_linear_infinite]" />

        <GlobeCanvas
          activeCity={activeCity}
          targetLon={activeCity.lng}
          targetLat={activeCity.lat}
          width={globeSize}
          height={globeSize}
        />

        {/* Live signal tooltip */}
        <div className="absolute top-6 right-0 glass-pane p-2 px-3 z-10 border-[#FF0CB6]/30">
          <div className="flex items-center gap-2">
            <div className="live-signal" />
            <span className="font-label text-[9px] font-bold tracking-widest text-white uppercase">
              {activeCity.city.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="mt-10 text-center max-w-xs">
        <h2 className="font-headline text-lg font-semibold uppercase tracking-widest mb-3">GLOBAL SYNC</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          A singular composition fractured across 25 global epicenters. Seamlessly translated, unified by the beat.
        </p>
      </div>

      {/* Swipeable City Carousel */}
      <div
        ref={containerRef}
        className="mt-12 w-full max-w-md relative select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Arrow buttons */}
        <button
          onClick={() => goTo(activeIndex - 1)}
          className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-20 w-8 h-8 flex items-center justify-center text-white/40 hover:text-[#FF0CB6] transition-colors ${activeIndex === 0 ? 'opacity-0 pointer-events-none' : ''}`}
          aria-label="Previous city"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button
          onClick={() => goTo(activeIndex + 1)}
          className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-20 w-8 h-8 flex items-center justify-center text-white/40 hover:text-[#FF0CB6] transition-colors ${activeIndex === cities.length - 1 ? 'opacity-0 pointer-events-none' : ''}`}
          aria-label="Next city"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        {/* Cards container */}
        <div className="overflow-hidden mx-8">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(calc(-${activeIndex * 100}% + ${dragOffset}px))`,
              transitionDuration: isDragging.current ? '0ms' : '500ms',
            }}
          >
            {cities.map((city, i) => (
              <div
                key={city.city}
                className="w-full flex-shrink-0 px-2"
              >
                <div
                  className={`glass-pane p-6 flex flex-col justify-between aspect-[3/2] transition-all duration-500 cursor-grab active:cursor-grabbing ${
                    i === activeIndex ? 'border-[#FF0CB6]/30 shadow-[0_0_20px_rgba(255,12,182,0.15)]' : ''
                  }`}
                >
                  <span className="font-label text-[10px] text-[#FF0CB6] font-bold tracking-widest uppercase">
                    {city.country}
                  </span>
                  <div>
                    <h3 className="font-headline text-2xl font-bold text-white leading-none">
                      {city.city.toUpperCase()}
                    </h3>
                    <p className="font-label text-[10px] text-white/40 uppercase mt-1.5 tracking-wider">
                      {city.language}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-6">
          {cities.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'w-6 h-1.5 bg-[#FF0CB6] shadow-[0_0_8px_#FF0CB6]'
                  : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Go to ${cities[i].city}`}
            />
          ))}
        </div>

        {/* Counter */}
        <p className="text-center mt-4 font-label text-[10px] text-white/30 tracking-widest">
          {String(activeIndex + 1).padStart(2, '0')} / {cities.length}
        </p>
      </div>
    </section>
  )
}
