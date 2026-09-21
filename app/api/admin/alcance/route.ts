import type { NextRequest } from 'next/server'

import { filasAlcance } from '@/lib/app-api/eventos'
import { getCategoryBySlug } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/alcance?desde=YYYY-MM-DD&hasta=YYYY-MM-DD → CSV del alcance
// de la app (día, sección, ciudad, región, país, plataforma, lecturas,
// sesiones). Solo administradores con sesión en el panel.

export const dynamic = 'force-dynamic'

const FECHA = /^\d{4}-\d{2}-\d{2}$/

function csv(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('No autorizado', { status: 401 })
  let role = 'lector'
  try {
    const { data } = await supabase.rpc('get_my_profile')
    if (Array.isArray(data) && data.length > 0) role = (data[0] as { role: string }).role
  } catch { /* noop */ }
  if (role !== 'admin') return new Response('Solo administradores', { status: 403 })

  const q = request.nextUrl.searchParams
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
  const hasta = FECHA.test(q.get('hasta') ?? '') ? q.get('hasta')! : hoy
  const desde = FECHA.test(q.get('desde') ?? '') ? q.get('desde')! : new Date(Date.now() - 29 * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })

  const filas = await filasAlcance(desde, hasta)
  const cabecera = ['dia', 'seccion', 'seccion_nombre', 'ciudad', 'region', 'pais', 'plataforma', 'lecturas', 'sesiones']
  const lineas = [cabecera.join(';')]
  for (const f of filas) {
    lineas.push(
      [f.dia, f.seccion, f.seccion ? getCategoryBySlug(f.seccion)?.name ?? f.seccion : '', f.ciudad, f.region, f.pais, f.plataforma, f.lecturas, f.sesiones]
        .map(csv)
        .join(';'),
    )
  }
  // BOM para que Excel abra los acentos bien; punto y coma porque es lo que
  // Excel en español espera como separador.
  const cuerpo = '﻿' + lineas.join('\r\n')
  return new Response(cuerpo, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="alcance-app-${desde}-a-${hasta}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
