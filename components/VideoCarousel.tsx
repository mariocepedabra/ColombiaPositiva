'use client'

import { useState, useEffect } from 'react'
import type { Video } from '@/lib/videos'
import { getEmbedUrl } from '@/lib/videos'

function useVisibleCount() {
  const [cols, setCols] = useState(3)
  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640) setCols(1)
      else if (window.innerWidth < 1024) setCols(2)
      else setCols(3)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return cols
}

function VideoItem({ video }: { video: Video }) {
  const embedUrl = getEmbedUrl(video)
  return (
    <div className="flex flex-col gap-3">
      {/* Contenedor 9:16 */}
      <div className="w-full aspect-[9/16] relative bg-black rounded-lg overflow-hidden shadow-md">
        {video.platform === 'direct' ? (
          <video
            src={video.url}
            controls
            className="absolute inset-0 w-full h-full object-contain"
            playsInline
          />
        ) : (
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            title={video.title || 'Video Colombia Positiva'}
            loading="lazy"
          />
        )}
      </div>
      {video.title && (
        <p className="font-sans text-sm font-600 text-tinta text-center line-clamp-2 px-1 leading-snug">
          {video.title}
        </p>
      )}
    </div>
  )
}

export default function VideoCarousel({ videos }: { videos: Video[] }) {
  const [index, setIndex] = useState(0)
  const cols = useVisibleCount()

  // Ajustar index cuando cambia el número de columnas visibles
  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, videos.length - cols)))
  }, [cols, videos.length])

  if (videos.length === 0) return null

  const max = Math.max(0, videos.length - cols)
  const visible = videos.slice(index, index + cols)

  const prev = () => setIndex((i) => Math.max(0, i - 1))
  const next = () => setIndex((i) => Math.min(max, i + 1))

  const gridClass =
    cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <div className="relative px-10">
      {/* Grid de videos */}
      <div
        key={`${index}-${cols}`}
        className={`grid gap-4 video-slide-in ${gridClass}`}
      >
        {visible.map((video) => (
          <VideoItem key={video.id} video={video} />
        ))}
      </div>

      {/* Flechas de navegación */}
      {max > 0 && (
        <>
          <button
            onClick={prev}
            disabled={index === 0}
            aria-label="Videos anteriores"
            className="absolute left-0 top-1/3 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gris-200 shadow-md flex items-center justify-center hover:bg-verde hover:text-white hover:border-verde transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            disabled={index === max}
            aria-label="Siguientes videos"
            className="absolute right-0 top-1/3 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gris-200 shadow-md flex items-center justify-center hover:bg-verde hover:text-white hover:border-verde transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Indicadores (dots) */}
      {max > 0 && (
        <div className="flex justify-center gap-2 mt-5">
          {Array.from({ length: max + 1 }, (_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Ir al grupo ${i + 1}`}
              className={`transition-all rounded-full ${
                i === index
                  ? 'w-6 h-2 bg-verde'
                  : 'w-2 h-2 bg-gris-300 hover:bg-gris-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
