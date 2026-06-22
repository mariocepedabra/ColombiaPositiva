import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllSubscriptions, getUserDirectory } from '@/lib/admin-data'
import SuscriptoresManager from '@/components/admin/SuscriptoresManager'

export const dynamic = 'force-dynamic'

export default async function SuscriptoresPage() {
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

  const [subscriptions, directory] = await Promise.all([
    getAllSubscriptions(),
    getUserDirectory(),
  ])

  // Mapa id → nombre para mostrar el nombre del suscriptor
  const names: Record<string, string> = {}
  for (const [id, entry] of directory) names[id] = entry.name

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-700 text-2xl text-tinta">Suscriptores</h1>
        <p className="font-sans text-sm text-gris-600 mt-0.5">
          {subscriptions.length} suscripciones · permiten copiar el texto de las notas
        </p>
      </div>
      <SuscriptoresManager subscriptions={subscriptions} names={names} />
    </div>
  )
}
