import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { categories, getCategoryBySlug } from '@/lib/data'
import { getArticlesByCategory, getArticleCountByCategory } from '@/lib/articles'
import NewsCard from '@/components/NewsCard'

export const revalidate = 60

const PER_PAGE = 20

export async function generateStaticParams() {
  return categories.map((cat) => ({ slug: cat.slug }))
}

export async function generateMetadata(props: PageProps<'/categoria/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params
  const category = getCategoryBySlug(slug)
  if (!category) return {}
  return {
    title: `${category.name} — Colombia Positiva`,
    description: `Noticias positivas de ${category.name} en Colombia`,
  }
}

export default async function CategoryPage(props: PageProps<'/categoria/[slug]'>) {
  const { slug } = await props.params
  const sp = await (props as unknown as { searchParams: Promise<{ page?: string }> }).searchParams
  const page = Math.max(1, parseInt(sp?.page ?? '1', 10))
  const offset = (page - 1) * PER_PAGE

  const category = getCategoryBySlug(slug)
  if (!category) notFound()

  const [articles, total] = await Promise.all([
    getArticlesByCategory(slug, PER_PAGE, offset),
    getArticleCountByCategory(slug),
  ])

  const totalPages = Math.ceil(total / PER_PAGE)
  const [lead, ...rest] = articles

  // Números de página a mostrar (máx 5 alrededor de la actual)
  const pageNumbers: number[] = []
  const delta = 2
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pageNumbers.push(i)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header de sección */}
      <div className="mb-6">
        <span className="font-sans font-700 text-xs uppercase tracking-widest" style={{ color: 'rgb(1, 50, 98)' }}>
          Sección
        </span>
        <h1 className="font-heading font-900 text-4xl md:text-5xl text-tinta mt-1 mb-1">
          {category.name}
        </h1>
        {total > 0 && (
          <p className="font-sans text-xs text-gris-400 mb-3">
            {total} {total === 1 ? 'nota' : 'notas'}
            {totalPages > 1 && ` · Página ${page} de ${totalPages}`}
          </p>
        )}
        <div className="h-0.5 w-full" style={{ backgroundColor: category.color }} />
      </div>

      {articles.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-heading text-2xl text-gris-400 italic mb-2">
            Próximamente
          </p>
          <p className="font-sans text-sm text-gris-400">
            Estamos preparando las mejores noticias de {category.name} para ti.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Artículo destacado (solo en página 1) */}
            {lead && page === 1 && (
              <div className="lg:col-span-1">
                <NewsCard article={lead} variant="vertical" />
              </div>
            )}
            {/* Resto horizontal */}
            <div className={page === 1 ? 'lg:col-span-2 border-l border-gris-200 pl-8' : 'lg:col-span-3'}>
              {(page === 1 ? rest : articles).map((article) => (
                <NewsCard key={article.id} article={article} variant="horizontal" />
              ))}
            </div>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-1 mt-10 pt-6 border-t border-gris-200">
              {/* Anterior */}
              {page > 1 ? (
                <Link
                  href={`/categoria/${slug}?page=${page - 1}`}
                  className="px-4 py-2 font-sans text-xs font-700 uppercase tracking-wider text-gris-600 border border-gris-300 hover:border-tinta hover:text-tinta transition-colors"
                >
                  ← Anterior
                </Link>
              ) : (
                <span className="px-4 py-2 font-sans text-xs font-700 uppercase tracking-wider text-gris-300 border border-gris-200 cursor-not-allowed">
                  ← Anterior
                </span>
              )}

              {/* Números de página */}
              {pageNumbers[0] > 1 && (
                <>
                  <Link href={`/categoria/${slug}?page=1`} className="px-3 py-2 font-sans text-xs font-700 text-gris-600 border border-gris-300 hover:border-tinta hover:text-tinta transition-colors">1</Link>
                  {pageNumbers[0] > 2 && <span className="px-1 text-gris-400 font-sans text-xs">…</span>}
                </>
              )}

              {pageNumbers.map((n) => (
                n === page ? (
                  <span key={n} className="px-3 py-2 font-sans text-xs font-700 text-white border" style={{ backgroundColor: category.color, borderColor: category.color }}>
                    {n}
                  </span>
                ) : (
                  <Link key={n} href={`/categoria/${slug}?page=${n}`} className="px-3 py-2 font-sans text-xs font-700 text-gris-600 border border-gris-300 hover:border-tinta hover:text-tinta transition-colors">
                    {n}
                  </Link>
                )
              ))}

              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="px-1 text-gris-400 font-sans text-xs">…</span>}
                  <Link href={`/categoria/${slug}?page=${totalPages}`} className="px-3 py-2 font-sans text-xs font-700 text-gris-600 border border-gris-300 hover:border-tinta hover:text-tinta transition-colors">{totalPages}</Link>
                </>
              )}

              {/* Siguiente */}
              {page < totalPages ? (
                <Link
                  href={`/categoria/${slug}?page=${page + 1}`}
                  className="px-4 py-2 font-sans text-xs font-700 uppercase tracking-wider text-gris-600 border border-gris-300 hover:border-tinta hover:text-tinta transition-colors"
                >
                  Siguiente →
                </Link>
              ) : (
                <span className="px-4 py-2 font-sans text-xs font-700 uppercase tracking-wider text-gris-300 border border-gris-200 cursor-not-allowed">
                  Siguiente →
                </span>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  )
}
