import { conteosCacheados } from '@/lib/app-api/nota'

// GET /api/app/secciones — cuántas notas publicadas tiene cada sección.

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const conteos = await conteosCacheados()
    return Response.json(conteos, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' },
    })
  } catch (e) {
    console.error('[api/app/secciones]', e)
    return Response.json({ error: 'No se pudieron contar las secciones.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
