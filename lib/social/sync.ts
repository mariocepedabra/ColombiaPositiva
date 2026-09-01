import { createAdminClient } from '@/lib/supabase/admin'
import { TIKTOK_HANDLE, type SocialVideoStats } from './accounts'
import {
  fetchRecentVideos,
  fetchManyVideoStats,
  tiktokIdFromUrl,
  tiktokVideoUrl,
} from './tiktok'
import {
  fetchInstagramVideos,
  fetchFacebookVideos,
  hasInstagramCredentials,
  hasFacebookCredentials,
} from './meta'

// Sincronización diaria: descubre los videos nuevos de TikTok, los publica en
// "Historias de Colombia Positiva" y refresca las métricas de las tres redes.
//
// Reglas de seguridad que sigue todo este archivo:
//  · Nunca borra ni desactiva nada. Solo inserta lo que falta y actualiza cifras.
//  · Si una red falla, las demás continúan y se conservan las métricas previas.
//  · Si la migración SQL no se ha ejecutado, se reporta el error sin romper la web.

export type SyncReport = {
  ok: boolean
  imported: number
  updated: number
  platforms: Record<string, { encontrados: number; importados?: number; error?: string }>
  errors: string[]
  durationMs: number
}

/**
 * Convierte la descripción de TikTok en un título corto.
 * Las notas ya cargadas usan solo el nombre de la persona ("Olmer Alier"),
 * y las descripciones siguen el patrón "<Nombre>, Orgullo Colombiano...",
 * así que se corta en la primera coma para mantener el mismo estilo.
 */
