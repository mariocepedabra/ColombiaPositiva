import { createAdminClient } from '@/lib/supabase/admin'
import { categories } from '@/lib/data'
import type { LoteEventosLectura, ResumenAlcance } from './contratos'

// Estadística anónima de lectura (base para vender alcance por sección y
// ciudad). Aquí NO llega nada que identifique a la persona: la app manda qué
// se abrió, la plataforma y un código de sesión al azar diario; el servidor
// añade la ciudad aproximada que Vercel deduce de la IP y descarta la IP.
// Sin la migración 2026-09-21_push_y_alcance.sql, los eventos se descartan.

const MAX_EVENTOS = 200
const TIPOS = new Set(['portada', 'nota', 'seccion', 'video', 'busqueda'])
const SECCIONES = new Set(categories.map((c) => c.slug))
const SLUG = /^[a-z0-9-]{1,200}$/
const SESION = /^[A-Za-z0-9_-]{8,64}$/

export type Geo = { ciudad: string | null; region: string | null; pais: string | null }

/** Ciudad aproximada según las cabeceras de Vercel (no se guarda la IP). */
export function geoDesdeCabeceras(h: Headers): Geo {
  const limpiar = (v: string | null) => {
    if (!v) return null
    try {
      return decodeURIComponent(v).trim().slice(0, 80) || null
    } catch {
      return v.trim().slice(0, 80) || null
    }
  }
  return {
    ciudad: limpiar(h.get('x-vercel-ip-city')),
    region: limpiar(h.get('x-vercel-ip-country-region')),
    pais: limpiar(h.get('x-vercel-ip-country')),
  }
}

export async function guardarEventos(lote: Partial<LoteEventosLectura>, geo: Geo): Promise<number> {
  const plataforma = lote.plataforma === 'ios' || lote.plataforma === 'android' || lote.plataforma === 'web' ? lote.plataforma : null
  const sesion = typeof lote.sesion === 'string' && SESION.test(lote.sesion) ? lote.sesion : null
  if (!plataforma || !sesion || !Array.isArray(lote.eventos)) return 0

  const ahora = Date.now()
  const filas = lote.eventos.slice(0, MAX_EVENTOS).flatMap((e) => {
    if (!e || !TIPOS.has(String(e.tipo))) return []
    const slug = typeof e.slug === 'string' && SLUG.test(e.slug) ? e.slug : null
    const seccion = typeof e.seccion === 'string' && SECCIONES.has(e.seccion) ? e.seccion : null
    // La hora la pone el teléfono (puede llegar en lote unos segundos después);
    // se acota a la última hora para que nadie meta fechas raras.
    const t = typeof e.en === 'number' ? e.en : ahora
    const en = new Date(Math.min(ahora, Math.max(ahora - 3_600_000, t)))
    const bogota = new Date(en.getTime() - 5 * 3_600_000) // Colombia no cambia de hora
    return [{
      type: e.tipo,
      slug,
      section: seccion,
      platform: plataforma,
      session: sesion,
      city: geo.ciudad,
      region: geo.region,
      country: geo.pais,
      occurred_at: en.toISOString(),
      day: bogota.toISOString().slice(0, 10),
      hour: bogota.getUTCHours(),
    }]
  })
  if (filas.length === 0) return 0

  try {
    const { error } = await createAdminClient().from('app_events').insert(filas)
    if (error) {
      if (!/does not exist/i.test(error.message)) console.error('[eventos]', error.message)
      return 0
    }
    return filas.length
  } catch {
    return 0
  }
}

export async function resumenAlcance(desde: string, hasta: string): Promise<ResumenAlcance | null> {
  try {
    const { data, error } = await createAdminClient().rpc('alcance_resumen', { p_desde: desde, p_hasta: hasta })
    if (error || !data) return null
    return data as ResumenAlcance
  } catch {
    return null
  }
}

export type FilaAlcance = { dia: string; seccion: string | null; ciudad: string | null; region: string | null; pais: string | null; plataforma: string; lecturas: number; sesiones: number }

export async function filasAlcance(desde: string, hasta: string): Promise<FilaAlcance[]> {
  try {
    const { data, error } = await createAdminClient().rpc('alcance_filas', { p_desde: desde, p_hasta: hasta })
    if (error || !data) return []
    return data as FilaAlcance[]
  } catch {
    return []
  }
}
