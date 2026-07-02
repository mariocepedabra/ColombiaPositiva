import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllAds } from '@/lib/admin-data'
import PautasManager from '@/components/admin/PautasManager'
import AdPriceEditor from '@/components/admin/AdPriceEditor'
import { getPricing } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

export default async function PautasPage() {
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

  const [ads, pricing] = await Promise.all([getAllAds(), getPricing()])

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-700 text-2xl text-tinta">Pautas publicitarias</h1>
        <p className="font-sans text-sm text-gris-600 mt-0.5">{ads.length} solicitudes de anuncio</p>
      </div>
      <AdPriceEditor initialPerDay={pricing.adPerDay} />
      <PautasManager ads={ads} />
    </div>
  )
}
