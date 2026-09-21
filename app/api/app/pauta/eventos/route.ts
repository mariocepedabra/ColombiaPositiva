import type { NextRequest } from 'next/server'

import type { LoteEventosPauta } from '@/lib/app-api/contratos'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/app/pauta/eventos — impresiones y clics de la pauta, en lotes.
// Conteos agregados por anuncio, zona y plataforma; no llega nada que
// identifique a la persona (ni token, ni identificadores del teléfono).
// Si la migración 2026-09-21_pauta_estadisticas.sql no se ha ejecutado, los
// eventos se descartan en silencio: la app nunca falla por esto.

export const dynamic = 'force-dynamic'

const MAX_EVENTOS = 200
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ZONA = /^[a-z0-9-]{1,40}$/

const SIN_CACHE = { 'Cache-Control': 'no-store' }

export async function POST(request: NextRequest) {
  let lote: Partial<LoteEventosPauta>
  try {
    lote = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo inválido.' }, { status: 400, headers: SIN_CACHE })
  }

  const plataforma = lote.plataforma === 'ios' || lote.plataforma === 'android' ? lote.plataforma : 'app'
  const eventos = Array.isArray(lote.eventos) ? lote.eventos.slice(0, MAX_EVENTOS) : []

  // Se agrupan aquí para hacer pocas llamadas a la base de datos.
  const grupos = new Map<string, { anuncioId: string; zona: string; impresiones: number; clics: number }>()
  for (const e of eventos) {
    if (!e || typeof e.anuncioId !== 'string' || !UUID.test(e.anuncioId)) continue
    const zona = typeof e.zona === 'string' && ZONA.test(e.zona) ? e.zona : ''
    if (e.tipo !== 'impresion' && e.tipo !== 'clic') continue
    const clave = `${e.anuncioId}|${zona}`
    const g = grupos.get(clave) ?? { anuncioId: e.anuncioId, zona, impresiones: 0, clics: 0 }
    if (e.tipo === 'impresion') g.impresiones++
    else g.clics++
    grupos.set(clave, g)
  }

  if (grupos.size === 0) return new Response(null, { status: 204, headers: SIN_CACHE })

  try {
    const admin = createAdminClient()
    await Promise.all(
      [...grupos.values()].map((g) =>
        admin
          .rpc('record_ad_events', {
            p_ad_id: g.anuncioId,
            p_zone: g.zona,
            p_platform: plataforma,
            p_impressions: g.impresiones,
            p_clicks: g.clics,
          })
          .then(({ error }) => {
            if (error && !/function .* does not exist/i.test(error.message)) {
              console.error('[api/app/pauta/eventos]', error.message)
            }
          }),
      ),
    )
  } catch (e) {
    console.error('[api/app/pauta/eventos]', e)
  }
  return new Response(null, { status: 204, headers: SIN_CACHE })
}
