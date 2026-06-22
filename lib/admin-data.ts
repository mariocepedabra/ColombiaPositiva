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

// IDs de usuarios con una suscripción activa y vigente (pueden copiar el texto).
export async function getActiveSubscriberIds(): Promise<Set<string>> {
  const set = new Set<string>()
  try {
    const supabase = createAdminClient()
    const nowIso = new Date().toISOString()
    const { data } = await supabase
      .from('subscriptions')
      .select('user_id,status,end_date')
      .eq('status', 'activa')
    for (const s of (data ?? []) as { user_id: string | null; end_date: string | null }[]) {
      if (s.user_id && (!s.end_date || s.end_date >= nowIso)) set.add(s.user_id)
    }
  } catch (e) {
    console.error('[getActiveSubscriberIds]', e)
  }
  return set
}

// Mapa id → correo electrónico (desde auth.users).
export async function getUserEmails(): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  try {
    const supabase = createAdminClient()
    const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    for (const u of data?.users ?? []) {
      if (u.email) map.set(u.id, u.email)
    }
  } catch (e) {
    console.error('[getUserEmails]', e)
  }
  return map
}

export type DirectoryEntry = { id: string; email: string; name: string }

// Directorio completo de usuarios (id → correo + nombre) desde auth.users.
export async function getUserDirectory(): Promise<Map<string, DirectoryEntry>> {
  const map = new Map<string, DirectoryEntry>()
  try {
    const supabase = createAdminClient()
    const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    for (const u of data?.users ?? []) {
      const name = (u.user_metadata as Record<string, string> | null)?.full_name || ''
      map.set(u.id, { id: u.id, email: u.email ?? '', name })
    }
  } catch (e) {
    console.error('[getUserDirectory]', e)
  }
  return map
}

// Busca un usuario por correo. null si no existe.
export async function findUserByEmail(email: string): Promise<{ id: string; name: string } | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const target = email.trim().toLowerCase()
    const found = data?.users.find((u) => u.email?.toLowerCase() === target)
    if (!found) return null
    const name = (found.user_metadata as Record<string, string> | null)?.full_name || ''
    return { id: found.id, name }
  } catch (e) {
    console.error('[findUserByEmail]', e)
    return null
  }
}
