import type { NextRequest } from 'next/server'

import { paginaValida } from '@/lib/app-api/nota'
import { crearNota, listarMisNotas, puedePublicar } from '@/lib/app-api/publicar'
import { sesionDesdeToken, tokenDe } from '@/lib/app-api/sesion'

// GET  /api/app/mis-notas?pagina=  (Bearer; columnista o admin) → mis notas.
// POST /api/app/mis-notas          (Bearer; columnista o admin) → crear nota.

export const dynamic = 'force-dynamic'
const SIN_CACHE = { 'Cache-Control': 'private, no-store' }

export async function GET(request: NextRequest) {
  const token = tokenDe(request)
  const sesion = await sesionDesdeToken(token)
  if (!puedePublicar(sesion)) return Response.json({ error: 'Solo los columnistas pueden ver esta sección.' }, { status: 403, headers: SIN_CACHE })
  try {
    return Response.json(await listarMisNotas(sesion, token!, paginaValida(request.nextUrl.searchParams.get('pagina'))), { headers: SIN_CACHE })
  } catch (e) {
    console.error('[api/app/mis-notas]', e)
    return Response.json({ error: 'No se pudieron cargar tus notas.' }, { status: 503, headers: SIN_CACHE })
  }
}

export async function POST(request: NextRequest) {
  const token = tokenDe(request)
  const sesion = await sesionDesdeToken(token)
  if (!puedePublicar(sesion)) return Response.json({ error: 'Solo los columnistas pueden publicar.' }, { status: 403, headers: SIN_CACHE })
  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo inválido.' }, { status: 400, headers: SIN_CACHE })
  }
  const r = await crearNota(sesion, token!, cuerpo)
  if (!r.ok) return Response.json({ error: r.error }, { status: r.estado, headers: SIN_CACHE })
  return Response.json(r.datos, { status: 201, headers: SIN_CACHE })
}
