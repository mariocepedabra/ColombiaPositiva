import type { NextRequest } from 'next/server'

import { cerrarSesion } from '@/lib/app-api/cuenta'
import { tokenDe } from '@/lib/app-api/sesion'

// POST /api/app/auth/logout (Bearer) → invalida la sesión en el servidor.

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const token = tokenDe(request)
  if (token) await cerrarSesion(token)
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'private, no-store' } })
}
