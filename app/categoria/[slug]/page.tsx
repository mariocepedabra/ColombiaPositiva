import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { categories, getCategoryBySlug } from '@/lib/data'
import { getArticlesByCategory } from '@/lib/articles'
import NewsCard from '@/components/NewsCard'

export const revalidate = 60

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
  const category = getCategoryBySlug(slug)
  if (!category) notFound()

  const articles = await getArticlesByCategory(slug, 20)
  const [lead, ...rest] = articles

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header de sección */}
      <div className="mb-6">
        <span className="font-sans font-700 text-xs uppercase tracking-widest" style={{ color: category.color }}>
          Sección
        </span>
        <h1 className="font-heading font-900 text-4xl md:text-5xl text-tinta mt-1 mb-3">
          {category.name}
        </h1>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Artículo destacado */}
          {lead && (
            <div className="lg:col-span-1">
              <NewsCard article={lead} variant="vertical" />
            </div>
          )}
          {/* Resto horizontal */}
          <div className="lg:col-span-2 border-l border-gris-200 pl-8">
            {rest.map((article) => (
              <NewsCard key={article.id} article={article} variant="horizontal" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
