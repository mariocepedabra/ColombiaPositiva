import { unstable_cache } from 'next/cache'

import type { DbArticle } from '@/lib/articles'
import { categories } from '@/lib/data'
import { articleUrl } from '@/lib/site'
import { createAnonClient } from '@/lib/supabase/anon'
import type { ConteosSecciones, NotaCompleta, NotaResumen, PaginaSeccion, ResultadoBusqueda, SlugSeccion } from './contratos'
import { htmlATextoPlano, normalizarCuerpo } from './cuerpo'
import { aNotaResumen, CAMPOS_RESUMEN, esFirmaInstitucional, type FilaResumen } from './notas'

export const TAG_NOTAS = 'app-notas'
const SEGUNDOS_CACHE = 60
const POR_PAGINA_MAX = 50
export const POR_PAGINA = 20

// ---- Nota completa ----

// Parte pública y cacheable de la nota (sin nada que dependa del usuario).
type NotaBase = Omit<NotaCompleta, 'puedeCopiar'>

async function construirNota(slug: string): Promise<NotaBase | null> {
  const supabase = createAnonClient()
  const { data } = await supabase
    .from('articles')
    .select(`${CAMPOS_RESUMEN},content,p10_url`)
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()
  if (!data) return null

  const fila = data as FilaResumen & Pick<DbArticle, 'content' | 'p10_url'>
  const resumen = aNotaResumen(fila)

  const { data: masDeLaSeccion } = await supabase
    .from('articles')
    .select(CAMPOS_RESUMEN)
    .eq('is_published', true)
    .eq('category_slug', fila.category_slug)
    .neq('slug', slug)
    .order('published_at', { ascending: false })
    .limit(4)

  const cuerpoHtml = normalizarCuerpo(fila.content ?? '')

  // Retrato del columnista: la foto de su nota más reciente (como en su perfil).
  let autorRetrato: string | null = null
  const firma = (fila.author_name ?? '').trim()
  if (firma && !esFirmaInstitucional(firma)) {
    const { data: propias } = await supabase
      .from('articles')
      .select('image_url')
      .eq('is_published', true)
      .eq('author_name', firma)
      .not('image_url', 'is', null)
      .order('published_at', { ascending: false })
      .limit(1)
    const foto = (propias?.[0] as { image_url?: string } | undefined)?.image_url?.trim()
    autorRetrato = foto && foto.startsWith('http') ? foto : null
  }

  return {
    ...resumen,
    cuerpoHtml,
    textoPlano: htmlATextoPlano(cuerpoHtml),
    p10Url: fila.p10_url?.trim() || null,
    // La web no bloquea contenido a nadie; la app deja la pantalla de bloqueo
    // lista por si un día se marcan notas premium.
    bloqueada: false,
    relacionadas: ((masDeLaSeccion ?? []) as FilaResumen[]).map(aNotaResumen),
    urlWeb: articleUrl(slug),
    autorRetrato,
  }
}

export const notaCacheada = unstable_cache(construirNota, ['app-nota-v1'], {
  revalidate: SEGUNDOS_CACHE,
  tags: [TAG_NOTAS],
})

// ---- Sección paginada ----

async function construirPaginaSeccion(slug: string, pagina: number, porPagina: number): Promise<PaginaSeccion | null> {
  const categoria = categories.find((c) => c.slug === slug)
  if (!categoria) return null

  const supabase = createAnonClient()
  const desde = (pagina - 1) * porPagina
  const [{ data }, { count }] = await Promise.all([
    supabase
      .from('articles')
      .select(CAMPOS_RESUMEN)
      .eq('is_published', true)
      .eq('category_slug', slug)
      .order('published_at', { ascending: false })
      .range(desde, desde + porPagina - 1),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('is_published', true).eq('category_slug', slug),
  ])

  const total = count ?? 0
  return {
    seccion: { slug: slug as SlugSeccion, nombre: categoria.name, color: categoria.color },
    total,
    pagina,
    porPagina,
    haySiguiente: desde + porPagina < total,
    notas: ((data ?? []) as FilaResumen[]).map(aNotaResumen),
  }
}

export const paginaSeccionCacheada = unstable_cache(construirPaginaSeccion, ['app-seccion-v1'], {
  revalidate: SEGUNDOS_CACHE,
  tags: [TAG_NOTAS],
})

export function porPaginaValido(valor: string | null): number {
  const n = parseInt(valor ?? '', 10)
  if (!Number.isFinite(n) || n < 1) return POR_PAGINA
  return Math.min(n, POR_PAGINA_MAX)
}

export function paginaValida(valor: string | null): number {
  const n = parseInt(valor ?? '', 10)
  return Number.isFinite(n) && n >= 1 ? n : 1
}

// ---- Búsqueda ----

async function construirBusqueda(consulta: string): Promise<ResultadoBusqueda> {
  const { data } = await createAnonClient().rpc('search_articles_fuzzy', {
    search_query: consulta,
    result_limit: 20,
  })
  return { consulta, notas: ((data ?? []) as FilaResumen[]).map(aNotaResumen) }
}

export const busquedaCacheada = unstable_cache(construirBusqueda, ['app-buscar-v1'], {
  revalidate: 300,
  tags: [TAG_NOTAS],
})

// ---- Conteos por sección ----

async function construirConteos(): Promise<ConteosSecciones> {
  const supabase = createAnonClient()
  const conteos = await Promise.all(
    categories.map(async (c) => {
      const { count } = await supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true)
        .eq('category_slug', c.slug)
      return { slug: c.slug as SlugSeccion, nombre: c.name, color: c.color, total: count ?? 0 }
    }),
  )
  return { total: conteos.reduce((s, c) => s + c.total, 0), secciones: conteos }
}

export const conteosCacheados = unstable_cache(construirConteos, ['app-secciones-v1'], {
  revalidate: 300,
  tags: [TAG_NOTAS],
})

export type { NotaResumen }
