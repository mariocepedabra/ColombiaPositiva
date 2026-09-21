import { revalidatePath, revalidateTag } from 'next/cache'
import { after, type NextRequest } from 'next/server'

import { portadaCacheada, portadaFresca, TAG_PORTADA } from '@/lib/app-api/portada'
import { runSocialSyncIfStale } from '@/lib/social/sync'

// GET /api/app/home — la portada completa de la app móvil en una petición.
//
//   ?fresh=1  → salta la caché (tirar para refrescar). Aun así el servidor
//               agrupa los refrescos que lleguen en la misma ventana.
//
// Público, sin sesión. Solo devuelve lo mismo que ya ve cualquier visitante.

export const dynamic = 'force-dynamic'
// La sincronización perezosa de TikTok puede correr tras responder (~5 s).
export const maxDuration = 60

// El CDN de Vercel guarda la respuesta un minuto y sirve la copia vieja
// mientras regenera hasta cinco minutos más: ni una ráfaga toca la función.
const CACHE_CDN = 'public, s-maxage=60, stale-while-revalidate=300'

export async function GET(request: NextRequest) {
  const fresca = request.nextUrl.searchParams.get('fresh') === '1'

  // Videos nuevos de TikTok: si la última sincronización tiene más de 20 h,
  // corre en segundo plano después de responder (respaldo del cron).
  after(async () => {
    const informe = await runSocialSyncIfStale()
    if (informe && informe.imported > 0) {
      revalidateTag(TAG_PORTADA, 'max')
      revalidatePath('/')
    }
  })

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
