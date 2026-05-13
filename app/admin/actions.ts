'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Helper: fetch directo al REST API de Supabase usando el JWT del usuario
// Usa NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (confirmado correcto) + JWT de sesión
// No depende de SUPABASE_SECRET_KEY
async function supabaseRest(
  accessToken: string,
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  body?: unknown
): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !anonKey) {
    return { ok: false, error: 'Variables de entorno de Supabase no configuradas' }
  }

  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`[supabaseRest] ${method} ${path} → ${res.status}:`, text)
    try {
      const json = JSON.parse(text)
      return { ok: false, error: json.message ?? json.error ?? text }
    } catch {
      return { ok: false, error: text || `Error ${res.status}` }
    }
  }

  return { ok: true }
}

// ---- AUTH ----

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  redirect('/admin')
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) return { error: error.message }

  return { success: 'Cuenta creada. Un administrador debe aprobar tu acceso.' }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

// ---- ARTICLES ----

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export async function saveArticle(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return { error: 'Sesión expirada. Por favor recarga la página.' }

  const id = formData.get('article_id') as string
  const title = formData.get('title') as string
  const slug = (formData.get('slug') as string) || generateSlug(title)
  const excerpt = formData.get('excerpt') as string
  const content = formData.get('content') as string
  const category_slug = formData.get('category_slug') as string
  const image_url = formData.get('image_url') as string
  const author_name = formData.get('author_name') as string
  const read_time = parseInt(formData.get('read_time') as string) || 5
  const is_published = formData.get('is_published') === 'true'
  const published_at = (formData.get('published_at') as string) || new Date().toISOString()

  const payload = {
    title,
    slug,
    excerpt,
    content,
    category_slug,
    image_url: image_url || null,
    author_name,
    read_time,
    is_published,
    published_at,
    author_id: user.id,
  }

  // Llamada directa al REST API con el JWT del usuario autenticado
  let result: { ok: boolean; error?: string }
  if (id) {
    result = await supabaseRest(session.access_token, `articles?id=eq.${id}`, 'PATCH', payload)
  } else {
    result = await supabaseRest(session.access_token, 'articles', 'POST', payload)
  }

  if (!result.ok) return { error: result.error ?? 'Error al guardar el artículo' }

  revalidatePath('/')
  revalidatePath(`/categoria/${category_slug}`)
  if (id) revalidatePath(`/articulo/${slug}`)

  return { redirect: '/admin/articulos' }
}

export async function deleteArticle(id: string, categorySlug: string, slug: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return { error: 'Sesión expirada' }

  const result = await supabaseRest(session.access_token, `articles?id=eq.${id}`, 'DELETE')
  if (!result.ok) {
    console.error('[deleteArticle]', result.error)
    return { error: result.error }
  }

  revalidatePath('/')
  revalidatePath(`/categoria/${categorySlug}`)
  revalidatePath(`/articulo/${slug}`)

  return { redirect: '/admin/articulos' }
}

export async function togglePublish(id: string, currentState: boolean): Promise<void> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return

  const result = await supabaseRest(
    session.access_token,
    `articles?id=eq.${id}`,
    'PATCH',
    { is_published: !currentState }
  )
  if (!result.ok) {
    console.error('[togglePublish]', result.error)
    return
  }
  revalidatePath('/')
  revalidatePath('/admin/articulos')
}

// ---- USERS (solo admin) ----

export async function updateUserRole(userId: string, role: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Verificar rol via RPC (bypasea RLS) con fallback a app_metadata
  let myRole = (user.app_metadata as Record<string, string>)?.role ?? 'lector'
  try {
    const { data: rpcData } = await supabase.rpc('get_my_profile')
    if (Array.isArray(rpcData) && rpcData.length > 0) {
      myRole = (rpcData[0] as { role: string }).role || myRole
    }
  } catch { /* usar app_metadata */ }
  if (myRole !== 'admin') return { error: 'Sin permisos' }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return { error: 'Sesión expirada' }

  const result = await supabaseRest(session.access_token, `profiles?id=eq.${userId}`, 'PATCH', { role })
  if (!result.ok) return { error: result.error ?? 'Error al actualizar el rol' }

  revalidatePath('/admin/usuarios')
  return { success: true }
}
