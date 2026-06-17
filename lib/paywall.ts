import { createClient } from '@/lib/supabase/server'

// Server-only. ¿El usuario autenticado puede copiar el texto?
// (admin / Mario, o suscripción activa)
export async function canUserCopy(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: rpcData } = await supabase.rpc('get_my_profile')
    if (Array.isArray(rpcData) && rpcData.length > 0) {
      const profile = rpcData[0] as { role: string; full_name: string }
      if (profile.role === 'admin' || profile.full_name?.toLowerCase().includes('mario')) {
        return true
      }
    }

    const { data: hasSub } = await supabase.rpc('has_active_subscription')
    return hasSub === true
  } catch {
    return false
  }
}