export function cleanTitle(desc: string): string {
  const sinHashtags = desc.replace(/#[\p{L}\p{N}_]+/gu, ' ').replace(/\s+/g, ' ').trim()
  if (!sinHashtags) return ''
  const antesDeComa = sinHashtags.split(',')[0].trim()
  if (antesDeComa.length > 2 && antesDeComa.length <= 60) return antesDeComa
  return sinHashtags.slice(0, 120).trim()
}

type AdminClient = ReturnType<typeof createAdminClient>

/** Videos de TikTok que ya están publicados en la web, indexados por id de TikTok. */
async function readSiteTikTokIds(admin: AdminClient): Promise<Set<string>> {
  const { data, error } = await admin.from('videos').select('url').limit(2000)
  if (error) throw new Error(`No se pudo leer la tabla videos: ${error.message}`)

  const ids = new Set<string>()
  for (const row of data ?? []) {
    const url = (row as { url: string }).url
    if (!url.includes('tiktok.com')) continue
    const id = tiktokIdFromUrl(url)
    if (id) ids.add(id)
  }
  return ids
}

/** Inserta en `videos` los descubiertos que aún no estaban. Devuelve cuántos entraron. */
async function importNewTikTokVideos(
  admin: AdminClient,
  nuevos: { id: string; title: string; publishedAt: string | null }[]
): Promise<number> {
  let importados = 0

  for (const video of nuevos) {
    const fila = {
      url: tiktokVideoUrl(video.id, TIKTOK_HANDLE),
      title: cleanTitle(video.title),
      platform: 'tiktok',
      is_active: true,
      // La portada ordena por created_at, así que se usa la fecha real de
      // publicación en TikTok y el carrusel queda en orden cronológico.
      ...(video.publishedAt ? { created_at: video.publishedAt } : {}),
    }

    const { error } = await admin.from('videos').insert(fila)
    if (!error) {
      importados++
      continue
    }

    // 23505 = ya existía (carrera con una carga manual): no es un fallo.
    if (error.code === '23505') continue

    // 23514 = el CHECK antiguo de `platform` no acepta el valor; se guarda
    // como 'direct' igual que hace /api/videos, porque la portada clasifica
    // por URL y el video queda en la división correcta de todos modos.
    if (error.code === '23514') {
      const { error: e2 } = await admin.from('videos').insert({ ...fila, platform: 'direct' })
      if (!e2) importados++
      continue
    }

    console.error('[sync] no se pudo insertar el video', video.id, error.message)
  }

  return importados
}

/** Guarda las métricas actuales y deja una foto del día para ver la evolución. */
async function saveMetrics(
  admin: AdminClient,
  stats: SocialVideoStats[],
  enLaWeb: Set<string>
): Promise<number> {
  if (stats.length === 0) return 0

  const ahora = new Date().toISOString()
  const filas = stats.map((s) => ({
    platform: s.platform,
    external_id: s.externalId,
    url: s.url,
    title: s.title,
    thumbnail_url: s.thumbnailUrl,
    published_at: s.publishedAt,
    views: s.views,
    likes: s.likes,
    comments: s.comments,
    shares: s.shares,
    on_site: s.platform === 'tiktok' ? enLaWeb.has(s.externalId) : false,
    last_synced_at: ahora,
  }))

  const { error } = await admin
    .from('social_videos')
    .upsert(filas, { onConflict: 'platform,external_id' })
  if (error) throw new Error(`No se pudieron guardar las métricas: ${error.message}`)

  // Foto diaria (fecha de Colombia) para la comparación "vs. ayer".
  const dia = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
  const historico = stats.map((s) => ({
    platform: s.platform,
    external_id: s.externalId,
    day: dia,
    views: s.views,
    likes: s.likes,
    comments: s.comments,
    shares: s.shares,
  }))

  const { error: errorHistorico } = await admin
    .from('social_video_daily')
    .upsert(historico, { onConflict: 'platform,external_id,day' })
  if (errorHistorico) {
    // El histórico es un extra: si falla, las métricas del día ya quedaron.
    console.error('[sync] histórico diario:', errorHistorico.message)
  }

  return filas.length
}

export async function runSocialSync(): Promise<SyncReport> {
  const inicio = Date.now()
  const admin = createAdminClient()
  const report: SyncReport = {
    ok: false,
    imported: 0,
    updated: 0,
    platforms: {},
    errors: [],
    durationMs: 0,
  }

  // Bitácora: se abre el registro para poder mostrar en el panel cuándo corrió.
  let runId: number | null = null
  const { data: runRow } = await admin
    .from('social_sync_runs')
    .insert({ started_at: new Date().toISOString() })
    .select('id')
    .single()
  if (runRow) runId = (runRow as { id: number }).id

  // ── TikTok ───────────────────────────────────────────────────────
  try {
    const enLaWeb = await readSiteTikTokIds(admin)
    const recientes = await fetchRecentVideos(TIKTOK_HANDLE)

    if (recientes.length === 0) {
      report.platforms.tiktok = {
        encontrados: 0,
        error: 'TikTok no devolvió videos en esta corrida',
      }
    } else {
      const faltantes = recientes.filter((v) => !enLaWeb.has(v.id))

      // Se piden las métricas antes de insertar para conocer la fecha real
      // de publicación y ordenar bien el carrusel de la portada.
      const idsAConsultar = [...new Set([...enLaWeb, ...recientes.map((v) => v.id)])]
      const stats = await fetchManyVideoStats(idsAConsultar, TIKTOK_HANDLE)
      const porId = new Map(stats.map((s) => [s.externalId, s]))

      const importados = await importNewTikTokVideos(
        admin,
        faltantes.map((v) => ({
          id: v.id,
          title: porId.get(v.id)?.title || v.title,
          publishedAt: porId.get(v.id)?.publishedAt ?? null,
        }))
      )

      for (const v of faltantes) enLaWeb.add(v.id)
      const guardados = await saveMetrics(admin, stats, enLaWeb)

      report.imported += importados
      report.updated += guardados
      report.platforms.tiktok = { encontrados: stats.length, importados }
    }
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'Error desconocido en TikTok'
    report.errors.push(`TikTok: ${mensaje}`)
    report.platforms.tiktok = { encontrados: 0, error: mensaje }
  }

  // ── Instagram y Facebook (API de Meta, solo si hay token) ─────────
  for (const red of [
    { key: 'instagram', activa: hasInstagramCredentials(), traer: fetchInstagramVideos },
    { key: 'facebook', activa: hasFacebookCredentials(), traer: fetchFacebookVideos },
  ] as const) {
    if (!red.activa) {
      report.platforms[red.key] = { encontrados: 0, error: 'Sin token de Meta configurado' }
      continue
    }
    try {
      const stats = await red.traer()
      const guardados = await saveMetrics(admin, stats, new Set())
      report.updated += guardados
      report.platforms[red.key] = { encontrados: stats.length }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido'
      report.errors.push(`${red.key}: ${mensaje}`)
      report.platforms[red.key] = { encontrados: 0, error: mensaje }
    }
  }

  report.ok = report.errors.length === 0
  report.durationMs = Date.now() - inicio

  if (runId !== null) {
    await admin
      .from('social_sync_runs')
      .update({
        finished_at: new Date().toISOString(),
        ok: report.ok,
        imported: report.imported,
        updated: report.updated,
        detail: { platforms: report.platforms, errors: report.errors },
      })
      .eq('id', runId)
  }

  return report
}
