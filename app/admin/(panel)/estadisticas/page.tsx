import { createClient } from '@/lib/supabase/server'
import { getArticlesByViewsAdmin, getAdminArticleCounts } from '@/lib/articles'
import { categories } from '@/lib/data'
import Link from 'next/link'

export default async function EstadisticasPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Top artículos por visitas (server-side). Como las notas sin visitas quedan
  // al final, el top-200 captura todas las que tienen visitas registradas.
  const [articles, counts] = await Promise.all([
    getArticlesByViewsAdmin(session?.access_token, 200),
    getAdminArticleCounts(session?.access_token),
  ])

  const totalViews = articles.reduce((sum, a) => sum + (a.view_count ?? 0), 0)
  const maxViews = Math.max(...articles.map((a) => a.view_count ?? 0), 1)
  const avgViews = counts.total > 0 ? Math.round(totalViews / counts.total) : 0
  const topArticle = articles[0]

  return (
    <div>
      {/* Cabecera */}
      <div className="mb-6">
        <h1 className="font-heading font-700 text-2xl text-tinta">Estadísticas de Visitas</h1>
        <p className="font-sans text-sm text-gris-600 mt-0.5">
          Ranking de artículos por número de visitas registradas
        </p>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gris-200 p-5">
          <p className="font-sans text-xs uppercase tracking-widest text-gris-400 mb-2">
            Total de visitas
          </p>
          <p className="font-heading font-900 text-4xl text-tinta">
            {totalViews.toLocaleString('es-CO')}
          </p>
        </div>

        <div className="bg-white border border-gris-200 p-5">
          <p className="font-sans text-xs uppercase tracking-widest text-gris-400 mb-2">
            Promedio por artículo
          </p>
          <p className="font-heading font-900 text-4xl text-tinta">
            {avgViews.toLocaleString('es-CO')}
          </p>
        </div>

        <div className="bg-white border border-gris-200 p-5">
          <p className="font-sans text-xs uppercase tracking-widest text-gris-400 mb-2">
            Artículo más leído
          </p>
          {topArticle ? (
            <Link
              href={`/articulo/${topArticle.slug}`}
              target="_blank"
              className="font-sans text-sm font-700 text-verde hover:underline line-clamp-2 leading-snug"
            >
              {topArticle.title}
            </Link>
          ) : (
            <p className="font-sans text-sm text-gris-400 italic">Sin datos aún</p>
          )}
        </div>
      </div>

      {/* Tabla de artículos */}
      <div className="bg-white border border-gris-200">
        {/* Cabecera tabla */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-gris-200 bg-gris-100">
          <div className="col-span-1 font-sans text-xs uppercase tracking-widest text-gris-400">#</div>
          <div className="col-span-5 font-sans text-xs uppercase tracking-widest text-gris-400">Artículo</div>
          <div className="col-span-2 font-sans text-xs uppercase tracking-widest text-gris-400">Categoría</div>
          <div className="col-span-4 font-sans text-xs uppercase tracking-widest text-gris-400">Visitas</div>
        </div>

        {articles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-heading text-xl text-gris-400 italic">
              No hay artículos publicados aún
            </p>
          </div>
        ) : (
          articles.map((article, idx) => {
            const cat = categories.find((c) => c.slug === article.category_slug)
            const views = article.view_count ?? 0
            const pct = maxViews > 0 ? (views / maxViews) * 100 : 0
            const isTop3 = idx < 3

            return (
              <div
                key={article.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 px-4 py-4 border-b border-gris-100 last:border-0 items-center hover:bg-gris-100/50 transition-colors"
              >
                {/* Posición */}
                <div className="md:col-span-1 flex items-center">
                  <span
                    className="font-heading font-900 text-2xl leading-none"
                    style={{ color: isTop3 ? 'rgb(239,190,5)' : '#d0cfc8' }}
                  >
                    {idx + 1}
                  </span>
                </div>

                {/* Titular */}
                <div className="md:col-span-5">
                  <Link
                    href={`/articulo/${article.slug}`}
                    target="_blank"
                    className="font-sans text-sm font-600 text-tinta line-clamp-2 hover:text-verde transition-colors"
                  >
                    {article.title}
                  </Link>
                  <p className="font-sans text-xs text-gris-400 mt-0.5">
                    {article.author_name} ·{' '}
                    {new Date(article.published_at).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {/* Categoría */}
                <div className="md:col-span-2">
                  <span
                    className="font-sans text-xs px-2 py-1"
                    style={{
                      color: 'rgb(1, 50, 98)',
                      backgroundColor: cat ? cat.color + '20' : '#f5f5f3',
                    }}
                  >
                    {cat?.name ?? article.category_slug}
                  </span>
                </div>

                {/* Barra de visitas */}
                <div className="md:col-span-4 flex items-center gap-3">
                  <div className="flex-1 bg-gris-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isTop3 ? 'rgb(239,190,5)' : 'rgb(1,50,98)',
                      }}
                    />
                  </div>
                  <span className="font-sans font-700 text-sm text-tinta min-w-[4rem] text-right tabular-nums">
                    {views.toLocaleString('es-CO')}
                    <span className="font-400 text-gris-400 text-xs ml-1">
                      {views === 1 ? 'visita' : 'visitas'}
                    </span>
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Nota informativa */}
      <p className="font-sans text-xs text-gris-400 mt-4 text-center">
        Las visitas se registran cada vez que un lector abre un artículo.
        Los datos se actualizan en tiempo real.
      </p>
    </div>
  )
}
