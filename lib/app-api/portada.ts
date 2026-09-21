import { unstable_cache } from 'next/cache'

import type { Ad } from '@/lib/ads'
import { categories, breakingNewsFallback } from '@/lib/data'
import { SITE_URL } from '@/lib/site'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAnonClient } from '@/lib/supabase/anon'
import { getVideoVisibility } from '@/lib/video-visibility'
import { effectivePlatform, getEmbedUrl, type Video } from '@/lib/videos'
import { VERSION_CONTRATO, type Anuncio, type BloqueSeccion, type NotaResumen, type Portada, type SlugSeccion, type VideoResumen } from './contratos'
import { aNotaResumen, CAMPOS_RESUMEN, type FilaResumen } from './notas'

// Construye la portada completa de la app en UNA sola respuesta. Replica el
// orden y los datos de app/page.tsx: ticker, principales, más leídas,
// secciones (4 notas cada una), historias (videos) y pauta por zona.

export const TAG_PORTADA = 'app-home'
const SEGUNDOS_CACHE = 60

const REDES_SOCIALES: Portada['redesSociales'] = [
  { red: 'facebook', url: 'https://www.facebook.com/profile.php?id=100066399406261' },
  { red: 'instagram', url: 'https://www.instagram.com/colombiapositiva10/' },
  { red: 'tiktok', url: 'https://www.tiktok.com/@colombia.positiva' },
]

const ENLACES: Portada['enlaces'] = {
  sitio: SITE_URL,
  suscripcion: `${SITE_URL}/suscripcion`,
  pauta: `${SITE_URL}/pauta`,
  notaPositiva: `${SITE_URL}/nota-positiva`,
  contacto: `${SITE_URL}/contacto`,
  privacidad: `${SITE_URL}/privacidad`,
}

type FilaVideo = Video

// ---- Consultas ----

async function notasRecientes(limite: number): Promise<NotaResumen[]> {
  const { data } = await createAnonClient()
    .from('articles')
    .select(CAMPOS_RESUMEN)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(limite)
  return ((data ?? []) as FilaResumen[]).map(aNotaResumen)
}

async function notasPorSeccion(slug: string, limite: number): Promise<NotaResumen[]> {
  const { data } = await createAnonClient()
    .from('articles')
    .select(CAMPOS_RESUMEN)
    .eq('is_published', true)
    .eq('category_slug', slug)
    .order('published_at', { ascending: false })
    .limit(limite)
  return ((data ?? []) as FilaResumen[]).map(aNotaResumen)
}

// Más leídas de la semana (vistas diarias). Si la migración aún no se corrió
// o todavía no hay datos, cae al contador acumulado, que es lo que muestra la
// web hoy.
async function masLeidas(limite: number): Promise<Portada['masLeidas']> {
  const supabase = createAnonClient()
  try {
    const { data, error } = await supabase.rpc('top_articles_week', { result_limit: limite })
    if (!error && Array.isArray(data) && data.length >= 3) {
      return { periodo: 'semana', notas: (data as FilaResumen[]).map(aNotaResumen) }
    }
  } catch {
    /* sin función todavía */
  }
  const { data } = await supabase
    .from('articles')
    .select(CAMPOS_RESUMEN)
    .eq('is_published', true)
    .order('view_count', { ascending: false, nullsFirst: false })
    .order('published_at', { ascending: false })
    .limit(limite)
  return { periodo: 'historico', notas: ((data ?? []) as FilaResumen[]).map(aNotaResumen) }
}

// Todos los anuncios activos y vigentes, agrupados por zona (una sola consulta
// en lugar de una por zona como hace la web).
async function pautaPorZona(): Promise<Record<string, Anuncio[]>> {
  const ahora = new Date().toISOString()
  const { data } = await createAnonClient()
    .from('ad_submissions')
    .select('id,advertiser_name,company,target_url,media_type,media_url,start_date,end_date,zones,sort_order,created_at')
    .eq('status', 'activo')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  const porZona: Record<string, Anuncio[]> = {}
  for (const ad of (data ?? []) as Ad[]) {
    const vigente = (!ad.start_date || ad.start_date <= ahora) && (!ad.end_date || ad.end_date >= ahora)
    if (!vigente || !ad.media_url) continue
    const anuncio: Anuncio = {
      id: ad.id,
      tipo: ad.media_type === 'video' ? 'video' : 'imagen',
      media: ad.media_url,
      enlace: ad.target_url?.trim() || null,
      anunciante: ad.advertiser_name,
      empresa: ad.company,
    }
    for (const zona of ad.zones ?? []) {
      ;(porZona[zona] ??= []).push(anuncio)
    }
  }
  return porZona
}

