import { createAdminClient } from '@/lib/supabase/admin'
import type { Ad } from '@/lib/ads'

// Lecturas para el panel (service role). Las páginas que las usan ya verifican
// que el usuario sea admin antes de llamarlas.

export async function getAllAds(): Promise<Ad[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('ad_submissions')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { console.error('[getAllAds]', error.message); return [] }
    return (data ?? []) as Ad[]
  } catch (e) {
    console.error('[getAllAds]', e)
    return []
  }
}

export type AdminSubscription = {
  id: string
  created_at: string
  user_id: string | null
  email: string | null
  plan: string
  source: string
  start_date: string | null
  end_date: string | null
  status: string
}

export async function getAllSubscriptions(): Promise<AdminSubscription[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { console.error('[getAllSubscriptions]', error.message); return [] }
    return (data ?? []) as AdminSubscription[]
  } catch (e) {
    console.error('[getAllSubscriptions]', e)
    return []
  }
}
