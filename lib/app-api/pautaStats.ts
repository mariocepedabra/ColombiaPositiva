import { createAdminClient } from '@/lib/supabase/admin'

// Impresiones y clics de cada anuncio (app móvil), para el panel de pautas.
// Lee la vista ad_stats_totals de la migración 2026-09-21_pauta_estadisticas.
// Si la migración no se ha ejecutado, devuelve un mapa vacío y el panel
// simplemente no muestra cifras.

export type AdStats = {
  impresiones: number
  clics: number
  impresiones7d: number
  clics7d: number
  ultimoDia: string | null
}

export async function getAdStats(): Promise<Record<string, AdStats>> {
  const porAnuncio: Record<string, AdStats> = {}
  try {
    const { data, error } = await createAdminClient().from('ad_stats_totals').select('*')
    if (error || !data) return porAnuncio
    for (const fila of data as {
      ad_id: string
      impressions: number
      clicks: number
      impressions_7d: number | null
      clicks_7d: number | null
      last_day: string | null
    }[]) {
      porAnuncio[fila.ad_id] = {
        impresiones: Number(fila.impressions) || 0,
        clics: Number(fila.clicks) || 0,
        impresiones7d: Number(fila.impressions_7d) || 0,
        clics7d: Number(fila.clicks_7d) || 0,
        ultimoDia: fila.last_day,
      }
    }
  } catch {
    /* sin vista todavía */
  }
  return porAnuncio
}
