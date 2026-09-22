import { unstable_cache } from 'next/cache'

import type { Ad } from '@/lib/ads'
import { categories, breakingNewsFallback } from '@/lib/data'
import { CONTACT_EMAIL, SITE_URL } from '@/lib/site'
import { createAnonClient } from '@/lib/supabase/anon'
import { VERSION_CONTRATO, type Anuncio, type BloqueSeccion, type MovimientoRanking, type NotaRanking, type NotaResumen, type Portada, type SlugSeccion } from './contratos'
import { aNotaResumen, CAMPOS_RESUMEN, type FilaResumen } from './notas'
import { historiasPortada } from './videos'

// Construye la portada completa de la app en UNA sola respuesta. Replica el
// orden y los datos de app/page.tsx: ticker, principales, más leídas,
// secciones (4 notas cada una), historias (videos) y pauta por zona.

export const TAG_PORTADA = 'app-home'
const SEGUNDOS_CACHE = 60

const REDES_SOCIALES: Portada['redesSociales'] = [
  { red: 'facebook', url: 'https://www.facebook.com/profile.php?id=100066399406261' },
  { red: 'instagram', url: 'https://www.instagram.com/colombiapositiva10/' },
  { red: 'tiktok', url: 'https://www.tiktok.com/@colombia.positiva' },
]

const ENLACES: Portada['enlaces'] = {
  sitio: SITE_URL,
  suscripcion: `${SITE_URL}/suscripcion`,
  pauta: `${SITE_URL}/pauta`,
  notaPositiva: `${SITE_URL}/nota-positiva`,
  contacto: `${SITE_URL}/contacto`,
  privacidad: `${SITE_URL}/privacidad`,
  correoContacto: CONTACT_EMAIL,
}


// ---- Consultas ----

async function notasRecientes(limite: number): Promise<NotaResumen[]> {
  const { data } = await createAnonClient()
    .from('articles')
    .select(CAMPOS_RESUMEN)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(limite)
  return ((data ?? []) as FilaResumen[]).map(aNotaResumen)
}

async function notasPorSeccion(slug: string, limite: number): Promise<NotaResumen[]> {
  const { data } = await createAnonClient()
    .from('articles')
    .select(CAMPOS_RESUMEN)
    .eq('is_published', true)
    .eq('category_slug', slug)
    .order('published_at', { ascending: false })
    .limit(limite)
  return ((data ?? []) as FilaResumen[]).map(aNotaResumen)
}

// Más leídas de la semana (vistas diarias). Si la migración aún no se corrió
// o todavía no hay datos, cae al contador acumulado, que es lo que muestra la
// web hoy.
async function masLeidas(limite: number): Promise<Portada['masLeidas']> {
  const supabase = createAnonClient()
  try {
    const { data, error } = await supabase.rpc('top_articles_week', { result_limit: limite })
    if (!error && Array.isArray(data) && data.length >= 3) {
      const notas = (data as FilaResumen[]).map(aNotaResumen)
      return { periodo: 'semana', notas: await conMovimiento(notas) }
    }
  } catch {
    /* sin función todavía */
  }
  const { data } = await supabase
    .from('articles')
    .select(CAMPOS_RESUMEN)
    .eq('is_published', true)
    .order('view_count', { ascending: false, nullsFirst: false })
    .order('published_at', { ascending: false })
    .limit(limite)
  const notas = ((data ?? []) as FilaResumen[]).map(aNotaResumen)
  return { periodo: 'historico', notas: notas.map((n) => ({ ...n, movimiento: null, posicionAnterior: null })) }
}

// Fecha de Bogotá (Colombia no cambia de hora) desplazada `dias` días, como YYYY-MM-DD.
function diaBogota(dias: number): string {
  return new Date(Date.now() - 5 * 3_600_000 + dias * 86_400_000).toISOString().slice(0, 10)
}

