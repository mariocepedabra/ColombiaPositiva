'use client'

// Loader de next/image. Sustituye a /_next/image (el optimizador de Vercel),
// que empezó a responder 402 al agotarse la cuota de transformaciones del plan
// y dejaba sin foto a las notas cuya variante aún no estaba en caché.
// Ahora las imágenes remotas pasan por /api/imagen, que es nuestro.

import { anchoMasCercano, calidadValida, hostPermitido } from '@/lib/imagenes'

type Params = { src: string; width: number; quality?: number }

export default function copoImageLoader({ src, width, quality }: Params): string {
  // Los archivos locales (logos, portada genérica) se sirven tal cual.
  if (!/^https?:\/\//i.test(src)) return src

  // Solo optimizamos los dominios propios y el de Página 10. Cualquier otra
  // URL (por ejemplo una que se pegue a mano en el panel) se carga directa
  // desde su origen: preferimos mostrarla sin optimizar a no mostrarla.
  let host: string
  try {
    host = new URL(src).hostname
  } catch {
    return src
  }
  if (!hostPermitido(host)) return src

  const w = anchoMasCercano(width)
  const q = calidadValida(quality)
  return `/api/imagen?url=${encodeURIComponent(src)}&w=${w}&q=${q}`
}
