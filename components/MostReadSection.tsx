import Link from 'next/link'
import Image from 'next/image'
import { getTopArticles } from '@/lib/articles'
import { getCategoryBySlug } from '@/lib/data'

export default async function MostReadSection() {
  const articles = await getTopArticles(10)
  if (articles.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      {/* Título de sección */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 border-t-2 border-tinta" />
        <h2 className="font-sans font-700 text-xs uppercase tracking-[0.25em] text-tinta whitespace-nowrap">
          ★ Las 10 historias más leídas
        </h2>
        <div className="flex-1 border-t-2 border-tinta" />
      </div>

      {/* Grid de 2 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
        {articles.map((article, idx) => {
          const category = getCategoryBySlug(article.category)
          const isTop3 = idx < 3

          return (
            <Link
              key={article.id}
              href={`/articulo/${article.slug}`}
              className="group flex items-center gap-4 px-3 py-3 hover:bg-gris-100 transition-colors border-b border-gris-200"
            >
              {/* Número */}
              <div className="flex-shrink-0 w-10 text-center">
                <span
                  className="font-heading font-900 text-3xl leading-none"
                  style={{ color: isTop3 ? 'rgb(239,190,5)' : '#d0cfc8' }}
                >
                  {idx + 1}
                </span>
              </div>

              {/* Imagen */}
              <div
                className="flex-shrink-0 relative overflow-hidden hidden sm:block"
                style={{ width: 72, height: 54 }}
              >
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  sizes="72px"
                  className="object-cover"
                />
              </div>

              {/* Texto */}
              <div className="flex-1 min-w-0">
                {category && (
                  <span
                    className="font-sans font-700 text-xs uppercase tracking-widest block mb-0.5"
                    style={{ color: category.color }}
                  >
                    {category.name}
                  </span>
                )}
                <h3 className="font-heading font-700 text-sm text-tinta leading-snug group-hover:text-titulo transition-colors line-clamp-2">
                  {article.title}
                </h3>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
