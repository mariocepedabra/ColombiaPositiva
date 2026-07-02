'use client'

import { useState } from 'react'
import type { Video } from '@/lib/videos'
import { getEmbedUrl, effectivePlatform } from '@/lib/videos'

type Props = {
  videos: Video[]
  platformName: string
  accentColor: string
  /** Cuántos videos se muestran a la vez: 1 (por defecto) o 3 (red única). */
  perView?: 1 | 3
}

/** El marco 9:16 con el embed o el <video> directo. */
function VideoFrame({ video, platformName }: { video: Video; platformName: string }) {
  return (
    <div className="w-full aspect-[9/16] relative bg-black rounded-lg overflow-hidden shadow-md">
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
  )
}

/**
 * Carrusel de una división (Instagram, Facebook o TikTok).
 * - perView=1: un video a la vez (comportamiento normal, 2 o 3 redes activas).
 * - perView=3: hasta 3 videos por pantalla (cuando es la única red activa).
 * Solo se montan los iframes de la página visible.
 */
export default function PlatformVideoCarousel({ videos, platformName, accentColor, perView = 1 }: Props) {
  const [page, setPage] = useState(0)
  const total = videos.length
  const pages = Math.max(1, Math.ceil(total / perView))
  const safePage = page % pages
  const start = safePage * perView
  const windowVideos = videos.slice(start, start + perView)

  const prev = () => setPage((p) => (p - 1 + pages) % pages)
  const next = () => setPage((p) => (p + 1) % pages)

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        {perView === 1 ? (
          <div key={windowVideos[0].id} className="video-slide-in">
            <VideoFrame video={windowVideos[0]} platformName={platformName} />
          </div>
        ) : (
          <div key={safePage} className="flex flex-wrap justify-center gap-6 video-slide-in">
            {windowVideos.map((v) => (
              <div key={v.id} className="w-full sm:w-[calc(50%-0.75rem)] md:w-[calc(33.333%-1rem)] flex flex-col gap-2">
                <VideoFrame video={v} platformName={platformName} />
                {v.title && (
                  <p className="font-sans text-sm font-600 text-tinta text-center line-clamp-2 leading-snug">
                    {v.title}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Flechas de navegación de la división */}
        {pages > 1 && (
          <>
            <button
              onClick={prev}
              aria-label={`Videos anteriores de ${platformName}`}
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gris-200 shadow-md flex items-center justify-center hover:bg-verde hover:text-white hover:border-verde transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label={`Siguientes videos de ${platformName}`}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gris-200 shadow-md flex items-center justify-center hover:bg-verde hover:text-white hover:border-verde transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Título (solo perView=1) y posición */}
      <div className="flex flex-col items-center gap-1 px-1">
        {perView === 1 && windowVideos[0].title && (
          <p className="font-sans text-sm font-600 text-tinta text-center line-clamp-2 leading-snug">
            {windowVideos[0].title}
          </p>
        )}
        {pages > 1 && (
          <span className="font-sans text-xs text-gris-400" style={{ color: accentColor }}>
            {perView === 1 ? `${safePage + 1} / ${total}` : `${safePage + 1} / ${pages}`}
          </span>
        )}
      </div>
    </div>
  )
}
