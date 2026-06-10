'use client'

import { useState } from 'react'
import type { Video } from '@/lib/videos'
import { getEmbedUrl, effectivePlatform } from '@/lib/videos'

type Props = {
  videos: Video[]
  platformName: string
  accentColor: string
}

/**
 * Carrusel de una división (Instagram, Facebook o TikTok).
 * Muestra un solo video a la vez — los demás no se montan, así que
 * solo hay un iframe cargado por división.
 */
export default function PlatformVideoCarousel({ videos, platformName, accentColor }: Props) {
  const [index, setIndex] = useState(0)
  const total = videos.length
  const video = videos[index]

  const prev = () => setIndex((i) => (i - 1 + total) % total)
  const next = () => setIndex((i) => (i + 1) % total)

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        {/* Contenedor 9:16 — solo el video activo está montado */}
        <div key={video.id} className="w-full aspect-[9/16] relative bg-black rounded-lg overflow-hidden shadow-md video-slide-in">
          {effectivePlatform(video) === 'direct' ? (
            <video
              src={video.url}
              controls
              className="absolute inset-0 w-full h-full object-contain"
              playsInline
            />
          ) : (
            <iframe
              src={getEmbedUrl(video)}
              className="absolute inset-0 w-full h-full border-0"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              title={video.title || `Video de ${platformName} — Colombia Positiva`}
              loading="lazy"
            />
          )}
        </div>

        {/* Flechas de navegación de la división */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              aria-label={`Video anterior de ${platformName}`}
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gris-200 shadow-md flex items-center justify-center hover:bg-verde hover:text-white hover:border-verde transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label={`Siguiente video de ${platformName}`}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gris-200 shadow-md flex items-center justify-center hover:bg-verde hover:text-white hover:border-verde transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Título y posición */}
      <div className="flex flex-col items-center gap-1 px-1">
        {video.title && (
          <p className="font-sans text-sm font-600 text-tinta text-center line-clamp-2 leading-snug">
            {video.title}
          </p>
        )}
        {total > 1 && (
          <span className="font-sans text-xs text-gris-400" style={{ color: accentColor }}>
            {index + 1} / {total}
          </span>
        )}
      </div>
    </div>
  )
}
