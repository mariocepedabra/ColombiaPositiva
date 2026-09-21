import type { NextRequest } from 'next/server'

import { puedePublicar, subirFoto } from '@/lib/app-api/publicar'
import { sesionDesdeToken, tokenDe } from '@/lib/app-api/sesion'

// POST /api/app/mis-notas/imagen (Bearer; multipart con el campo "archivo")
// → sube la foto de una nota al bucket article-images (reducida a 1600 px).

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const SIN_CACHE = { 'Cache-Control': 'private, no-store' }

export async function POST(request: NextRequest) {
  const token = tokenDe(request)
  const sesion = await sesionDesdeToken(token)
  if (!puedePublicar(sesion)) return Response.json({ error: 'Solo los columnistas pueden subir fotos.' }, { status: 403, headers: SIN_CACHE })
  let archivo: File | null = null
  try {
    const form = await request.formData()
    const campo = form.get('archivo')
    archivo = campo instanceof File ? campo : null
  } catch {
    return Response.json({ error: 'Formulario inválido.' }, { status: 400, headers: SIN_CACHE })
  }
  if (!archivo) return Response.json({ error: 'Falta el campo "archivo".' }, { status: 400, headers: SIN_CACHE })
  const r = await subirFoto(token!, archivo)
  if (!r.ok) return Response.json({ error: r.error }, { status: r.estado, headers: SIN_CACHE })
  return Response.json(r.datos, { status: 201, headers: SIN_CACHE })
}
