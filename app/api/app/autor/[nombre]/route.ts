import type { NextRequest } from 'next/server'

import { paginaAutorCacheada } from '@/lib/app-api/autores'
import { paginaValida } from '@/lib/app-api/nota'

// GET /api/app/autor/[nombre]?pagina=1 — perfil de un columnista y su
// historial paginado. [nombre] es la firma tal cual aparece en las notas.

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ nombre: string }> }) {
  const { nombre } = await params
  let firma: string
  try {
    firma = decodeURIComponent(nombre ?? '')
  } catch {
    return Response.json({ error: 'Nombre inválido.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }
  const pagina = paginaValida(request.nextUrl.searchParams.get('pagina'))

  try {
    const resultado = await paginaAutorCacheada(firma, pagina)
    if (!resultado) {
      return Response.json({ error: 'Columnista no encontrado.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
    }
    return Response.json(resultado, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800' },
    })
  } catch (e) {
    console.error('[api/app/autor]', e)
    return Response.json({ error: 'No se pudo cargar el columnista.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
