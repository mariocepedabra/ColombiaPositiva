import type { NextRequest } from 'next/server'

import { construirCuenta, eliminarCuenta } from '@/lib/app-api/cuenta'
import { sesionDesdeToken, tokenDe } from '@/lib/app-api/sesion'

// GET    /api/app/cuenta (Bearer) → perfil, suscripción, pautas del anunciante.
// DELETE /api/app/cuenta (Bearer) → elimina la cuenta de verdad (Apple y
//        Google exigen que se pueda desde la app).

export const dynamic = 'force-dynamic'

const SIN_CACHE = { 'Cache-Control': 'private, no-store' }

export async function GET(request: NextRequest) {
  const sesion = await sesionDesdeToken(tokenDe(request))
  if (!sesion) return Response.json({ error: 'Sesión no válida.' }, { status: 401, headers: SIN_CACHE })
  try {
    return Response.json(await construirCuenta(sesion), { headers: SIN_CACHE })
  } catch (e) {
    console.error('[api/app/cuenta]', e)
    return Response.json({ error: 'No se pudo cargar la cuenta.' }, { status: 503, headers: SIN_CACHE })
  }
}

export async function DELETE(request: NextRequest) {
  const sesion = await sesionDesdeToken(tokenDe(request))
  if (!sesion) return Response.json({ error: 'Sesión no válida.' }, { status: 401, headers: SIN_CACHE })
  // Un administrador no se borra desde el teléfono: sería borrar el medio.
  if (sesion.rol === 'admin') {
    return Response.json({ error: 'Las cuentas de administrador se gestionan desde el panel.' }, { status: 403, headers: SIN_CACHE })
  }
  const { error } = await eliminarCuenta(sesion.userId)
  if (error) {
    console.error('[api/app/cuenta] eliminar', error)
    return Response.json({ error: 'No se pudo eliminar la cuenta.' }, { status: 503, headers: SIN_CACHE })
  }
  return new Response(null, { status: 204, headers: SIN_CACHE })
}
