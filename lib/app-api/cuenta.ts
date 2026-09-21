import type { Cuenta, SesionTokens } from './contratos'
import type { SesionApp } from './sesion'
import { activeSubscription, getMyAds, getMySubscriptions } from '@/lib/profile-stats'
import { getPlan } from '@/lib/subscription'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAnonClient } from '@/lib/supabase/anon'

// Sesión y cuenta de la app. Los tokens son los de Supabase Auth: la app los
// guarda en almacenamiento seguro y los manda como Bearer. Nunca sale de aquí
// la clave de servicio.

export type ResultadoAuth = { tokens: SesionTokens } | { error: string; estado: number }

function aTokens(sesion: { access_token: string; refresh_token: string; expires_at?: number; expires_in?: number }): SesionTokens {
  const expiraEn = sesion.expires_at ?? Math.floor(Date.now() / 1000) + (sesion.expires_in ?? 3600)
  return { accessToken: sesion.access_token, refreshToken: sesion.refresh_token, expiraEn }
}

export async function iniciarSesion(email: string, password: string): Promise<ResultadoAuth> {
  const correo = email.trim().toLowerCase()
  if (!correo || !password) return { error: 'Ingresa tu correo y contraseña.', estado: 400 }
  const { data, error } = await createAnonClient().auth.signInWithPassword({ email: correo, password })
  if (error || !data.session) return { error: 'Correo o contraseña incorrectos.', estado: 401 }
  return { tokens: aTokens(data.session) }
}

export async function renovarSesion(refreshToken: string): Promise<ResultadoAuth> {
  if (!refreshToken) return { error: 'Falta el token de renovación.', estado: 400 }
  const { data, error } = await createAnonClient().auth.refreshSession({ refresh_token: refreshToken })
  if (error || !data.session) return { error: 'La sesión caducó. Inicia sesión de nuevo.', estado: 401 }
  return { tokens: aTokens(data.session) }
}

// Cierra la sesión en el servidor (invalida el refresh token). Es un extra:
// la app borra sus tokens igualmente.
export async function cerrarSesion(accessToken: string): Promise<void> {
  try {
    await createAdminClient().auth.admin.signOut(accessToken, 'local')
  } catch {
    /* si falla, el token caduca solo */
  }
}

export async function construirCuenta(sesion: SesionApp): Promise<Cuenta> {
  const [subs, ads, { data: usuario }] = await Promise.all([
    getMySubscriptions(sesion.userId),
    sesion.email ? getMyAds(sesion.email) : Promise.resolve([]),
    createAdminClient().auth.admin.getUserById(sesion.userId),
  ])

  const activa = activeSubscription(subs)
  const ultima = activa ?? subs[0] ?? null

  return {
    usuario: {
      id: sesion.userId,
      email: sesion.email,
      nombre: sesion.nombre,
      rol: sesion.rol,
      miembroDesde: usuario?.user?.created_at ?? new Date().toISOString(),
    },
    suscripcion: ultima
      ? {
          activa: !!activa,
          plan: ultima.plan,
          planNombre: getPlan(ultima.plan)?.name ?? (ultima.plan === 'manual' ? 'Acceso de cortesía' : ultima.plan),
          inicio: ultima.start_date,
          vence: ultima.end_date,
        }
      : null,
    anunciante:
      ads.length > 0
        ? {
            pautas: ads.length,
            pagadas: ads.filter((a) => a.paid).length,
            activas: ads.filter((a) => a.status === 'activo').length,
          }
        : null,
    puedeCopiar: sesion.puedeCopiar,
  }
}

// Borra la cuenta de verdad (auth.users → profiles y subscriptions se borran
// en cascada). Las pautas se conservan: son registros comerciales del medio.
export async function eliminarCuenta(userId: string): Promise<{ error?: string }> {
  const { error } = await createAdminClient().auth.admin.deleteUser(userId)
  return error ? { error: error.message } : {}
}
