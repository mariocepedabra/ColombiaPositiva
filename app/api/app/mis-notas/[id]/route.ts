import type { NextRequest } from 'next/server'

import { actualizarNota, eliminarNota, leerMiNota, puedePublicar } from '@/lib/app-api/publicar'
import { sesionDesdeToken, tokenDe } from '@/lib/app-api/sesion'

// GET    /api/app/mis-notas/[id] → la nota para editar (texto tal cual).
// PATCH  /api/app/mis-notas/[id] → guardar cambios / publicar / despublicar.
// DELETE /api/app/mis-notas/[id] → eliminar.

export const dynamic = 'force-dynamic'
const SIN_CACHE = { 'Cache-Control': 'private, no-store' }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Ctx = { params: Promise<{ id: string }> }

async function autorizar(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const token = tokenDe(request)
  const sesion = await sesionDesdeToken(token)
  if (!UUID.test(id)) return { error: Response.json({ error: 'Id inválido.' }, { status: 400, headers: SIN_CACHE }) }
  if (!puedePublicar(sesion)) return { error: Response.json({ error: 'Solo los columnistas pueden editar notas.' }, { status: 403, headers: SIN_CACHE }) }
  return { id, token: token!, sesion }
}

export async function GET(request: NextRequest, ctx: Ctx) {
  const a = await autorizar(request, ctx)
  if ('error' in a) return a.error
  const nota = await leerMiNota(a.sesion, a.token, a.id)
  if (!nota) return Response.json({ error: 'Nota no encontrada.' }, { status: 404, headers: SIN_CACHE })
  return Response.json(nota, { headers: SIN_CACHE })
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const a = await autorizar(request, ctx)
  if ('error' in a) return a.error
  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo inválido.' }, { status: 400, headers: SIN_CACHE })
  }
  const r = await actualizarNota(a.sesion, a.token, a.id, cuerpo)
  if (!r.ok) return Response.json({ error: r.error }, { status: r.estado, headers: SIN_CACHE })
  return Response.json(r.datos, { headers: SIN_CACHE })
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const a = await autorizar(request, ctx)
  if ('error' in a) return a.error
  const r = await eliminarNota(a.sesion, a.token, a.id)
  if (!r.ok) return Response.json({ error: r.error }, { status: r.estado, headers: SIN_CACHE })
  return new Response(null, { status: 204, headers: SIN_CACHE })
}
