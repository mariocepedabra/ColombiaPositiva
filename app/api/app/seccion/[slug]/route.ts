import type { NextRequest } from 'next/server'

import { paginaSeccionCacheada, paginaValida, porPaginaValido } from '@/lib/app-api/nota'

// GET /api/app/seccion/[slug]?pagina=1&porPagina=20 — feed de una sección.
// La app pide la página siguiente solo al llegar al final de la lista.

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const q = request.nextUrl.searchParams
  const pagina = paginaValida(q.get('pagina'))
  const porPagina = porPaginaValido(q.get('porPagina'))

  try {
    const resultado = await paginaSeccionCacheada(slug, pagina, porPagina)
    if (!resultado) {
      return Response.json({ error: 'Sección no encontrada.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
    }
    return Response.json(resultado, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (e) {
    console.error('[api/app/seccion]', e)
    return Response.json({ error: 'No se pudo cargar la sección.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