// Compara el ranking de hoy con el que había ayer (la misma ventana de 7 días
// terminando ayer) para pintar ↑ ↓ = o "nueva". Se calcula aquí con las
// filas diarias, sin otra función SQL. Si algo falla, el ranking sale sin
// movimientos (nunca rompe la portada).
async function conMovimiento(notas: NotaResumen[]): Promise<NotaRanking[]> {
  const sinDatos = notas.map((n) => ({ ...n, movimiento: null, posicionAnterior: null }))
  try {
    const { data, error } = await createAnonClient()
      .from('article_views_daily')
      .select('slug,day,views')
      .gte('day', diaBogota(-7))
      .lte('day', diaBogota(-1))
      .order('views', { ascending: false })
      .limit(1000)
    if (error || !data) return sinDatos
    const suma = new Map<string, number>()
    for (const fila of data as { slug: string; day: string; views: number }[]) {
      suma.set(fila.slug, (suma.get(fila.slug) ?? 0) + Number(fila.views))
    }
    if (suma.size === 0) return sinDatos
    const ayer = [...suma.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([slug]) => slug)
    return notas.map((n, i) => {
      const indice = ayer.indexOf(n.slug)
      const posicionAnterior = indice >= 0 ? indice + 1 : null
      let movimiento: MovimientoRanking = 'nueva'
      if (posicionAnterior !== null) movimiento = posicionAnterior > i + 1 ? 'sube' : posicionAnterior < i + 1 ? 'baja' : 'igual'
      return { ...n, movimiento, posicionAnterior }
    })
  } catch {
    return sinDatos
  }
}

// Todos los anuncios activos y vigentes, agrupados por zona (una sola consulta
// en lugar de una por zona como hace la web).
async function pautaPorZona(): Promise<Record<string, Anuncio[]>> {
  const ahora = new Date().toISOString()
  const { data } = await createAnonClient()
    .from('ad_submissions')
    .select('id,advertiser_name,company,target_url,media_type,media_url,start_date,end_date,zones,sort_order,created_at')
    .eq('status', 'activo')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  const porZona: Record<string, Anuncio[]> = {}
  for (const ad of (data ?? []) as Ad[]) {
    const vigente = (!ad.start_date || ad.start_date <= ahora) && (!ad.end_date || ad.end_date >= ahora)
    if (!vigente || !ad.media_url) continue
    const anuncio: Anuncio = {
      id: ad.id,
      tipo: ad.media_type === 'video' ? 'video' : 'imagen',
      media: ad.media_url,
      enlace: ad.target_url?.trim() || null,
      anunciante: ad.advertiser_name,
      empresa: ad.company,
    }
    for (const zona of ad.zones ?? []) {
      ;(porZona[zona] ??= []).push(anuncio)
    }
  }
  return porZona
}

// ---- Portada ----

export async function construirPortada(): Promise<Portada> {
  const [principales, leidas, porSeccion, pauta, hist] = await Promise.all([
    notasRecientes(10),
    masLeidas(10),
    Promise.all(categories.map((c) => notasPorSeccion(c.slug, 4))),
    pautaPorZona(),
    historiasPortada(),
  ])

  const ticker =
    principales.length > 0
      ? principales.slice(0, 5).map((n) => ({ titulo: n.titulo, slug: n.slug }))
      : breakingNewsFallback.map((titulo) => ({ titulo, slug: null }))

  const secciones: BloqueSeccion[] = categories
    .map((c, i) => ({ slug: c.slug as SlugSeccion, nombre: c.name, color: c.color, notas: porSeccion[i] ?? [] }))
    .filter((s) => s.notas.length > 0)

  return {
    version: VERSION_CONTRATO,
    generadoEn: new Date().toISOString(),
    ticker,
    principales,
    masLeidas: leidas,
    secciones,
    historias: hist,
    pauta,
    redesSociales: REDES_SOCIALES,
    enlaces: ENLACES,
  }
}

// Versión cacheada: un minuto, igual que el `revalidate` de la portada web.
// Miles de teléfonos abriendo la app a la vez leen esto, no la base de datos.
export const portadaCacheada = unstable_cache(construirPortada, ['app-home-v1'], {
  revalidate: SEGUNDOS_CACHE,
  tags: [TAG_PORTADA],
})

// Para `?fresh=1` (tirar para refrescar): salta la caché, pero si varios
// teléfonos refrescan en la misma ventana comparten UNA construcción.
const VENTANA_FRESCA_MS = 5_000
let construccionFresca: { en: number; promesa: Promise<Portada> } | null = null

export function portadaFresca(): Promise<Portada> {
  const ahora = Date.now()
  if (construccionFresca && ahora - construccionFresca.en < VENTANA_FRESCA_MS) {
    return construccionFresca.promesa
  }
  const promesa = construirPortada()
  construccionFresca = { en: ahora, promesa }
  promesa.catch(() => {
    construccionFresca = null
  })
  return promesa
}
