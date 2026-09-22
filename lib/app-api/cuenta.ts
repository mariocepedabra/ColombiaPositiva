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

// Crea una cuenta de lector desde la app, igual que authSignUp en la web:
// usuario confirmado con la clave de servicio (para poder entrar de inmediato)
// y luego inicio de sesión normal. El rol lo pone la base de datos (lector).
export async function crearCuenta(email: string, password: string, nombre: string): Promise<ResultadoAuth> {
  const correo = email.trim().toLowerCase()
  const nombreLimpio = nombre.trim().slice(0, 80)
  if (!correo || !password) return { error: 'Ingresa tu correo y contraseña.', estado: 400 }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return { error: 'Ese correo no parece válido.', estado: 400 }
  if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.', estado: 400 }
  if (!nombreLimpio) return { error: 'Cuéntanos tu nombre.', estado: 400 }

  const { error } = await createAdminClient().auth.admin.createUser({
    email: correo,
    password,
    email_confirm: true,
    user_metadata: { full_name: nombreLimpio },
  })
  if (error) {
    if (/already.*registered|exists/i.test(error.message)) {
      return { error: 'Ya existe una cuenta con ese correo. Inicia sesión.', estado: 409 }
    }
    return { error: 'No se pudo crear la cuenta. Inténtalo de nuevo.', estado: 502 }
  }
  const sesion = await iniciarSesion(correo, password)
  if ('error' in sesion) return { error: 'Cuenta creada, pero no se pudo iniciar sesión. Entra con tu correo.', estado: 502 }
  return sesion
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
