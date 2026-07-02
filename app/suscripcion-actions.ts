'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanFromPricing } from '@/lib/subscription'
import { getPricing } from '@/lib/pricing'
import { getSubscriptionCheckoutUrl } from '@/app/public-actions'

type Result = { url?: string; error?: string }

// Inicia el flujo de suscripción: asegura una cuenta (login o registro),
// crea una fila de suscripción 'pendiente_pago' y devuelve la URL de pago.
export async function startSubscriptionCheckout(formData: FormData): Promise<Result> {
  const planId = formData.get('plan') as string
  const mode = (formData.get('mode') as string) || 'login' // 'login' | 'register'
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const fullName = (formData.get('full_name') as string) || ''

  const pricing = await getPricing()
  const plan = getPlanFromPricing(pricing, planId)
  if (!plan) return { error: 'Plan no válido.' }

  const supabase = await createClient()

  // 1. Determinar el usuario (sesión actual, o login, o registro)
  let userId: string | null = null
  let userEmail: string | null = null

  const { data: { user: current } } = await supabase.auth.getUser()
  if (current) {
    userId = current.id
    userEmail = current.email ?? email ?? null
  } else {
    if (!email || !password) return { error: 'Ingresa tu correo y contraseña.' }

    if (mode === 'register') {
      // Crear cuenta con service role (confirmada) para que pueda ingresar de inmediato
      const admin = createAdminClient()
      const { error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })
      if (createErr && !/already.*registered|exists/i.test(createErr.message)) {
        return { error: createErr.message }
      }
    }

    // Iniciar sesión (tanto para login como tras registro)
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
    if (signInErr || !signInData.user) {
      return { error: mode === 'register' ? 'Cuenta creada, pero no se pudo iniciar sesión. Intenta ingresar.' : 'Correo o contraseña incorrectos.' }
    }
    userId = signInData.user.id
    userEmail = signInData.user.email ?? email
  }

  if (!userId) return { error: 'No se pudo identificar tu cuenta.' }

  // 2. Crear la suscripción pendiente de pago (service role)
  const admin = createAdminClient()
  const { data: sub, error: subErr } = await admin
    .from('subscriptions')
    .insert({
      user_id: userId,
      email: userEmail,
      plan: plan.id,
      source: 'pago',
      status: 'pendiente_pago',
    })
    .select('id')
    .single()

  if (subErr || !sub) {
    console.error('[startSubscriptionCheckout] sub insert error:', subErr)
    return { error: 'No se pudo crear la suscripción. Intenta de nuevo.' }
  }

  // 3. Construir la URL de pago
  const url = await getSubscriptionCheckoutUrl(sub.id, plan.priceCop, userEmail ?? undefined)
  if (!url) {
    return { error: 'El pago no está disponible en este momento. Tu cuenta quedó creada; intenta más tarde o contacta al equipo.' }
  }
  return { url }
}
