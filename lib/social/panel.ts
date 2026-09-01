import { createClient } from '@/lib/supabase/server'
import type { SocialPlatform } from './accounts'

// Lectura de las métricas para el panel de Mario.
// Se consulta con la sesión del propio administrador: las políticas RLS de
// `social_videos` solo dejan leer a quien tiene rol 'admin'.

export type PanelVideo = {
  platform: SocialPlatform
  external_id: string
  url: string
  title: string
  thumbnail_url: string | null
  published_at: string | null
  views: number
  likes: number
  comments: number
  shares: number
  on_site: boolean
  /** Vistas ganadas desde la última foto diaria. `null` si aún no hay con qué comparar. */
  views_delta: number | null
}

export type PanelTotals = {
  videos: number
  views: number
  likes: number
  comments: number
  shares: number
}

/** Un punto de la serie histórica: el acumulado de toda la cuenta ese día. */
export type DailyPoint = {
  day: string
  views: number
  likes: number
  comments: number
  shares: number
}

export type SyncRun = {
  started_at: string
  finished_at: string | null
  ok: boolean
  imported: number
  updated: number
}

export type PanelData = {
  /** true = falta correr la migración SQL en Supabase. */
  needsSetup: boolean
  setupMessage?: string
  videos: PanelVideo[]
  totals: Record<SocialPlatform, PanelTotals>
  global: PanelTotals
  lastRun: SyncRun | null
  /** Acumulado de la cuenta por día, para la gráfica de evolución. */
  daily: DailyPoint[]
  /** Serie de vistas por video (`plataforma:id` → puntos), para la ficha individual. */
  historyByVideo: Record<string, { day: string; views: number }[]>
}

const PLATFORMS: SocialPlatform[] = ['tiktok', 'instagram', 'facebook']
const DIAS_DE_HISTORIA = 30

function emptyTotals(): PanelTotals {
  return { videos: 0, views: 0, likes: 0, comments: 0, shares: 0 }
}

/** Códigos de Postgres que significan "la migración todavía no se ha ejecutado". */
function isMissingTable(code?: string): boolean {
  return code === '42P01' || code === '42501'
}

export async function getPanelData(): Promise<PanelData> {
  const vacio: PanelData = {
    needsSetup: false,
    videos: [],
    totals: { tiktok: emptyTotals(), instagram: emptyTotals(), facebook: emptyTotals() },
    global: emptyTotals(),
    lastRun: null,
    daily: [],
    historyByVideo: {},
  }

  const supabase = await createClient()

  const { data: filas, error } = await supabase
    .from('social_videos')
    .select(
      'platform, external_id, url, title, thumbnail_url, published_at, views, likes, comments, shares, on_site'
    )
    .order('views', { ascending: false })
    .limit(500)

  if (error) {
    if (isMissingTable(error.code)) {
      return { ...vacio, needsSetup: true, setupMessage: error.message }
    }
    console.error('[panel métricas] lectura:', error.message)
    return vacio
  }

  const videos = (filas ?? []) as Omit<PanelVideo, 'views_delta'>[]

  // Histórico de los últimos días: alimenta la gráfica de evolución, la
  // comparación "vs. ayer" y la serie de cada video en su ficha.
  const desde = new Date(Date.now() - DIAS_DE_HISTORIA * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })

  const { data: historico } = await supabase
    .from('social_video_daily')
    .select('platform, external_id, day, views, likes, comments, shares')
    .gte('day', desde)
    .order('day', { ascending: true })
    .limit(5000)

  const porDia = new Map<string, DailyPoint>()
  const historyByVideo: Record<string, { day: string; views: number }[]> = {}
  const ayerPorVideo = new Map<string, number>()

  const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', {
    timeZone: 'America/Bogota',
  })

  for (const fila of historico ?? []) {
    const f = fila as {
      platform: string
      external_id: string
      day: string
      views: number
      likes: number
      comments: number
      shares: number
    }
    const punto = porDia.get(f.day) ?? {
      day: f.day,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
    }
    punto.views += f.views
    punto.likes += f.likes
    punto.comments += f.comments
    punto.shares += f.shares
    porDia.set(f.day, punto)

    const clave = `${f.platform}:${f.external_id}`
    ;(historyByVideo[clave] ??= []).push({ day: f.day, views: f.views })
    if (f.day === ayer) ayerPorVideo.set(clave, f.views)
  }

  const { data: corridas } = await supabase
    .from('social_sync_runs')
    .select('started_at, finished_at, ok, imported, updated')
    .order('started_at', { ascending: false })
    .limit(1)

  const totals: Record<SocialPlatform, PanelTotals> = {
    tiktok: emptyTotals(),
    instagram: emptyTotals(),
    facebook: emptyTotals(),
  }
  const global = emptyTotals()

  const conDelta: PanelVideo[] = videos.map((v) => {
    const anterior = ayerPorVideo.get(`${v.platform}:${v.external_id}`)
    const acumular = (t: PanelTotals) => {
      t.videos += 1
      t.views += v.views
      t.likes += v.likes
      t.comments += v.comments
      t.shares += v.shares
    }
    if (PLATFORMS.includes(v.platform)) acumular(totals[v.platform])
    acumular(global)

    return {
      ...v,
      views_delta: typeof anterior === 'number' ? Math.max(0, v.views - anterior) : null,
    }
  })

  return {
    needsSetup: false,
    videos: conDelta,
    totals,
    global,
    lastRun: (corridas?.[0] as SyncRun | undefined) ?? null,
    daily: [...porDia.values()].sort((a, b) => a.day.localeCompare(b.day)),
    historyByVideo,
  }
}
