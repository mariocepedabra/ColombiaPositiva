import { unstable_cache } from 'next/cache'

import { readConfigJson } from '@/lib/app-config-store'
import { createAnonClient } from '@/lib/supabase/anon'
import type { Columnistas, NotaResumen, PaginaAutor, ResumenAutor } from './contratos'
import { TAG_NOTAS } from './nota'
import { aNotaResumen, CAMPOS_RESUMEN, esFirmaInstitucional, type FilaResumen } from './notas'

// Columnistas de Colombia Positiva. No existe una tabla de autores: cada
// firma es el texto `author_name` de sus notas. El perfil se deriva de ellas
// (retrato = foto de su nota más reciente, "publica desde" = su primera nota).
// Una biografía o un retrato propio pueden añadirse sin tocar código en el
// archivo app-config/autores.json del bucket privado:
//   { "Nombre tal cual firma": { "bio": "…", "foto": "https://…" } }

const SEGUNDOS_CACHE = 600
export const POR_PAGINA_AUTOR = 20
const PAGINA_BD = 1000

type Extra = { bio?: string; foto?: string }
type Extras = Record<string, Extra>

async function extrasAutores(): Promise<Extras> {
  return readConfigJson<Extras>('autores.json', {})
}

// Todas las notas publicadas (solo los campos de listado), de la más nueva a
// la más antigua. PostgREST corta en 1000 filas: se pagina.
async function todasLasNotas(): Promise<FilaResumen[]> {
  const supabase = createAnonClient()
  const filas: FilaResumen[] = []
  for (let desde = 0; ; desde += PAGINA_BD) {
    const { data, error } = await supabase
      .from('articles')
      .select(CAMPOS_RESUMEN)
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .range(desde, desde + PAGINA_BD - 1)
    if (error || !data) break
    filas.push(...(data as FilaResumen[]))
    if (data.length < PAGINA_BD) break
  }
  return filas
}

function construirResumen(nombre: string, notas: NotaResumen[], extra?: Extra): ResumenAutor {
  const ultima = notas[0]
  const primera = notas[notas.length - 1]
  return {
    nombre,
    retrato: extra?.foto?.trim() || notas.find((n) => n.imagen)?.imagen || null,
    bio: extra?.bio?.trim() || null,
    totalNotas: notas.length,
    desde: primera.publicadoEn,
    ultimaNota: ultima,
  }
}

async function construirColumnistas(): Promise<Columnistas> {
  const [filas, extras] = await Promise.all([todasLasNotas(), extrasAutores()])

  // Agrupar por firma conservando el orden (más reciente primero).
  const porAutor = new Map<string, NotaResumen[]>()
  for (const fila of filas) {
    const nombre = (fila.author_name ?? '').trim()
    if (!nombre || esFirmaInstitucional(nombre)) continue
    const lista = porAutor.get(nombre) ?? []
    lista.push(aNotaResumen(fila))
    porAutor.set(nombre, lista)
  }

  const autores = [...porAutor.entries()]
    .map(([nombre, notas]) => construirResumen(nombre, notas, extras[nombre]))
    .sort((a, b) => b.ultimaNota.publicadoEn.localeCompare(a.ultimaNota.publicadoEn))

  return {
    generadoEn: new Date().toISOString(),
    masLeido: await masLeidoDeLaSemana(porAutor, autores),
    autores,
  }
}

// El columnista de la nota más leída de la semana (vistas diarias). Sin la
// migración, el de la nota con más vistas acumuladas.
async function masLeidoDeLaSemana(
  porAutor: Map<string, NotaResumen[]>,
  autores: ResumenAutor[],
): Promise<Columnistas['masLeido']> {
  const supabase = createAnonClient()
  const buscar = (nombre: string) => autores.find((a) => a.nombre === nombre)

  try {
    const { data, error } = await supabase.rpc('top_articles_week', { result_limit: 30 })
    if (!error && Array.isArray(data)) {
      for (const fila of data as FilaResumen[]) {
        const autor = buscar((fila.author_name ?? '').trim())
        if (autor) return { periodo: 'semana', autor, nota: aNotaResumen(fila) }
      }
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
    .limit(30)
  for (const fila of (data ?? []) as FilaResumen[]) {
    const autor = buscar((fila.author_name ?? '').trim())
    if (autor) return { periodo: 'historico', autor, nota: aNotaResumen(fila) }
  }

  // Sin vistas de nadie: el que publicó más recientemente.
  const primero = autores[0]
  return primero && porAutor.get(primero.nombre)?.[0] ? { periodo: 'historico', autor: primero, nota: primero.ultimaNota } : null
}

export const columnistasCacheados = unstable_cache(construirColumnistas, ['app-autores-v1'], {
  revalidate: SEGUNDOS_CACHE,
  tags: [TAG_NOTAS],
})

// ---- Perfil paginado ----

async function construirPaginaAutor(nombre: string, pagina: number): Promise<PaginaAutor | null> {
  const firma = nombre.trim()
  if (!firma || esFirmaInstitucional(firma)) return null

  const supabase = createAnonClient()
  const desde = (pagina - 1) * POR_PAGINA_AUTOR
  const [{ data: notas }, { count }, { data: primera }, extras] = await Promise.all([
    supabase
      .from('articles')
      .select(CAMPOS_RESUMEN)
      .eq('is_published', true)
      .eq('author_name', firma)
      .order('published_at', { ascending: false })
      .range(desde, desde + POR_PAGINA_AUTOR - 1),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('is_published', true).eq('author_name', firma),
    supabase
      .from('articles')
      .select('published_at')
      .eq('is_published', true)
      .eq('author_name', firma)
      .order('published_at', { ascending: true })
      .limit(1),
    extrasAutores(),
  ])

  const total = count ?? 0
  if (total === 0) return null

  const lista = ((notas ?? []) as FilaResumen[]).map(aNotaResumen)
  // El retrato sale de la nota más reciente con foto: en la página 1 ya la
  // tenemos; en las siguientes se pide aparte para no depender de la página.
  let retratoDe = lista
  if (pagina > 1) {
    const { data } = await supabase
      .from('articles')
      .select(CAMPOS_RESUMEN)
      .eq('is_published', true)
      .eq('author_name', firma)
      .order('published_at', { ascending: false })
      .limit(5)
    retratoDe = ((data ?? []) as FilaResumen[]).map(aNotaResumen)
  }
  const ultima = retratoDe[0] ?? lista[0]
  const extra = extras[firma]

  return {
    autor: {
      nombre: firma,
      retrato: extra?.foto?.trim() || retratoDe.find((n) => n.imagen)?.imagen || null,
      bio: extra?.bio?.trim() || null,
      totalNotas: total,
      desde: (primera?.[0] as { published_at?: string } | undefined)?.published_at ?? ultima.publicadoEn,
      ultimaNota: ultima,
    },
    total,
    pagina,
    porPagina: POR_PAGINA_AUTOR,
    haySiguiente: desde + POR_PAGINA_AUTOR < total,
    notas: lista,
  }
}

export const paginaAutorCacheada = unstable_cache(construirPaginaAutor, ['app-autor-v1'], {
  revalidate: SEGUNDOS_CACHE,
  tags: [TAG_NOTAS],
})
