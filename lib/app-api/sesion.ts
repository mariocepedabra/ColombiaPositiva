import { createClient } from '@supabase/supabase-js'

// Sesión de la app: el teléfono manda el token de acceso de Supabase como
// `Authorization: Bearer …`. Aquí se valida y se resuelve qué puede hacer el
// usuario. Misma regla que lib/paywall.ts (canUserCopy): administrador/Mario
// o suscripción activa → puede copiar el texto de las notas.

export type SesionApp = {
  userId: string
  email: string | null
  nombre: string
  rol: 'admin' | 'columnista' | 'lector'
  puedeCopiar: boolean
}

export function tokenDe(request: Request): string | null {
  const auth = request.headers.get('authorization') ?? ''
  const m = /^Bearer\s+(.+)$/i.exec(auth)
  return m ? m[1].trim() : null
}

// Cliente que actúa como el usuario del token (respeta RLS con su identidad).
export function clienteConToken(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    },
  )
}

export async function sesionDesdeToken(token: string | null): Promise<SesionApp | null> {
  if (!token) return null
  try {
    const supabase = clienteConToken(token)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return null

    let nombre = user.email?.split('@')[0] ?? 'Lector'
    let rol: SesionApp['rol'] = 'lector'
    const { data: perfil } = await supabase.rpc('get_my_profile')
    if (Array.isArray(perfil) && perfil.length > 0) {
      const p = perfil[0] as { role?: string; full_name?: string }
      if (p.full_name) nombre = p.full_name
      if (p.role === 'admin' || p.role === 'columnista' || p.role === 'lector') rol = p.role
    }

    let puedeCopiar = rol === 'admin' || nombre.toLowerCase().includes('mario')
    if (!puedeCopiar) {
      const { data: activa } = await supabase.rpc('has_active_subscription')
      puedeCopiar = activa === true
    }

    return { userId: user.id, email: user.email ?? null, nombre, rol, puedeCopiar }
  } catch {
    return null
  }
}
