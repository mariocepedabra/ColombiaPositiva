import type { NextRequest } from 'next/server'

import type { PeticionLogin } from '@/lib/app-api/contratos'
import { iniciarSesion } from '@/lib/app-api/cuenta'

// POST /api/app/auth/login { email, password } → tokens de sesión.
// Solo inicia sesión: las cuentas se crean en la web.

export const dynamic = 'force-dynamic'

const SIN_CACHE = { 'Cache-Control': 'private, no-store' }

export async function POST(request: NextRequest) {
  let cuerpo: Partial<PeticionLogin>
  try {
    cuerpo = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo inválido.' }, { status: 400, headers: SIN_CACHE })
  }
  try {
    const resultado = await iniciarSesion(String(cuerpo.email ?? ''), String(cuerpo.password ?? ''))
    if ('error' in resultado) {
      return Response.json({ error: resultado.error }, { status: resultado.estado, headers: SIN_CACHE })
    }
    return Response.json(resultado.tokens, { headers: SIN_CACHE })
  } catch (e) {
    console.error('[api/app/auth/login]', e)
    return Response.json({ error: 'No se pudo iniciar sesión.' }, { status: 503, headers: SIN_CACHE })
  }
}
