import type { NextRequest } from 'next/server'

import { busquedaCacheada } from '@/lib/app-api/nota'

// GET /api/app/buscar?q=texto — misma búsqueda difusa que /buscar en la web.

export const dynamic = 'force-dynamic'

const MIN_CARACTERES = 2
const MAX_CARACTERES = 80

export async function GET(request: NextRequest) {
  const consulta = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, MAX_CARACTERES)
  if (consulta.length < MIN_CARACTERES) {
    return Response.json({ consulta, notas: [] }, { headers: { 'Cache-Control': 'no-store' } })
  }
  try {
    const resultado = await busquedaCacheada(consulta.toLowerCase())
    return Response.json(
      { ...resultado, consulta },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
    )
  } catch (e) {
    console.error('[api/app/buscar]', e)
    return Response.json({ error: 'No se pudo buscar.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
