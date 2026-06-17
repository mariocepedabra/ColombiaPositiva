'use server'

import { createClient } from '@/lib/supabase/server'
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
