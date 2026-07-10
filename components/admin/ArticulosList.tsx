'use client'

import { useState } from 'react'
import { categories } from '@/lib/data'
import type { DbArticle } from '@/lib/articles'
import ArticleRowActions from '@/components/admin/ArticleRowActions'

type Props = {
  articles: DbArticle[]
}

export default function ArticulosList({ articles }: Props) {
  // 'all' = Inicio (todas las secciones)
  const [filter, setFilter] = useState<string>('all')

  const filtered =
    filter === 'all'
      ? articles
      : articles.filter((a) => a.category_slug === filter)

  return (
    <div>
      {/* Filtro por sección */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <FilterChip
          label="Inicio"
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        {categories.map((cat) => (
          <FilterChip
            key={cat.slug}
            label={cat.name}
            color={cat.color}
            active={filter === cat.slug}
            onClick={() => setFilter(cat.slug)}
          />
        ))}
      </div>

      <p className="font-sans text-sm text-gris-600 mb-4">
        {filtered.length} {filtered.length === 1 ? 'artículo' : 'artículos'}
        {filter !== 'all' && ' en esta sección'}
      </p>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gris-200 p-12 text-center">
          <p className="font-heading text-xl text-gris-400 italic">
            No hay artículos en esta sección
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gris-200">
          {/* Header tabla */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-gris-200 bg-gris-100">
            <div className="col-span-5 font-sans text-xs uppercase tracking-widest text-gris-400">Titular</div>
            <div className="col-span-2 font-sans text-xs uppercase tracking-widest text-gris-400">Categoría</div>
            <div className="col-span-1 font-sans text-xs uppercase tracking-widest text-gris-400">Fecha</div>
            <div className="col-span-4 font-sans text-xs uppercase tracking-widest text-gris-400">Acciones</div>
          </div>

          {filtered.map((article) => {
            const cat = categories.find((c) => c.slug === article.category_slug)
            return (
              <div key={article.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-4 border-b border-gris-100 last:border-0 items-center">
                <div className="md:col-span-5">
                  <p className="font-sans text-sm font-600 text-tinta line-clamp-2">{article.title}</p>
                  <p className="font-sans text-xs text-gris-400 mt-0.5">{article.author_name}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="font-sans text-xs px-2 py-1" style={{ color: cat?.color, backgroundColor: (cat?.color ?? '#888') + '15' }}>
                    {cat?.name ?? article.category_slug}
                  </span>
                </div>
                <div className="md:col-span-1">
                  <p className="font-sans text-xs text-gris-400">
                    {new Date(article.published_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <div className="md:col-span-4">
                  <ArticleRowActions
                    articleId={article.id}
                    slug={article.slug}
                    categorySlug={article.category_slug}
                    isPublished={article.is_published}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  label,
  color,
  active,
  onClick,
}: {
  label: string
  color?: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-sans text-xs font-600 uppercase tracking-wider px-3 py-1.5 border transition-colors"
      style={
        active
          ? { backgroundColor: color ?? '#024c4d', borderColor: color ?? '#024c4d', color: '#fff' }
          : { backgroundColor: '#fff', borderColor: '#e5e5e5', color: color ?? '#555' }
      }
    >
      {label}
    </button>
  )
}
