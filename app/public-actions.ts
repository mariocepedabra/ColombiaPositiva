'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { buildCheckoutUrl } from '@/lib/gateway'

export async function signOutPublic() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

// Login público de suscriptor (redirige al inicio, no al panel admin)
export async function signInPublic(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Correo o contraseña incorrectos.' }
  redirect('/')
}

// ---- Auth reutilizable (dropdown del header y página /ingresar) ----
// No redirigen: devuelven el resultado para que el cliente refresque la vista.

export async function authSignIn(formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  if (!email || !password) return { error: 'Ingresa tu correo y contraseña.' }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Correo o contraseña incorrectos.' }
  return { ok: true }
}

export async function authSignUp(formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const fullName = (formData.get('full_name') as string) || ''
  if (!email || !password) return { error: 'Ingresa tu correo y contraseña.' }
  if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' }

  // Crear la cuenta confirmada con service role para poder ingresar de inmediato
  const admin = createAdminClient()
  const { error: createErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: fullName },
  })
  if (createErr) {
    if (/already.*registered|exists/i.test(createErr.message)) {
      return { error: 'Ya existe una cuenta con ese correo. Inicia sesión.' }
    }
    return { error: createErr.message }
  }

  // Iniciar sesión con la cuenta recién creada
  const supabase = await createClient()
  const { error: signErr } = await supabase.auth.signInWithPassword({ email, password })
  if (signErr) return { error: 'Cuenta creada, pero no se pudo iniciar sesión. Intenta ingresar.' }
  return { ok: true }
}

async function siteOrigin(): Promise<string> {
  try {
    const h = await headers()
    const host = h.get('x-forwarded-host') || h.get('host')
    const proto = h.get('x-forwarded-proto') || 'https'
    if (host) return `${proto}://${host}`
  } catch { /* noop */ }
  return 'https://colombiapositiva.com'
}

// Construye la URL de pago para una pauta. null si la pasarela no está configurada.
export async function getAdCheckoutUrl(adId: string, amountCop: number, email?: string): Promise<string | null> {
  const origin = await siteOrigin()
  return buildCheckoutUrl({
    reference: `pauta_${adId}`,
    amountCop,
    redirectUrl: `${origin}/pauta?estado=recibido`,
    customerEmail: email,
  })
}

// Construye la URL de pago para una suscripción. null si la pasarela no está configurada.
export async function getSubscriptionCheckoutUrl(subId: string, amountCop: number, email?: string): Promise<string | null> {
  const origin = await siteOrigin()
  return buildCheckoutUrl({
    reference: `sub_${subId}`,
    amountCop,
    redirectUrl: `${origin}/suscripcion?estado=recibido`,
    customerEmail: email,
  })
}
