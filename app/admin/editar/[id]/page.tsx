import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getArticleById } from '@/lib/articles'
import ArticleForm from '@/components/admin/ArticleForm'
import Link from 'next/link'

export default async function EditarArticuloPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  const { data: { session } } = await supabase.auth.getSession()

  // Leer perfil via RPC (bypasea RLS) con fallback a app_metadata
  let profileRole = (user.app_metadata as Record<string, string> | null)?.role ?? 'lector'
  let profileFullName = ''
  try {
    const { data: rpcData } = await supabase.rpc('get_my_profile')
    if (Array.isArray(rpcData) && rpcData.length > 0) {
      const p = rpcData[0] as { role: string; full_name: string }
      profileRole = p.role || profileRole
      profileFullName = p.full_name || ''
    }
  } catch { /* usar app_metadata */ }

  const article = await getArticleById(id, session?.access_token)
  if (!article) notFound()

  // Columnistas solo pueden editar sus propios artículos
  if (profileRole === 'columnista' && article.author_id !== user.id) {
    notFound()
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/articulos" className="font-sans text-xs text-gris-400 hover:text-verde transition-colors">
          ← Artículos
        </Link>
        <span className="text-gris-300">/</span>
        <h1 className="font-heading font-700 text-2xl text-tinta">Editar nota</h1>
      </div>

      <ArticleForm
        article={article}
        authorName={profileFullName || 'Redacción Colombia Positiva'}
      />
    </div>
  )
}
