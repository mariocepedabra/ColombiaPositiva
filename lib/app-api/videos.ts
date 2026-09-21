import { unstable_cache } from 'next/cache'

import { createAdminClient } from '@/lib/supabase/admin'
import { createAnonClient } from '@/lib/supabase/anon'
import { getVideoVisibility } from '@/lib/video-visibility'
import { effectivePlatform, getEmbedUrl, type Video } from '@/lib/videos'
import type { ListaVideos, VideoResumen } from './contratos'

// Videos para la app: la pestaña Videos (pager a pantalla completa) y el
// bloque "Historias" de la portada. Incluye las tres redes (según los
// interruptores del panel), YouTube y los MP4 propios del bucket.

export const TAG_VIDEOS = 'app-videos'

// Margen de una hora: si la miniatura caduca dentro de poco, tampoco sirve
// (la respuesta se cachea y el teléfono puede abrirla más tarde).
function miniaturaCaducada(url: string): boolean {
  const expira = Number(url.match(/[?&]x-expires=(\d+)/)?.[1])
  if (!Number.isFinite(expira)) return false
  return expira * 1000 < Date.now() + 60 * 60 * 1000
}

function idTikTok(url: string): string | null {
  return url.match(/video\/(\d+)/)?.[1] ?? null
}

// Las métricas guardan la miniatura de cada video de TikTok. Se lee con
// service role porque esa tabla es solo de administradores; aquí no sale nada
// más que la URL de la imagen.
async function miniaturasTikTok(): Promise<Map<string, string>> {
  const mapa = new Map<string, string>()
  try {
    const { data } = await createAdminClient()
      .from('social_videos')
      .select('url,external_id,thumbnail_url')
      .eq('platform', 'tiktok')
      .not('thumbnail_url', 'is', null)
    for (const fila of (data ?? []) as { url: string; external_id: string; thumbnail_url: string }[]) {
      if (miniaturaCaducada(fila.thumbnail_url)) continue
      mapa.set(fila.url, fila.thumbnail_url)
      mapa.set(fila.external_id, fila.thumbnail_url)
    }
  } catch {
    /* tabla ausente: sin miniaturas */
  }
  return mapa
}

async function construirListaVideos(): Promise<ListaVideos> {
  const [{ data: filas }, redes, miniaturas] = await Promise.all([
    createAnonClient().from('videos').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    getVideoVisibility(),
    miniaturasTikTok(),
  ])

  const videos: VideoResumen[] = []
  for (const v of (filas ?? []) as Video[]) {
    const plataforma = effectivePlatform(v)
    if ((plataforma === 'instagram' || plataforma === 'facebook' || plataforma === 'tiktok') && !redes[plataforma]) continue
    videos.push({
      id: v.id,
      titulo: v.title ?? '',
      url: v.url,
      plataforma,
      embedUrl: getEmbedUrl(v),
      miniatura: miniaturas.get(v.url) ?? miniaturas.get(idTikTok(v.url) ?? '') ?? null,
      publicadoEn: v.created_at,
    })
  }
  return { generadoEn: new Date().toISOString(), redes, videos }
}

export const listaVideosCacheada = unstable_cache(construirListaVideos, ['app-videos-v1'], {
  revalidate: 300,
  tags: [TAG_VIDEOS],
})

/** Solo las tres redes, para el bloque Historias de la portada. */
export async function historiasPortada(): Promise<Pick<ListaVideos, 'redes' | 'videos'>> {
  const lista = await construirListaVideos()
  return {
    redes: lista.redes,
    videos: lista.videos.filter((v) => v.plataforma === 'instagram' || v.plataforma === 'facebook' || v.plataforma === 'tiktok'),
  }
}
