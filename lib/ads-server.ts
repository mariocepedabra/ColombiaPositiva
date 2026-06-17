import { createClient } from '@/lib/supabase/server'
import type { Ad, AdZoneSlug } from '@/lib/ads'

// Server-only. Anuncios activos y vigentes para una zona (render público).
export async function getActiveAdsByZone(zone: AdZoneSlug): Promise<Ad[]> {
  const supabase = await createClient()
  const nowIso = new Date().toISOString()
  const { data } = await supabase
    .from('ad_submissions')
    .select('*')
    .eq('status', 'activo')
    .contains('zones', [zone])
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  return ((data ?? []) as Ad[]).filter((ad) => {
    const startOk = !ad.start_date || ad.start_date <= nowIso
    const endOk = !ad.end_date || ad.end_date >= nowIso
    return startOk && endOk
  })
}
