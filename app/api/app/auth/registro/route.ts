import type { NextRequest } from 'next/server'

import type { PeticionRegistro } from '@/lib/app-api/contratos'
import { crearCuenta } from '@/lib/app-api/cuenta'

// POST /api/app/auth/registro { email, password, nombre } → tokens de sesión.
// Crea una cuenta de lector (mismo camino que el formulario de la web).

export const dynamic = 'force-dynamic'

const SIN_CACHE = { 'Cache-Control': 'private, no-store' }

// Freno sencillo por IP (por instancia): evita que un script cree cuentas en
// ráfaga. No sustituye a la protección de Supabase; solo quita lo fácil.
const VENTANA_MS = 10 * 60_000
const MAXIMO_POR_VENTANA = 5
const intentos = new Map<string, number[]>()

function excedeLimite(ip: string): boolean {
  const ahora = Date.now()
  const recientes = (intentos.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS)
  recientes.push(ahora)
  intentos.set(ip, recientes)
  if (intentos.size > 5000) intentos.clear()
  return recientes.length > MAXIMO_POR_VENTANA
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconocida'
  if (excedeLimite(ip)) {
    return Response.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429, headers: SIN_CACHE })
  }
  let cuerpo: Partial<PeticionRegistro>
  try {
    cuerpo = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo inválido.' }, { status: 400, headers: SIN_CACHE })
  }
  try {
    const resultado = await crearCuenta(String(cuerpo.email ?? ''), String(cuerpo.password ?? ''), String(cuerpo.nombre ?? ''))
    if ('error' in resultado) {
      return Response.json({ error: resultado.error }, { status: resultado.estado, headers: SIN_CACHE })
    }
    return Response.json(resultado.tokens, { status: 201, headers: SIN_CACHE })
  } catch (e) {
    console.error('[api/app/auth/registro]', e)
    return Response.json({ error: 'No se pudo crear la cuenta.' }, { status: 503, headers: SIN_CACHE })
  }
}
