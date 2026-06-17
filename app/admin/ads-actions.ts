'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlan } from '@/lib/subscription'
import { revalidatePath } from 'next/cache'

// Verifica que el usuario actual sea admin. Devuelve true/false.
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

function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/admin/pautas')
}

// ---------- PAUTAS ----------

export async function approveAd(id: string, days: number): Promise<{ error?: string }> {
  if (!await isCurrentUserAdmin()) return { error: 'Sin permisos' }
  const admin = createAdminClient()
  const start = new Date()
  const end = new Date(start.getTime() + Math.max(1, days) * 24 * 60 * 60 * 1000)
  const { error } = await admin
    .from('ad_submissions')
    .update({ status: 'activo', start_date: start.toISOString(), end_date: end.toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidateAll()
  return {}
}

export async function setAdStatus(id: string, status: 'activo' | 'pausado' | 'rechazado'): Promise<{ error?: string }> {
  if (!await isCurrentUserAdmin()) return { error: 'Sin permisos' }
  const admin = createAdminClient()
  const { error } = await admin.from('ad_submissions').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  revalidateAll()
  return {}
}

export async function togglePaid(id: string, paid: boolean): Promise<{ error?: string }> {
  if (!await isCurrentUserAdmin()) return { error: 'Sin permisos' }
  const admin = createAdminClient()
  const { error } = await admin.from('ad_submissions').update({ paid }).eq('id', id)
  if (error) return { error: error.message }
  revalidateAll()
  return {}
}

export async function deleteAd(id: string): Promise<{ error?: string }> {
  if (!await isCurrentUserAdmin()) return { error: 'Sin permisos' }
  const admin = createAdminClient()
  const { error } = await admin.from('ad_submissions').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateAll()
  return {}
}

export async function setAdZones(id: string, zones: string[]): Promise<{ error?: string }> {
  if (!await isCurrentUserAdmin()) return { error: 'Sin permisos' }
  const admin = createAdminClient()
  const { error } = await admin.from('ad_submissions').update({ zones }).eq('id', id)
  if (error) return { error: error.message }
  revalidateAll()
  return {}
}

// Form action: actualiza zonas desde checkboxes (name="zones")
export async function updateAdZonesForm(formData: FormData): Promise<void> {
  const id = formData.get('ad_id') as string
  const zones = formData.getAll('zones').map(String)
  await setAdZones(id, zones)
}

// ---------- CONFIGURACIÓN ----------

export async function saveSettings(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  if (!await isCurrentUserAdmin()) return { error: 'Sin permisos' }
  const admin = createAdminClient()

  const payload: Record<string, unknown> = {
    ad_max_image_mb: Math.max(1, parseInt(formData.get('ad_max_image_mb') as string) || 5),
    ad_max_video_mb: Math.max(1, parseInt(formData.get('ad_max_video_mb') as string) || 50),
    updated_at: new Date().toISOString(),
  }

  // Solo actualizar llaves si vienen con valor (no sobrescribir con vacío)
  const keyFields = ['gateway_public_key', 'gateway_private_key', 'gateway_events_secret', 'gateway_integrity_secret']
  for (const f of keyFields) {
    const v = (formData.get(f) as string)?.trim()
    if (v) payload[f] = v
  }

  const { error } = await admin.from('site_settings').update(payload).eq('id', 1)
  if (error) return { error: error.message }
  revalidatePath('/admin/configuracion')
  revalidatePath('/pauta')
  revalidatePath('/suscripcion')
  return { success: true }
}

// ---------- SUSCRIPTORES ----------

export async function grantManualSubscription(formData: FormData): Promise<{ error?: string; success?: string }> {
  if (!await isCurrentUserAdmin()) return { error: 'Sin permisos' }

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const fullName = (formData.get('full_name') as string) || ''
  const durationDays = parseInt(formData.get('duration_days') as string) // NaN = indefinida

  if (!email || !password) return { error: 'Correo y contraseña son obligatorios.' }
  if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' }

  const admin = createAdminClient()

  // Crear o ubicar el usuario
  let userId: string | null = null
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: fullName },
  })
  if (created?.user) {
    userId = created.user.id
  } else if (createErr && /already.*registered|exists/i.test(createErr.message)) {
    // Buscar el usuario existente por email
    const { data: list } = await admin.auth.admin.listUsers()
    const existing = list?.users.find((u) => u.email?.toLowerCase() === email)
    userId = existing?.id ?? null
  } else if (createErr) {
    return { error: createErr.message }
  }
  if (!userId) return { error: 'No se pudo crear o encontrar el usuario.' }

  const start = new Date()
  const end = Number.isFinite(durationDays) && durationDays > 0
    ? new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000)
    : null

  const { error: subErr } = await admin.from('subscriptions').insert({
    user_id: userId,
    email,
    plan: 'manual',
    source: 'manual',
    status: 'activa',
    start_date: start.toISOString(),
    end_date: end ? end.toISOString() : null,
  })
  if (subErr) return { error: subErr.message }

  revalidatePath('/admin/suscriptores')
  return { success: `Acceso de suscriptor otorgado a ${email}.` }
}

export async function revokeSubscription(id: string): Promise<{ error?: string }> {
  if (!await isCurrentUserAdmin()) return { error: 'Sin permisos' }
  const admin = createAdminClient()
  const { error } = await admin.from('subscriptions').update({ status: 'cancelada' }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/suscriptores')
  return {}
}

export async function reactivateSubscription(id: string): Promise<{ error?: string }> {
  if (!await isCurrentUserAdmin()) return { error: 'Sin permisos' }
  const admin = createAdminClient()
  const { error } = await admin.from('subscriptions').update({ status: 'activa' }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/suscriptores')
  return {}
}
