import type { NextRequest } from 'next/server'

import { portadaCacheada, portadaFresca } from '@/lib/app-api/portada'

// GET /api/app/home — la portada completa de la app móvil en una petición.
//
//   ?fresh=1  → salta la caché (tirar para refrescar). Aun así el servidor
//               agrupa los refrescos que lleguen en la misma ventana.
//
// Público, sin sesión. Solo devuelve lo mismo que ya ve cualquier visitante.

export const dynamic = 'force-dynamic'

// El CDN de Vercel guarda la respuesta un minuto y sirve la copia vieja
// mientras regenera hasta cinco minutos más: ni una ráfaga toca la función.
const CACHE_CDN = 'public, s-maxage=60, stale-while-revalidate=300'

export async function GET(request: NextRequest) {
  const fresca = request.nextUrl.searchParams.get('fresh') === '1'
  try {
    const portada = fresca ? await portadaFresca() : await portadaCacheada()
    return Response.json(portada, {
      headers: {
        'Cache-Control': fresca ? 'no-store' : CACHE_CDN,
        'X-Portada-Generada': portada.generadoEn,
      },
    })
  } catch (e) {
    console.error('[api/app/home]', e)
    return Response.json(
      { error: 'No se pudo construir la portada.' },
      { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '30' } },
    )
  }
}
