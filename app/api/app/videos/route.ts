import { listaVideosCacheada } from '@/lib/app-api/videos'

// GET /api/app/videos — todos los videos activos para la pestaña Videos.

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const lista = await listaVideosCacheada()
    return Response.json(lista, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' },
    })
  } catch (e) {
    console.error('[api/app/videos]', e)
    return Response.json({ error: 'No se pudieron cargar los videos.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
