import { createClient } from '@/lib/supabase/server'
import { Article } from '@/lib/data'
import { IMAGEN_RESPALDO } from '@/lib/imagenes'

export type DbArticle = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category_slug: string
  image_url: string | null
  author_name: string
  author_id: string | null
  is_published: boolean
  published_at: string
  read_time: number
  view_count: number
  created_at: string
  updated_at: string
  // Origen cuando la nota llega sindicada desde Página 10 (ver
  // app/api/ingesta-p10). En las notas propias van a null.
  p10_post_id?: number | null
  p10_url?: string | null
}

export type Profile = {
  id: string
  full_name: string
  role: 'admin' | 'columnista' | 'lector'
  created_at: string
}

function normalize(db: DbArticle): Article {
  return {
    id: db.id,
    slug: db.slug,
    title: db.title,
    excerpt: db.excerpt ?? '',
    content: db.content ?? '',
    category: db.category_slug,
    author: db.author_name,
    publishedAt: db.published_at,
    readTime: db.read_time ?? 5,
    // Sin foto propia va la portada genérica de la marca, no una imagen
    // aleatoria de un banco de fotos ajeno a la noticia.
    imageUrl: db.image_url?.trim() || IMAGEN_RESPALDO,
    p10Url: db.p10_url?.trim() || null,
  }
}

// Artículos más recientes (para hero y ticker)
export async function getRecentArticles(limit = 4): Promise<Article[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(limit)
  return (data ?? []).map(normalize)
}

// Top artículos más leídos
export async function getTopArticles(limit = 10): Promise<Article[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('is_published', true)
    .order('view_count', { ascending: false, nullsFirst: false })
    .order('published_at', { ascending: false })
    .limit(limit)
  return (data ?? []).map(normalize)
}

// Artículos por categoría
export async function getArticlesByCategory(categorySlug: string, limit = 4, offset = 0): Promise<Article[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('is_published', true)
    .eq('category_slug', categorySlug)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)
  return (data ?? []).map(normalize)
}

// Total de artículos por categoría (para paginación)
export async function getArticleCountByCategory(categorySlug: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('category_slug', categorySlug)
  return count ?? 0
}

// Artículo por slug (público)
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  return data ? normalize(data) : null
}

// Todos los slugs publicados (para generateStaticParams no aplica — usamos ISR)
export async function getAllSlugs(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('slug')
    .eq('is_published', true)
  return (data ?? []).map((a) => a.slug)
}

// ---- ADMIN: funciones que requieren autenticación ----

// Helper: fetch directo al REST API de Supabase con el JWT del usuario autenticado
// Mismo enfoque que saveArticle/deleteArticle — evita dependencia de SUPABASE_SECRET_KEY
async function restFetch<T>(
  accessToken: string,
  path: string,
): Promise<T[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !anonKey) return []

  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: 'GET',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`[restFetch] GET ${path} → ${res.status}:`, text)
    return []
  }

  const data = await res.json()
  return Array.isArray(data) ? data : []
}

// Todos los artículos (con borradores) — usa session token para bypasear problemas de RLS
export async function getAllArticlesAdmin(accessToken?: string): Promise<DbArticle[]> {
  try {
    if (accessToken) {
      return await restFetch<DbArticle>(
        accessToken,
        'articles?select=*&order=created_at.desc'
      )
    }
    // Fallback: cliente normal (requiere RLS permisivo)
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error('[getAllArticlesAdmin]', error.message)
    return data ?? []
  } catch (e) {
    console.error('[getAllArticlesAdmin] excepción:', e)
    return []
  }
}

// ---- ADMIN: listado y conteos que superan el tope de 1000 filas de PostgREST ----

// Fila liviana para la lista/tablas del panel (sin traer content/excerpt/image)
export type AdminArticleRow = Pick<
  DbArticle,
  'id' | 'title' | 'slug' | 'author_name' | 'author_id' | 'category_slug'
  | 'published_at' | 'is_published' | 'view_count' | 'created_at'
>

const ADMIN_LIST_FIELDS =
  'id,title,slug,author_name,author_id,category_slug,published_at,is_published,view_count,created_at'

function restBase(): { url?: string; anonKey?: string } {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  }
}

// Conteos exactos vía header Content-Range (no descarga filas)
export async function getAdminArticleCounts(
  accessToken?: string,
  authorId?: string,
): Promise<{ total: number; published: number; drafts: number }> {
  const { url, anonKey } = restBase()
  if (!url || !anonKey || !accessToken) return { total: 0, published: 0, drafts: 0 }
  const authFilter = authorId ? `&author_id=eq.${authorId}` : ''

  async function count(extra: string): Promise<number> {
    const res = await fetch(`${url}/rest/v1/articles?select=id${authFilter}${extra}`, {
      headers: {
        apikey: anonKey!,
        Authorization: `Bearer ${accessToken}`,
        Range: '0-0',
        Prefer: 'count=exact',
      },
      cache: 'no-store',
    })
    const cr = res.headers.get('content-range') // "0-0/1234"
    const n = cr ? parseInt(cr.split('/')[1], 10) : NaN
    return Number.isNaN(n) ? 0 : n
  }

  const total = await count('')
  const published = await count('&is_published=eq.true')
  return { total, published, drafts: total - published }
}

