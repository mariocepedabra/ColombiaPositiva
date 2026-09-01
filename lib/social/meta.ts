import { FACEBOOK_PAGE_ID, type SocialVideoStats } from './accounts'

// Instagram y Facebook a través de la API oficial de Meta (Graph API).
//
// Es GRATUITA y sin límite para las cuentas propias, pero exige un token:
// Meta cerró por completo el acceso público a los contadores (comprobado:
// la página de embed de Instagram ya no expone ni likes ni vistas), así que
// no existe alternativa sin token que sea estable.
//
// Configuración (una sola vez, en las variables de entorno de Vercel):
//   META_ACCESS_TOKEN      → token de página de larga duración
//   INSTAGRAM_BUSINESS_ID  → id de la cuenta de Instagram Business
//   FACEBOOK_PAGE_ID       → id de la página de Facebook
//
// Mientras no existan, estas funciones devuelven una lista vacía y el panel
// muestra esas dos redes como "pendientes de conectar". Nada se rompe.

const API_VERSION = process.env.META_API_VERSION || 'v21.0'
const TIMEOUT_MS = 12_000

export function hasMetaCredentials(): boolean {
  return Boolean(process.env.META_ACCESS_TOKEN)
}

export function hasInstagramCredentials(): boolean {
  return hasMetaCredentials() && Boolean(process.env.INSTAGRAM_BUSINESS_ID)
}

export function hasFacebookCredentials(): boolean {
  return hasMetaCredentials() && Boolean(FACEBOOK_PAGE_ID)
}

type GraphResponse<T> = { data?: T[]; error?: { message?: string } }

async function graph<T>(path: string, params: Record<string, string>): Promise<T[] | null> {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return null

  const qs = new URLSearchParams({ ...params, access_token: token })
  try {
    const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${path}?${qs}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })
    const json = (await res.json()) as GraphResponse<T>
    if (!res.ok || json.error) {
      console.error('[meta] Graph API:', json.error?.message ?? res.status)
      return null
    }
    return json.data ?? []
  } catch (err) {
    console.error('[meta] Graph API sin respuesta:', err)
    return null
  }
}

function toNumber(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0
}

// ── Instagram ──────────────────────────────────────────────────────

type IgMedia = {
  id: string
  caption?: string
  media_type?: string
  permalink?: string
  thumbnail_url?: string
  media_url?: string
  timestamp?: string
  like_count?: number
  comments_count?: number
  insights?: { data?: { name: string; values?: { value?: number }[] }[] }
}

/** Lee la métrica que Meta haya devuelto, probando los nombres conocidos. */
function insightValue(media: IgMedia, names: string[]): number {
  const rows = media.insights?.data ?? []
  for (const name of names) {
    const row = rows.find((r) => r.name === name)
    const value = row?.values?.[0]?.value
    if (typeof value === 'number') return Math.trunc(value)
  }
  return 0
}

export async function fetchInstagramVideos(limit = 50): Promise<SocialVideoStats[]> {
  const igId = process.env.INSTAGRAM_BUSINESS_ID
  if (!igId || !hasMetaCredentials()) return []

  // `insights.metric(...)` va anidado para resolverlo en una sola llamada.
  // Meta renombró "plays"/"video_views" a "views"; se piden los tres y se
  // usa el primero que exista, para que un cambio de versión no lo apague.
  const media = await graph<IgMedia>(`${igId}/media`, {
    fields:
      'id,caption,media_type,permalink,thumbnail_url,media_url,timestamp,' +
      'like_count,comments_count,insights.metric(views,reach,shares)',
    limit: String(limit),
  })
  if (!media) return []

  return media
    .filter((m) => m.media_type === 'VIDEO' || m.media_type === 'REELS')
    .map((m) => ({
      platform: 'instagram' as const,
      externalId: m.id,
      url: m.permalink ?? `https://www.instagram.com/p/${m.id}/`,
      title: (m.caption ?? '').split('\n')[0].slice(0, 200).trim(),
      thumbnailUrl: m.thumbnail_url ?? m.media_url ?? null,
      publishedAt: m.timestamp ?? null,
      views: insightValue(m, ['views', 'plays', 'video_views', 'reach']),
      likes: toNumber(m.like_count),
      comments: toNumber(m.comments_count),
      shares: insightValue(m, ['shares']),
    }))
}

// ── Facebook ───────────────────────────────────────────────────────

type FbVideo = {
  id: string
  title?: string
  description?: string
  created_time?: string
  permalink_url?: string
  picture?: string
  likes?: { summary?: { total_count?: number } }
  comments?: { summary?: { total_count?: number } }
  video_insights?: { data?: { name: string; values?: { value?: number }[] }[] }
}

function fbInsight(video: FbVideo, names: string[]): number {
  const rows = video.video_insights?.data ?? []
  for (const name of names) {
    const row = rows.find((r) => r.name === name)
    const value = row?.values?.[0]?.value
    if (typeof value === 'number') return Math.trunc(value)
  }
  return 0
}

export async function fetchFacebookVideos(limit = 50): Promise<SocialVideoStats[]> {
  if (!hasFacebookCredentials()) return []

  const videos = await graph<FbVideo>(`${FACEBOOK_PAGE_ID}/videos`, {
    fields:
      'id,title,description,created_time,permalink_url,picture,' +
      'likes.summary(true),comments.summary(true),' +
      'video_insights.metric(total_video_views,total_video_impressions)',
    limit: String(limit),
  })
  if (!videos) return []

  return videos.map((v) => ({
    platform: 'facebook' as const,
    externalId: v.id,
    url: v.permalink_url
      ? `https://www.facebook.com${v.permalink_url}`
      : `https://www.facebook.com/${v.id}`,
    title: (v.title || v.description || '').split('\n')[0].slice(0, 200).trim(),
    thumbnailUrl: v.picture ?? null,
    publishedAt: v.created_time ?? null,
    views: fbInsight(v, ['total_video_views', 'total_video_impressions']),
    likes: toNumber(v.likes?.summary?.total_count),
    comments: toNumber(v.comments?.summary?.total_count),
    shares: 0, // La API de páginas no expone compartidos por video.
  }))
}