async function historias(): Promise<Portada['historias']> {
  const [{ data: filas }, redes, miniaturas] = await Promise.all([
    createAnonClient().from('videos').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    getVideoVisibility(),
    miniaturasTikTok(),
  ])

  const videos: VideoResumen[] = []
  for (const v of (filas ?? []) as FilaVideo[]) {
    const plataforma = effectivePlatform(v)
    // En la portada solo van las tres redes (como en la web).
    if (plataforma !== 'instagram' && plataforma !== 'facebook' && plataforma !== 'tiktok') continue
    if (!redes[plataforma]) continue
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
  return { redes, videos }
}

function idTikTok(url: string): string | null {
  return url.match(/video\/(\d+)/)?.[1] ?? null
}

// Margen de una hora: si caduca dentro de poco, tampoco sirve (la portada
// se cachea y el teléfono puede abrirla más tarde).
function miniaturaCaducada(url: string): boolean {
  const expira = Number(url.match(/[?&]x-expires=(\d+)/)?.[1])
  if (!Number.isFinite(expira)) return false
  return expira * 1000 < Date.now() + 60 * 60 * 1000
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
      // Las miniaturas de TikTok van firmadas y caducan (x-expires). Una
      // caducada responde 403: mejor no mandarla y que la app pinte su
      // tarjeta de respaldo. Se renuevan con la sincronización diaria.
      if (miniaturaCaducada(fila.thumbnail_url)) continue
      mapa.set(fila.url, fila.thumbnail_url)
      mapa.set(fila.external_id, fila.thumbnail_url)
    }
  } catch {
    /* tabla ausente: sin miniaturas */
  }
  return mapa
}

// ---- Portada ----

export async function construirPortada(): Promise<Portada> {
  const [principales, leidas, porSeccion, pauta, hist] = await Promise.all([
    notasRecientes(10),
    masLeidas(10),
    Promise.all(categories.map((c) => notasPorSeccion(c.slug, 4))),
    pautaPorZona(),
    historias(),
  ])

  const ticker =
    principales.length > 0
      ? principales.slice(0, 5).map((n) => ({ titulo: n.titulo, slug: n.slug }))
      : breakingNewsFallback.map((titulo) => ({ titulo, slug: null }))

  const secciones: BloqueSeccion[] = categories
    .map((c, i) => ({ slug: c.slug as SlugSeccion, nombre: c.name, color: c.color, notas: porSeccion[i] ?? [] }))
    .filter((s) => s.notas.length > 0)

  return {
    version: VERSION_CONTRATO,
    generadoEn: new Date().toISOString(),
    ticker,
    principales,
    masLeidas: leidas,
    secciones,
    historias: hist,
    pauta,
    redesSociales: REDES_SOCIALES,
    enlaces: ENLACES,
  }
}

// Versión cacheada: un minuto, igual que el `revalidate` de la portada web.
// Miles de teléfonos abriendo la app a la vez leen esto, no la base de datos.
export const portadaCacheada = unstable_cache(construirPortada, ['app-home-v1'], {
  revalidate: SEGUNDOS_CACHE,
  tags: [TAG_PORTADA],
})

// Para `?fresh=1` (tirar para refrescar): salta la caché, pero si varios
// teléfonos refrescan en la misma ventana comparten UNA construcción.
const VENTANA_FRESCA_MS = 5_000
let construccionFresca: { en: number; promesa: Promise<Portada> } | null = null

export function portadaFresca(): Promise<Portada> {
  const ahora = Date.now()
  if (construccionFresca && ahora - construccionFresca.en < VENTANA_FRESCA_MS) {
    return construccionFresca.promesa
  }
  const promesa = construirPortada()
  construccionFresca = { en: ahora, promesa }
  promesa.catch(() => {
    construccionFresca = null
  })
  return promesa
}
