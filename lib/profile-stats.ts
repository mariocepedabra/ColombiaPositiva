import { createAdminClient } from '@/lib/supabase/admin'

// Estadísticas del perfil de un usuario (página /perfil).
// Se usa service role en el servidor; las páginas que las llaman ya identifican
// al usuario autenticado y solo consultan SUS propios datos (por email o user_id).
// Cada función degrada con seguridad si la tabla aún no existe (p. ej. si el SQL
// de pautas/suscripciones todavía no se ha corrido en Supabase).

export type MyNotaSubmission = {
  id: string
  title: string
  region: string | null
  created_at: string
}

export type MyAd = {
  id: string
  created_at: string
  company: string | null
  media_type: string
  days: number
  price: number
  status: string
  paid: boolean
  start_date: string | null
  end_date: string | null
}

export type MySubscription = {
  id: string
  plan: string
  source: string
  status: string
  start_date: string | null
  end_date: string | null
  created_at: string
}

// Escapa los comodines de LIKE (% y _) para emparejar el correo de forma literal
// (case-insensitive vía ilike) sin coincidencias accidentales.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`)
}

// Notas Positivas que el usuario ha aportado (emparejadas por correo).
export async function getMyNotaSubmissions(email: string): Promise<MyNotaSubmission[]> {
  if (!email) return []
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('nota_positiva_submissions')
      .select('id,title,region,created_at')
      .ilike('email', escapeLike(email))
      .order('created_at', { ascending: false })
    if (error) { console.error('[getMyNotaSubmissions]', error.message); return [] }
    return (data ?? []) as MyNotaSubmission[]
  } catch (e) {
    console.error('[getMyNotaSubmissions]', e)
    return []
  }
}

// Pautas que el usuario ha enviado (emparejadas por correo).
export async function getMyAds(email: string): Promise<MyAd[]> {
  if (!email) return []
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('ad_submissions')
      .select('id,created_at,company,media_type,days,price,status,paid,start_date,end_date')
      .ilike('email', escapeLike(email))
      .order('created_at', { ascending: false })
    if (error) { console.error('[getMyAds]', error.message); return [] }
    return (data ?? []) as MyAd[]
  } catch (e) {
    console.error('[getMyAds]', e)
    return []
  }
}

// Suscripciones del usuario (por user_id).
export async function getMySubscriptions(userId: string): Promise<MySubscription[]> {
  if (!userId) return []
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('subscriptions')
      .select('id,plan,source,status,start_date,end_date,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) { console.error('[getMySubscriptions]', error.message); return [] }
    return (data ?? []) as MySubscription[]
  } catch (e) {
    console.error('[getMySubscriptions]', e)
    return []
  }
}

// La suscripción activa y vigente, si existe.
export function activeSubscription(subs: MySubscription[]): MySubscription | null {
  const now = Date.now()
  return (
    subs.find(
      (s) => s.status === 'activa' && (!s.end_date || new Date(s.end_date).getTime() >= now)
    ) ?? null
  )
}

// Duración legible en español desde una fecha hasta hoy (ej. "1 año y 2 meses").
export function formatMembershipDuration(sinceIso: string): string {
  const since = new Date(sinceIso)
  const now = new Date()
  if (Number.isNaN(since.getTime())) return '—'

  let months = (now.getFullYear() - since.getFullYear()) * 12 + (now.getMonth() - since.getMonth())
  if (now.getDate() < since.getDate()) months -= 1

  if (months < 1) {
    const days = Math.max(0, Math.floor((now.getTime() - since.getTime()) / 86_400_000))
    if (days <= 0) return 'Hoy'
    return days === 1 ? '1 día' : `${days} días`
  }

  const years = Math.floor(months / 12)
  const remMonths = months % 12
  const parts: string[] = []
  if (years > 0) parts.push(years === 1 ? '1 año' : `${years} años`)
  if (remMonths > 0) parts.push(remMonths === 1 ? '1 mes' : `${remMonths} meses`)
  return parts.join(' y ') || 'Menos de un mes'
}
