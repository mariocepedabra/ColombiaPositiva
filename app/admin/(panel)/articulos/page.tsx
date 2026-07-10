import { createClient } from '@/lib/supabase/server'
import { getAllArticlesAdmin } from '@/lib/articles'
import Link from 'next/link'
import ArticulosList from '@/components/admin/ArticulosList'

export default async function ArticulosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()

  let myRole = (user!.app_metadata as Record<string, string>)?.role ?? 'lector'
  try {
    const { data: rpcData } = await supabase.rpc('get_my_profile')
    if (Array.isArray(rpcData) && rpcData.length > 0) {
      myRole = (rpcData[0] as { role: string }).role || myRole
    }
  } catch { /* usar app_metadata */ }

  const allArticles = await getAllArticlesAdmin(session?.access_token)
  const articles = myRole === 'admin'
    ? allArticles
    : allArticles.filter((a) => a.author_id === user!.id)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-700 text-2xl text-tinta">Artículos</h1>
          <p className="font-sans text-sm text-gris-600 mt-0.5">{articles.length} artículos en total</p>
        </div>
        <Link href="/admin/nuevo" className="bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs px-5 py-2.5 uppercase tracking-wider transition-colors">
          + Nueva nota
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="bg-white border border-gris-200 p-12 text-center">
          <p className="font-heading text-xl text-gris-400 italic mb-2">Aún no hay artículos</p>
          <Link href="/admin/nuevo" className="font-sans text-sm text-verde hover:underline">
            Crear el primer artículo →
          </Link>
        </div>
      ) : (
        <ArticulosList articles={articles} />
      )}
    </div>
  )
}
