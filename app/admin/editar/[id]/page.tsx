import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getArticleById } from '@/lib/articles'
import ArticleForm from '@/components/admin/ArticleForm'
import Link from 'next/link'

export default async function EditarArticuloPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user!.id).single()

  const article = await getArticleById(id)
  if (!article) notFound()

  // Columnistas solo pueden editar sus propios artículos
  if (profile?.role === 'columnista' && article.author_id !== user!.id) {
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
        authorName={profile?.full_name || 'Redacción Colombia Positiva'}
      />
    </div>
  )
}
