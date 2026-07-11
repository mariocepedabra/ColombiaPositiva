'use client'

import { useMemo, useState } from 'react'
import { categories } from '@/lib/data'
import type { AdminArticleRow } from '@/lib/articles'
import ArticleRowActions from '@/components/admin/ArticleRowActions'

type Props = {
  articles: AdminArticleRow[]
}

const PAGE_SIZE = 50

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export default function ArticulosList({ articles }: Props) {
  // 'all' = Inicio (todas las secciones)
  const [filter, setFilter] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)

  // Conteo por categoría para mostrar en cada chip
  const countByCat = useMemo(() => {
    const m: Record<string, number> = {}
    for (const a of articles) m[a.category_slug] = (m[a.category_slug] || 0) + 1
    return m
  }, [articles])

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    // Rango de fechas (inclusive). El input date da 'YYYY-MM-DD'.
    const fromTs = fromDate ? new Date(fromDate + 'T00:00:00').getTime() : null
    const toTs = toDate ? new Date(toDate + 'T23:59:59').getTime() : null
    return articles.filter((a) => {
      if (filter !== 'all' && a.category_slug !== filter) return false
      if (q && !normalize(a.title).includes(q) && !normalize(a.author_name).includes(q)) return false
      if (fromTs || toTs) {
        const t = new Date(a.published_at).getTime()
        if (fromTs && t < fromTs) return false
        if (toTs && t > toTs) return false
      }
      return true
    })
  }, [articles, filter, query, fromDate, toDate])

  const shown = filtered.slice(0, visible)

  function changeFilter(next: string) {
    setFilter(next)
    setVisible(PAGE_SIZE)
  }

  const hasDateFilter = fromDate || toDate

  return (
    <div>
      {/* Filtro por sección */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <FilterChip
          label="Inicio"
          count={articles.length}
          active={filter === 'all'}
          onClick={() => changeFilter('all')}
        />
        {categories.map((cat) => (
          <FilterChip
            key={cat.slug}
            label={cat.name}
            count={countByCat[cat.slug] || 0}
            color={cat.color}
            active={filter === cat.slug}
            onClick={() => changeFilter(cat.slug)}
          />
        ))}
      </div>

      {/* Búsqueda + filtro por fecha */}
      <div className="flex flex-col md:flex-row md:items-end gap-3 mb-3">
        <div className="flex-1">
          <label className="block font-sans text-xs uppercase tracking-wider text-gris-400 mb-1">Buscar</label>
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setVisible(PAGE_SIZE) }}
            placeholder="Buscar por título o autor…"
            className="w-full border border-gris-300 bg-white py-2 px-3 text-sm font-sans focus:outline-none focus:border-verde"
          />
        </div>
        <div>
          <label className="block font-sans text-xs uppercase tracking-wider text-gris-400 mb-1">Desde</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setVisible(PAGE_SIZE) }}
            className="border border-gris-300 bg-white py-2 px-3 text-sm font-sans focus:outline-none focus:border-verde"
          />
        </div>
        <div>
          <label className="block font-sans text-xs uppercase tracking-wider text-gris-400 mb-1">Hasta</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setVisible(PAGE_SIZE) }}
            className="border border-gris-300 bg-white py-2 px-3 text-sm font-sans focus:outline-none focus:border-verde"
          />
        </div>
        {(hasDateFilter || query) && (
          <button
            type="button"
            onClick={() => { setQuery(''); setFromDate(''); setToDate(''); setVisible(PAGE_SIZE) }}
            className="font-sans text-xs text-gris-500 underline hover:text-verde py-2"
          >
            Limpiar
          </button>
        )}
      </div>

      <p className="font-sans text-sm text-gris-600 mb-4">
        {filtered.length} {filtered.length === 1 ? 'artículo' : 'artículos'}
        {filter !== 'all' && ' en esta sección'}
        {query && ' que coinciden con la búsqueda'}
        {hasDateFilter && ' en el rango de fechas'}
        {' '}· ordenados del más nuevo al más antiguo
      </p>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gris-200 p-12 text-center">
          <p className="font-heading text-xl text-gris-400 italic">
            No hay artículos que coincidan
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gris-200">
            {/* Header tabla */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-gris-200 bg-gris-100">
              <div className="col-span-5 font-sans text-xs uppercase tracking-widest text-gris-400">Titular</div>
              <div className="col-span-2 font-sans text-xs uppercase tracking-widest text-gris-400">Categoría</div>
              <div className="col-span-1 font-sans text-xs uppercase tracking-widest text-gris-400">Fecha</div>
              <div className="col-span-4 font-sans text-xs uppercase tracking-widest text-gris-400">Acciones</div>
            </div>

            {shown.map((article) => {
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
                      {new Date(article.published_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })}
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

          {visible < filtered.length && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="font-sans text-xs font-700 uppercase tracking-wider border border-gris-300 text-tinta px-6 py-2.5 hover:border-verde hover:text-verde transition-colors"
              >
                Mostrar más ({filtered.length - visible} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function FilterChip({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string
  count: number
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
      {label} <span className="opacity-60">({count})</span>
    </button>
  )
}
