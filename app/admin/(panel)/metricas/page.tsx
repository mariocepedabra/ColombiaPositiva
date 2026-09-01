import { createClient } from '@/lib/supabase/server'
import { getPanelData } from '@/lib/social/panel'
import SocialMetrics from '@/components/admin/SocialMetrics'

// Panel exclusivo del administrador: métricas de los videos en las redes.
export const dynamic = 'force-dynamic'

export default async function MetricasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <p className="p-6 font-sans text-sm text-red-600">No autorizado</p>

  // El layout ya bloquea a los lectores; aquí se exige además el rol admin,
  // porque estas cifras son solo para la dirección.
  let role = (user.app_metadata as Record<string, string> | null)?.role ?? 'lector'
  try {
    const { data } = await supabase.rpc('get_my_profile')
    if (Array.isArray(data) && data.length > 0) {
      role = (data[0] as { role: string }).role || role
    }
  } catch { /* usar app_metadata */ }

  if (role !== 'admin') {
    return (
      <div className="bg-white border border-gris-200 p-8 text-center">
        <p className="font-heading font-700 text-xl text-tinta mb-1">Sección restringida</p>
        <p className="font-sans text-sm text-gris-600">
          Las métricas de redes sociales son visibles solo para la administración.
        </p>
      </div>
    )
  }

  const data = await getPanelData()
  return <SocialMetrics data={data} />
}
