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

// Sube (nunca baja) el límite de tamaño de un bucket para que admita el peso
// máximo configurado en el panel. Solo eleva el techo: así los buckets que se
// comparten con otras secciones (imágenes de artículos, videos editoriales)
// nunca pierden capacidad. Conserva `public` y los tipos MIME del bucket.
async function raiseBucketLimit(
  admin: ReturnType<typeof createAdminClient>,
  bucketId: string,
  minMb: number
): Promise<void> {
  try {
    const { data: bucket } = await admin.storage.getBucket(bucketId)
    if (!bucket) return
    const minBytes = minMb * 1024 * 1024
    const current = bucket.file_size_limit ?? 0
    if (current >= minBytes) return // ya admite ese tamaño; no tocar
    const { error } = await admin.storage.updateBucket(bucketId, {
      public: bucket.public,
      allowedMimeTypes: bucket.allowed_mime_types,
      fileSizeLimit: minBytes,
    })
    if (error) console.error(`[saveSettings] No se pudo ajustar el bucket ${bucketId}:`, error)
  } catch (e) {
    console.error(`[saveSettings] Error ajustando el bucket ${bucketId}:`, e)
  }
}

export async function saveSettings(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  if (!await isCurrentUserAdmin()) return { error: 'Sin permisos' }
  const admin = createAdminClient()

  const maxImageMb = Math.max(1, parseInt(formData.get('ad_max_image_mb') as string) || 5)
  const maxVideoMb = Math.max(1, parseInt(formData.get('ad_max_video_mb') as string) || 50)

  const payload: Record<string, unknown> = {
    ad_max_image_mb: maxImageMb,
    ad_max_video_mb: maxVideoMb,
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

  // Mantener los límites de los buckets alineados con el panel: las imágenes de
  // pauta van a "article-images" y los videos a "videos".
  await raiseBucketLimit(admin, 'article-images', maxImageMb)
  await raiseBucketLimit(admin, 'videos', maxVideoMb)

  revalidatePath('/admin/configuracion')
  revalidatePath('/pauta')
  revalidatePath('/suscripcion')
  return { success: true }
}

// ---------- SUSCRIPTORES ----------

// ¿El usuario ya tiene una suscripción activa y vigente?
async function userHasActiveSub(userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const nowIso = new Date().toISOString()
  const { data } = await admin
    .from('subscriptions')
    .select('id,end_date')
    .eq('user_id', userId)
    .eq('status', 'activa')
  return (data ?? []).some((s) => !s.end_date || s.end_date >= nowIso)
}

// Cancela todas las suscripciones activas de un usuario.
async function revokeUserSubs(userId: string): Promise<void> {
  const admin = createAdminClient()
  await admin.from('subscriptions').update({ status: 'cancelada' }).eq('user_id', userId).eq('status', 'activa')
}

// Garantiza una suscripción manual activa (no duplica si ya hay una vigente).
async function ensureManualSub(userId: string, email: string | null, durationDays?: number): Promise<{ error?: string }> {
  if (await userHasActiveSub(userId)) return {}
  const admin = createAdminClient()
  const start = new Date()
  const end = durationDays && Number.isFinite(durationDays) && durationDays > 0
    ? new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000)
    : null
  const { error } = await admin.from('subscriptions').insert({
    user_id: userId, email, plan: 'manual', source: 'manual', status: 'activa',
    start_date: start.toISOString(), end_date: end ? end.toISOString() : null,
  })
  return error ? { error: error.message } : {}
}

export async function grantManualSubscription(formData: FormData): Promise<{ error?: string; success?: string }> {
  if (!await isCurrentUserAdmin()) return { error: 'Sin permisos' }

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = (formData.get('password') as string) || ''
  const fullName = (formData.get('full_name') as string) || ''
  const durationDays = parseInt(formData.get('duration_days') as string) // NaN = indefinida

  if (!email) return { error: 'El correo es obligatorio.' }

  const admin = createAdminClient()

  // ¿Ya existe un usuario con ese correo?
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const existing = list?.users.find((u) => u.email?.toLowerCase() === email)

  let userId: string
  if (existing) {
    // Usuario existente (incluye quien hizo clic en pagar y no pagó): solo se le
    // otorga el acceso de suscriptor; no se requiere contraseña.
    userId = existing.id
  } else {
    // Usuario nuevo: se requiere contraseña para que pueda ingresar.
    if (!password || password.length < 6) {
      return { error: 'Para un usuario nuevo, la contraseña es obligatoria (mínimo 6 caracteres).' }
    }
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name: fullName },
    })
    if (createErr || !created?.user) return { error: createErr?.message ?? 'No se pudo crear el usuario.' }
    userId = created.user.id
  }

  const result = await ensureManualSub(userId, email, durationDays)
  if (result.error) return { error: result.error }

  revalidatePath('/admin/suscriptores')
  revalidatePath('/admin/usuarios')
  return {
    success: existing
      ? `Acceso de suscriptor otorgado a ${email} (cuenta existente).`
      : `Cuenta creada y acceso de suscriptor otorgado a ${email}.`,
  }
}

export async function revokeSubscription(id: string): Promise<{ error?: string }> {
  if (!await isCurrentUserAdmin()) return { error: 'Sin permisos' }
  const admin = createAdminClient()
  const { error } = await admin.from('subscriptions').update({ status: 'cancelada' }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/suscriptores')
  revalidatePath('/admin/usuarios')
  return {}
}

export async function reactivateSubscription(id: string): Promise<{ error?: string }> {
  if (!await isCurrentUserAdmin()) return { error: 'Sin permisos' }
  const admin = createAdminClient()
  const { error } = await admin.from('subscriptions').update({ status: 'activa' }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/suscriptores')
  revalidatePath('/admin/usuarios')
  return {}
}

// ---------- ACCESO DE USUARIO (panel Usuarios) ----------
// "Suscriptor" no es un rol de profiles (eso abriría el panel de edición), sino
// una suscripción manual activa. El resto sí son roles reales en profiles.
export async function setUserAccess(userId: string, email: string | null, value: string): Promise<{ error?: string }> {
  if (!await isCurrentUserAdmin()) return { error: 'Sin permisos' }
  const admin = createAdminClient()

  if (value === 'suscriptor') {
    // Mantener role='lector' (sin acceso al panel) + otorgar suscripción manual
    await admin.from('profiles').update({ role: 'lector' }).eq('id', userId)
    const r = await ensureManualSub(userId, email)
    if (r.error) return r
  } else if (value === 'lector') {
    await admin.from('profiles').update({ role: 'lector' }).eq('id', userId)
    await revokeUserSubs(userId)
  } else if (value === 'columnista' || value === 'admin') {
    const { error } = await admin.from('profiles').update({ role: value }).eq('id', userId)
    if (error) return { error: error.message }
  } else {
    return { error: 'Rol no válido' }
  }

  revalidatePath('/admin/usuarios')
  revalidatePath('/')
  return {}
}
