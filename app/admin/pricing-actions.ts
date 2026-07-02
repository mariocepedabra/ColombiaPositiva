'use server'

import { createClient } from '@/lib/supabase/server'
import { getPricing, setPricing, type Pricing } from '@/lib/pricing'
import { revalidatePath } from 'next/cache'

async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  let role = (user.app_metadata as Record<string, string>)?.role ?? 'lector'
  try {
    const { data: rpcData } = await supabase.rpc('get_my_profile')
    if (Array.isArray(rpcData) && rpcData.length > 0) {
      role = (rpcData[0] as { role: string }).role || role
    }
  } catch { /* usar app_metadata */ }
  return role === 'admin'
}

// Actualiza uno o varios precios y los publica en tiempo real en la página.
export async function savePricing(patch: Partial<Pricing>): Promise<{ error?: string; pricing?: Pricing }> {
  if (!await isCurrentUserAdmin()) return { error: 'Sin permisos' }

  const current = await getPricing()
  const next: Pricing = { ...current, ...patch }
  const res = await setPricing(next)
  if (res.error) return { error: res.error }

  // Publicar en las páginas públicas y en el panel
  revalidatePath('/')
  revalidatePath('/pauta')
  revalidatePath('/suscripcion')
  revalidatePath('/admin/pautas')
  revalidatePath('/admin/suscriptores')

  return { pricing: next }
}
