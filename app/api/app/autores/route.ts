import { columnistasCacheados } from '@/lib/app-api/autores'

// GET /api/app/autores — "Otros columnistas": el más leído de la semana y la
// lista de quienes firman las últimas columnas. Una sola petición; la app no
// pide nada por columnista.

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const columnistas = await columnistasCacheados()
    return Response.json(columnistas, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800' },
    })
  } catch (e) {
    console.error('[api/app/autores]', e)
    return Response.json({ error: 'No se pudieron cargar los columnistas.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
