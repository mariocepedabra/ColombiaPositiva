'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

  if (id) {
    const { error } = await supabase.from('articles').update(payload).eq('id', id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('articles').insert(payload)
    if (error) return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath(`/categoria/${category_slug}`)
  if (id) revalidatePath(`/articulo/${slug}`)

  redirect('/admin/articulos')
}

export async function deleteArticle(id: string, categorySlug: string, slug: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath(`/categoria/${categorySlug}`)
  revalidatePath(`/articulo/${slug}`)

  redirect('/admin/articulos')
}

export async function togglePublish(id: string, currentState: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('articles')
    .update({ is_published: !currentState })
    .eq('id', id)
  if (error) return { error: error.message }

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

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('profiles')
    .update({ role })
    .eq('id', userId)
  if (error) return { error: error.message }

  revalidatePath('/admin/usuarios')
  return { success: true }
}
