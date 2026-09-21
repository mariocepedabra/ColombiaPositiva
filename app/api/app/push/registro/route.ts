import type { NextRequest } from 'next/server'

import type { PeticionPush } from '@/lib/app-api/contratos'
import { darDeBajaToken, esTokenExpo, registrarToken } from '@/lib/app-api/push'

// POST   /api/app/push/registro { token, plataforma } → registra el teléfono.
// DELETE /api/app/push/registro { token }             → lo da de baja.
// No requiere sesión: el token no se asocia a ninguna cuenta.

export const dynamic = 'force-dynamic'
const SIN_CACHE = { 'Cache-Control': 'no-store' }

async function leer(request: NextRequest): Promise<Partial<PeticionPush> | null> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const p = await leer(request)
  if (!p || !esTokenExpo(p.token) || (p.plataforma !== 'ios' && p.plataforma !== 'android')) {
    return Response.json({ error: 'Token o plataforma inválidos.' }, { status: 400, headers: SIN_CACHE })
  }
  await registrarToken(p.token, p.plataforma)
  return new Response(null, { status: 204, headers: SIN_CACHE })
}

export async function DELETE(request: NextRequest) {
  const p = await leer(request)
  if (!p || !esTokenExpo(p.token)) return Response.json({ error: 'Token inválido.' }, { status: 400, headers: SIN_CACHE })
  await darDeBajaToken(p.token)
  return new Response(null, { status: 204, headers: SIN_CACHE })
}
