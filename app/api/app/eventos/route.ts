import type { NextRequest } from 'next/server'

import { geoDesdeCabeceras, guardarEventos } from '@/lib/app-api/eventos'

// POST /api/app/eventos — estadística anónima de lectura, en lotes.
// La app manda qué se abrió, la plataforma, la hora y un código de sesión
// diario al azar. Aquí se añade la ciudad aproximada (cabeceras de Vercel) y
// se descarta la IP. Nunca lleva token de sesión.

export const dynamic = 'force-dynamic'
const SIN_CACHE = { 'Cache-Control': 'no-store' }

export async function POST(request: NextRequest) {
  let lote: unknown
  try {
    lote = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo inválido.' }, { status: 400, headers: SIN_CACHE })
  }
  await guardarEventos((lote ?? {}) as Parameters<typeof guardarEventos>[0], geoDesdeCabeceras(request.headers))
  return new Response(null, { status: 204, headers: SIN_CACHE })
}
