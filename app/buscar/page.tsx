import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getCategoryBySlug, formatDate } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Buscar',
}

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function BuscarPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  let results: {
    id: string
    title: string
    slug: string
    excerpt: string
    category_slug: string
    image_url: string | null
    author_name: string
    published_at: string
    read_time: number
  }[] = []

  if (query.length >= 2) {
    const supabase = await createClient()
    const { data } = await supabase
      .rpc('search_articles_fuzzy', {
        search_query: query,
        result_limit: 20,
      })

    results = data ?? []
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Cabecera */}
      <div className="mb-8">
        <h1 className="font-heading font-900 text-3xl md:text-4xl text-tinta mb-4">
          {query ? `Resultados para "${query}"` : 'Buscar noticias'}
        </h1>

        {/* Barra de búsqueda */}
        <form action="/buscar" method="GET" className="flex gap-2 max-w-xl">
          <div className="relative flex-1">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="¿Qué noticia estás buscando?"
              className="w-full border border-gris-300 bg-white py-2.5 pl-4 pr-10 text-sm font-sans focus:outline-none focus:border-verde"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs px-6 py-2.5 tracking-widest uppercase transition-colors"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="border-t-2 border-tinta mb-6" />

      {/* Sin búsqueda aún */}
      {!query && (
        <p className="font-sans text-gris-600 text-sm">
          Escribe al menos 2 caracteres para buscar entre las notas de Colombia Positiva.
        </p>
      )}

      {/* Sin resultados */}
      {query.length >= 2 && results.length === 0 && (
        <div className="py-12 text-center">
          <p className="font-heading italic text-gris-600 text-xl mb-2">
            No encontramos notas para "{query}"
          </p>
          <p className="font-sans text-gris-400 text-sm">
            Intenta con otras palabras clave.
          </p>
        </div>
      )}

      {/* Resultados */}
      {results.length > 0 && (
        <>
          <p className="font-sans text-xs text-gris-400 mb-6 uppercase tracking-wider">
            {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
          </p>
          <div className="divide-y divide-gris-200">
            {results.map((article) => {
              const category = getCategoryBySlug(article.category_slug)
              return (
                <article key={article.id} className="py-5 flex gap-5">
                  {/* Imagen */}
                  <div className="flex-shrink-0 relative overflow-hidden hidden sm:block" style={{ width: 120, height: 80 }}>
                    <Image
                      src={article.image_url ?? `https://picsum.photos/seed/${article.slug}/400/300`}
                      alt={article.title}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </div>
                  {/* Texto */}
                  <div className="flex-1 min-w-0">
                    {category && (
                      <Link href={`/categoria/${category.slug}`}>
                        <span
                          className="font-sans font-700 text-xs uppercase tracking-widest"
                          style={{ color: category.color }}
                        >
                          {category.name}
                        </span>
                      </Link>
                    )}
                    <Link href={`/articulo/${article.slug}`}>
                      <h2 className="font-heading font-700 text-tinta text-lg leading-snug mt-0.5 mb-1 hover:text-titulo transition-colors">
                        {article.title}
                      </h2>
                    </Link>
                    <p className="font-sans text-gris-600 text-sm line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs font-sans text-gris-400">
                      <span>{article.author_name}</span>
                      <span>·</span>
                      <span>{formatDate(article.published_at)}</span>
                      <span>·</span>
                      <span>{article.read_time} min</span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
