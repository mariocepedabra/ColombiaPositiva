import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

// Artículos por categoría
export async function getArticlesByCategory(categorySlug: string, limit = 4): Promise<Article[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('is_published', true)
    .eq('category_slug', categorySlug)
    .order('published_at', { ascending: false })
    .limit(limit)
  return (data ?? []).map(normalize)
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

// Helper: admin client solo si la clave parece válida (sb_secret_... o eyJ...)
// Esto evita queries fallidas silenciosas cuando la clave está mal configurada
function safeAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY ?? ''
  if (!key || (!key.startsWith('sb_secret_') && !key.startsWith('eyJ'))) {
    console.warn('[safeAdminClient] SUPABASE_SECRET_KEY no parece válida — usando cliente normal')
    return null
  }
  try {
    return createAdminClient()
  } catch (e) {
    console.error('[safeAdminClient] No se pudo crear el cliente admin:', e)
    return null
  }
}

// Todos los artículos (con borradores) — usa admin client para bypasear RLS
export async function getAllArticlesAdmin(): Promise<DbArticle[]> {
  try {
    const admin = safeAdminClient()
    if (!admin) {
      // Fallback: cliente normal con RLS
      const supabase = await createClient()
      const { data } = await supabase.from('articles').select('*').order('created_at', { ascending: false })
      return data ?? []
    }
    const { data, error } = await admin.from('articles').select('*').order('created_at', { ascending: false })
    if (error) console.error('[getAllArticlesAdmin]', error.message)
    return data ?? []
  } catch (e) {
    console.error('[getAllArticlesAdmin] excepción:', e)
    return []
  }
}

// Artículo por ID para edición — usa admin client
export async function getArticleById(id: string): Promise<DbArticle | null> {
  try {
    const admin = safeAdminClient()
    if (!admin) {
      const supabase = await createClient()
      const { data } = await supabase.from('articles').select('*').eq('id', id).single()
      return data ?? null
    }
    const { data } = await admin.from('articles').select('*').eq('id', id).single()
    return data ?? null
  } catch (e) {
    console.error('[getArticleById] excepción:', e)
    return null
  }
}

// Todos los perfiles de usuario (solo admin)
export async function getAllProfiles(): Promise<Profile[]> {
  try {
    const admin = safeAdminClient()
    if (!admin) return []
    const { data } = await admin.from('profiles').select('*').order('created_at', { ascending: false })
    return data ?? []
  } catch (e) {
    console.error('[getAllProfiles] excepción:', e)
    return []
  }
}

// Submissions de Nota Positiva (solo admin)
export async function getNotaPositivaSubmissions() {
  try {
    const admin = safeAdminClient()
    if (!admin) return []
    const { data } = await admin.from('nota_positiva_submissions').select('*').order('created_at', { ascending: false })
    return data ?? []
  } catch (e) {
    console.error('[getNotaPositivaSubmissions] excepción:', e)
    return []
  }
}
