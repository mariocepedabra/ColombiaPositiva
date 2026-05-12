import { createClient } from '@/lib/supabase/server'
import { getAllArticlesAdmin } from '@/lib/articles'
import { categories } from '@/lib/data'
import Link from 'next/link'
import { deleteArticle, togglePublish } from '../actions'

export default async function ArticulosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  const allArticles = await getAllArticlesAdmin()
  const articles = profile?.role === 'admin'
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
        <div className="bg-white border border-gris-200">
          {/* Header tabla */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-gris-200 bg-gris-100">
            <div className="col-span-5 font-sans text-xs uppercase tracking-widest text-gris-400">Titular</div>
            <div className="col-span-2 font-sans text-xs uppercase tracking-widest text-gris-400">Categoría</div>
            <div className="col-span-2 font-sans text-xs uppercase tracking-widest text-gris-400">Estado</div>
            <div className="col-span-1 font-sans text-xs uppercase tracking-widest text-gris-400">Fecha</div>
            <div className="col-span-2 font-sans text-xs uppercase tracking-widest text-gris-400">Acciones</div>
          </div>

          {articles.map((article) => {
            const cat = categories.find((c) => c.slug === article.category_slug)
            return (
              <div key={article.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-4 border-b border-gris-100 last:border-0 items-center">
                <div className="md:col-span-5">
                  <p className="font-sans text-sm font-600 text-tinta line-clamp-2">{article.title}</p>
                  <p className="font-sans text-xs text-gris-400 mt-0.5">{article.author_name}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="font-sans text-xs px-2 py-1" style={{ color: cat?.color, backgroundColor: cat?.color + '15' }}>
                    {cat?.name ?? article.category_slug}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <form action={async () => {
                    'use server'
                    await togglePublish(article.id, article.is_published)
                  }}>
                    <button type="submit" className={`font-sans text-xs px-3 py-1 border transition-colors ${
                      article.is_published
                        ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
                        : 'bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200'
                    }`}>
                      {article.is_published ? '● Publicado' : '○ Borrador'}
                    </button>
                  </form>
                </div>
                <div className="md:col-span-1">
                  <p className="font-sans text-xs text-gris-400">
                    {new Date(article.published_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <div className="md:col-span-2 flex items-center gap-3">
                  <Link href={`/admin/editar/${article.id}`} className="font-sans text-xs text-verde hover:underline">
                    Editar
                  </Link>
                  <Link href={`/articulo/${article.slug}`} target="_blank" className="font-sans text-xs text-gris-400 hover:text-tinta">
                    Ver
                  </Link>
                  <form action={async () => {
                    'use server'
                    await deleteArticle(article.id, article.category_slug, article.slug)
                  }}>
                    <button
                      type="submit"
                      onClick={(e) => { if (!confirm('¿Eliminar este artículo? Esta acción no se puede deshacer.')) e.preventDefault() }}
                      className="font-sans text-xs text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
