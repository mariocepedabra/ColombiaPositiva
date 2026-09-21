import type { NextRequest } from 'next/server'

import type { NotaCompleta } from '@/lib/app-api/contratos'
import { notaCacheada } from '@/lib/app-api/nota'
import { sesionDesdeToken, tokenDe } from '@/lib/app-api/sesion'

// GET /api/app/nota/[slug] — la nota completa para la app.
// Con `Authorization: Bearer <token>` resuelve `puedeCopiar` para ese usuario;
// en ese caso la respuesta es privada (no la guarda el CDN).

export const dynamic = 'force-dynamic'

const CACHE_PUBLICA = 'public, s-maxage=60, stale-while-revalidate=300'

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!slug) return Response.json({ error: 'Falta el slug.' }, { status: 400 })

  const token = tokenDe(request)
  try {
    const [nota, sesion] = await Promise.all([notaCacheada(slug), sesionDesdeToken(token)])
    if (!nota) {
      return Response.json({ error: 'Nota no encontrada.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
    }
    const completa: NotaCompleta = { ...nota, puedeCopiar: sesion?.puedeCopiar ?? false }
    return Response.json(completa, {
      headers: { 'Cache-Control': token ? 'private, no-store' : CACHE_PUBLICA },
    })
  } catch (e) {
    console.error('[api/app/nota]', e)
    return Response.json({ error: 'No se pudo cargar la nota.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