// Lista COMPLETA para el panel — pagina por offset hasta traer todas las filas
export async function getAdminArticleList(
  accessToken?: string,
  authorId?: string,
): Promise<AdminArticleRow[]> {
  const { url, anonKey } = restBase()
  if (!url || !anonKey || !accessToken) return []
  const authFilter = authorId ? `&author_id=eq.${authorId}` : ''
  const PAGE = 1000
  const out: AdminArticleRow[] = []
  try {
    for (let offset = 0; ; offset += PAGE) {
      const res = await fetch(
        // Orden: de la más nueva a la más antigua (por fecha de publicación)
        `${url}/rest/v1/articles?select=${ADMIN_LIST_FIELDS}${authFilter}&order=published_at.desc&offset=${offset}&limit=${PAGE}`,
        {
          headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
          cache: 'no-store',
        },
      )
      if (!res.ok) {
        console.error('[getAdminArticleList]', res.status, await res.text())
        break
      }
      const rows = (await res.json()) as AdminArticleRow[]
      if (!Array.isArray(rows) || rows.length === 0) break
      out.push(...rows)
      if (rows.length < PAGE) break
    }
  } catch (e) {
    console.error('[getAdminArticleList] excepción:', e)
  }
  return out
}

// Artículos más recientes para el dashboard (liviano)
export async function getRecentAdminArticles(
  accessToken?: string,
  limit = 5,
  authorId?: string,
): Promise<AdminArticleRow[]> {
  const { url, anonKey } = restBase()
  if (!url || !anonKey || !accessToken) return []
  const authFilter = authorId ? `&author_id=eq.${authorId}` : ''
  const res = await fetch(
    `${url}/rest/v1/articles?select=${ADMIN_LIST_FIELDS}${authFilter}&order=created_at.desc&limit=${limit}`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` }, cache: 'no-store' },
  )
  if (!res.ok) return []
  const rows = await res.json()
  return Array.isArray(rows) ? rows : []
}

// Top artículos por visitas para la página de estadísticas (server-side, ordenado)
export async function getArticlesByViewsAdmin(
  accessToken?: string,
  limit = 200,
  authorId?: string,
): Promise<AdminArticleRow[]> {
  const { url, anonKey } = restBase()
  if (!url || !anonKey || !accessToken) return []
  const authFilter = authorId ? `&author_id=eq.${authorId}` : ''
  const res = await fetch(
    `${url}/rest/v1/articles?select=${ADMIN_LIST_FIELDS}${authFilter}&order=view_count.desc.nullslast&limit=${limit}`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` }, cache: 'no-store' },
  )
  if (!res.ok) return []
  const rows = await res.json()
  return Array.isArray(rows) ? rows : []
}

// Artículo por ID para edición — usa session token
export async function getArticleById(id: string, accessToken?: string): Promise<DbArticle | null> {
  try {
    if (accessToken) {
      const rows = await restFetch<DbArticle>(
        accessToken,
        `articles?select=*&id=eq.${id}&limit=1`
      )
      return rows[0] ?? null
    }
    const supabase = await createClient()
    const { data } = await supabase.from('articles').select('*').eq('id', id).single()
    return data ?? null
  } catch (e) {
    console.error('[getArticleById] excepción:', e)
    return null
  }
}

// Todos los perfiles de usuario (solo admin)
export async function getAllProfiles(accessToken?: string): Promise<Profile[]> {
  try {
    if (accessToken) {
      return await restFetch<Profile>(
        accessToken,
        'profiles?select=*&order=created_at.desc'
      )
    }
    const supabase = await createClient()
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (error) console.error('[getAllProfiles]', error.message)
    return data ?? []
  } catch (e) {
    console.error('[getAllProfiles] excepción:', e)
    return []
  }
}

// Submissions de Nota Positiva (solo admin)
export async function getNotaPositivaSubmissions(accessToken?: string) {
  try {
    if (accessToken) {
      return await restFetch(
        accessToken,
        'nota_positiva_submissions?select=*&order=created_at.desc'
      )
    }
    const supabase = await createClient()
    const { data, error } = await supabase.from('nota_positiva_submissions').select('*').order('created_at', { ascending: false })
    if (error) console.error('[getNotaPositivaSubmissions]', error.message)
    return data ?? []
  } catch (e) {
    console.error('[getNotaPositivaSubmissions] excepción:', e)
    return []
  }
}
