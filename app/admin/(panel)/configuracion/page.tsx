import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSettings } from '@/lib/settings'
import ConfiguracionForm from '@/components/admin/ConfiguracionForm'

export const dynamic = 'force-dynamic'

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let myRole = (user?.app_metadata as Record<string, string>)?.role ?? 'lector'
  try {
    const { data: rpcData } = await supabase.rpc('get_my_profile')
    if (Array.isArray(rpcData) && rpcData.length > 0) {
      myRole = (rpcData[0] as { role: string }).role || myRole
    }
  } catch { /* usar app_metadata */ }

  if (myRole !== 'admin') redirect('/admin')

  const settings = await getSettings()

  // No enviamos las llaves completas al cliente; solo indicamos si ya están cargadas.
  const status = {
    publicKeySet: !!settings.gateway_public_key,
    privateKeySet: !!settings.gateway_private_key,
    eventsSecretSet: !!settings.gateway_events_secret,
    integritySecretSet: !!settings.gateway_integrity_secret,
    adMaxImageMb: settings.ad_max_image_mb,
    adMaxVideoMb: settings.ad_max_video_mb,
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-700 text-2xl text-tinta">Configuración</h1>
        <p className="font-sans text-sm text-gris-600 mt-0.5">Pasarela de pagos y límites de archivos para pautas</p>
      </div>
      <ConfiguracionForm status={status} />
    </div>
  )
}
