import { TIKTOK_HANDLE, type SocialVideoStats } from './accounts'

// Lectura de métricas de TikTok a través de los endpoints públicos de embed
// (los mismos que usa el reproductor incrustado del sitio). No requieren
// llave, cuenta de desarrollador ni aprobación, y por eso el sistema es
// gratuito y autónomo.
//
//   /embed/@usuario   → los 10 videos más recientes del perfil (descubrimiento)
//   /embed/v2/<id>    → vistas, likes, comentarios y compartidos de un video
//
// Ambas páginas traen los datos en un <script id="__FRONTITY_CONNECT_STATE__">.

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const TIMEOUT_MS = 12_000

type FrontityState = {
  source?: { data?: Record<string, unknown> }
}

type EmbedVideo = {
  id?: string
  desc?: string
  playCount?: number
  coverUrl?: string
  privateItem?: boolean
}

type ItemInfos = {
  id?: string
  text?: string
  createTime?: string
  covers?: string[]
  playCount?: number
  diggCount?: number
  commentCount?: number
  shareCount?: number
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'es-419,es;q=0.9' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

/** Extrae el JSON de estado que TikTok incrusta en la página de embed. */
function parseState(html: string): FrontityState | null {
  const match = html.match(
    /<script[^>]*id="__FRONTITY_CONNECT_STATE__"[^>]*>([\s\S]*?)<\/script>/
  )
  if (!match) return null
  try {
    return JSON.parse(match[1]) as FrontityState
  } catch {
    return null
  }
}

function toNumber(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0
}

/** URL canónica de un video, la misma forma que ya se guarda en la tabla `videos`. */
export function tiktokVideoUrl(externalId: string, handle = TIKTOK_HANDLE): string {
  return `https://www.tiktok.com/@${handle}/video/${externalId}`
}

/** Saca el id numérico de cualquier URL de TikTok guardada en la base. */
export function tiktokIdFromUrl(url: string): string | null {
  return url.match(/\/video\/(\d{15,25})/)?.[1] ?? url.match(/\/(\d{15,25})/)?.[1] ?? null
}

/**
 * Videos más recientes del perfil (hasta 10, es el tope del endpoint).
 * Como se publica alrededor de un video al día y la sincronización corre
 * a diario, esa ventana es holgada para no perder ninguno.
 */
export async function fetchRecentVideos(
  handle = TIKTOK_HANDLE
): Promise<{ id: string; title: string; views: number; thumbnailUrl: string | null }[]> {
  const html = await fetchHtml(`https://www.tiktok.com/embed/@${handle}`)
  if (!html) return []

  const state = parseState(html)
  const bucket = state?.source?.data?.[`/embed/@${handle}`] as
    | { videoList?: EmbedVideo[] }
    | undefined

  const list = Array.isArray(bucket?.videoList) ? bucket.videoList : []
  return list
    .filter((v) => v?.id && !v.privateItem)
    .map((v) => ({
      id: String(v.id),
      title: (v.desc ?? '').trim(),
      views: toNumber(v.playCount),
      thumbnailUrl: v.coverUrl ?? null,
    }))
}

/** Métricas completas de un video puntual. `null` si TikTok no respondió. */
export async function fetchVideoStats(
  externalId: string,
  handle = TIKTOK_HANDLE
): Promise<SocialVideoStats | null> {
  const html = await fetchHtml(`https://www.tiktok.com/embed/v2/${externalId}`)
  if (!html) return null

  const state = parseState(html)
  const bucket = state?.source?.data?.[`/embed/v2/${externalId}`] as
    | { videoData?: { itemInfos?: ItemInfos } }
    | undefined

  const item = bucket?.videoData?.itemInfos
  if (!item?.id) return null

  const createTime = toNumber(item.createTime)

  return {
    platform: 'tiktok',
    externalId: String(item.id),
    url: tiktokVideoUrl(String(item.id), handle),
    title: (item.text ?? '').trim(),
    thumbnailUrl: item.covers?.[0] ?? null,
    publishedAt: createTime > 0 ? new Date(createTime * 1000).toISOString() : null,
    views: toNumber(item.playCount),
    likes: toNumber(item.diggCount),
    comments: toNumber(item.commentCount),
    shares: toNumber(item.shareCount),
  }
}

/**
 * Métricas de varios videos con concurrencia limitada: TikTok responde en
 * ~0,5 s por video y no conviene abrir 40 conexiones de golpe.
 */
export async function fetchManyVideoStats(
  ids: string[],
  handle = TIKTOK_HANDLE,
  concurrency = 4
): Promise<SocialVideoStats[]> {
  const pending = [...ids]
  const results: SocialVideoStats[] = []

  async function worker() {
    for (let id = pending.shift(); id; id = pending.shift()) {
      const stats = await fetchVideoStats(id, handle)
      if (stats) results.push(stats)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, pending.length) }, worker)
  )
  return results
}
