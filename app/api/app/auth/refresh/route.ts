import type { NextRequest } from 'next/server'

import type { PeticionRefresh } from '@/lib/app-api/contratos'
import { renovarSesion } from '@/lib/app-api/cuenta'

// POST /api/app/auth/refresh { refreshToken } → tokens nuevos.
// La app lo llama al abrir (revalidar la sesión) y cuando el token caduca.

export const dynamic = 'force-dynamic'

const SIN_CACHE = { 'Cache-Control': 'private, no-store' }

export async function POST(request: NextRequest) {
  let cuerpo: Partial<PeticionRefresh>
  try {
    cuerpo = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo inválido.' }, { status: 400, headers: SIN_CACHE })
  }
  try {
    const resultado = await renovarSesion(String(cuerpo.refreshToken ?? ''))
    if ('error' in resultado) {
      return Response.json({ error: resultado.error }, { status: resultado.estado, headers: SIN_CACHE })
    }
    return Response.json(resultado.tokens, { headers: SIN_CACHE })
  } catch (e) {
    console.error('[api/app/auth/refresh]', e)
    return Response.json({ error: 'No se pudo renovar la sesión.' }, { status: 503, headers: SIN_CACHE })
  }
}
