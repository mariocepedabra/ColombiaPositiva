'use client'

import { useState, useEffect, useRef } from 'react'
import type { Ad } from '@/lib/ads'

const ROTATE_MS = 10_000

function AdBanner({ ad }: { ad: Ad }) {
  const media = ad.media_type === 'video' ? (
    <video
      src={ad.media_url}
      className="w-full h-full object-contain bg-black"
      muted
      autoPlay
      loop
      playsInline
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={ad.media_url} alt={ad.company || ad.advertiser_name} className="w-full h-full object-contain" />
  )

  const inner = (
    <div className="relative w-full" style={{ aspectRatio: '970 / 250' }}>
      {media}
    </div>
  )

  if (ad.target_url) {
    return (
      <a href={ad.target_url} target="_blank" rel="noopener noreferrer sponsored" className="block">
        {inner}
      </a>
    )
  }
  return inner
}

export default function AdCarousel({ ads }: { ads: Ad[] }) {
  const total = ads.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const inViewRef = useRef(true)

  useEffect(() => {
    const el = sectionRef.current
    if (!el || total < 2) return
    const observer = new IntersectionObserver(
      ([entry]) => { inViewRef.current = entry.isIntersecting },
      { threshold: 0.1 }
    )
    observer.observe(el)
    const onVisibility = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [total])

  useEffect(() => {
    if (total < 2 || paused) return
    const t = setTimeout(() => {
      if (inViewRef.current && !document.hidden) {
        setIndex((i) => (i + 1) % total)
      }
    }, ROTATE_MS)
    return () => clearTimeout(t)
  }, [index, total, paused])

  if (total === 0) return null

  const prev = () => setIndex((i) => (i - 1 + total) % total)
  const next = () => setIndex((i) => (i + 1) % total)

  return (
    <div ref={sectionRef} className="max-w-5xl mx-auto px-4 py-4">
      <p className="font-sans text-[10px] uppercase tracking-widest text-gris-400 text-right mb-1">Publicidad</p>
      <div className="relative">
        <div key={index} className="hero-fade-in">
          <AdBanner ad={ads[index]} />
        </div>

        {total > 1 && (
          <>
            <button onClick={prev} aria-label="Anuncio anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/80 border border-gris-200 shadow flex items-center justify-center hover:bg-verde hover:text-white transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button onClick={next} aria-label="Siguiente anuncio"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/80 border border-gris-200 shadow flex items-center justify-center hover:bg-verde hover:text-white transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {ads.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)} aria-label={`Ir al anuncio ${i + 1}`}
              className={`transition-all rounded-full ${i === index ? 'w-5 h-2 bg-verde' : 'w-2 h-2 bg-gris-300 hover:bg-gris-400'}`} />
          ))}
        </div>
      )}
    </div>
  )
}
