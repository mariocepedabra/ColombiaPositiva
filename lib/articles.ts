import { createClient } from '@/lib/supabase/server'
import { Article } from '@/lib/data'

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
    imageUrl: db.image_url ?? `https://picsum.photos/seed/${db.slug}/800/600`,
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
