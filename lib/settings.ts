import { createAdminClient } from '@/lib/supabase/admin'

// IMPORTANTE: este módulo SOLO se usa en el servidor. Lee la configuración con
// service role. Las llaves privadas/secretos NUNCA deben enviarse al cliente.

export type SiteSettings = {
  gateway_public_key: string | null
  gateway_private_key: string | null
  gateway_events_secret: string | null
  gateway_integrity_secret: string | null
  ad_max_image_mb: number
  ad_max_video_mb: number
}

const DEFAULTS: SiteSettings = {
  gateway_public_key: null,
  gateway_private_key: null,
  gateway_events_secret: null,
  gateway_integrity_secret: null,
  ad_max_image_mb: 5,
  ad_max_video_mb: 50,
}

export async function getSettings(): Promise<SiteSettings> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single()
    if (error || !data) return DEFAULTS
    return {
      gateway_public_key: data.gateway_public_key ?? null,
      gateway_private_key: data.gateway_private_key ?? null,
      gateway_events_secret: data.gateway_events_secret ?? null,
      gateway_integrity_secret: data.gateway_integrity_secret ?? null,
      ad_max_image_mb: data.ad_max_image_mb ?? DEFAULTS.ad_max_image_mb,
      ad_max_video_mb: data.ad_max_video_mb ?? DEFAULTS.ad_max_video_mb,
    }
  } catch {
    return DEFAULTS
  }
}

// Versión segura para el cliente: solo expone la llave pública y los límites.
export type PublicSettings = {
  gatewayPublicKey: string | null
  adMaxImageMb: number
  adMaxVideoMb: number
  gatewayConfigured: boolean
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const s = await getSettings()
  return {
    gatewayPublicKey: s.gateway_public_key,
    adMaxImageMb: s.ad_max_image_mb,
    adMaxVideoMb: s.ad_max_video_mb,
    gatewayConfigured: !!(s.gateway_public_key && s.gateway_integrity_secret),
  }
}
