import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getCategoryBySlug, formatDate } from '@/lib/data'
import { getArticleBySlug, getArticlesByCategory } from '@/lib/articles'
import NewsCard from '@/components/NewsCard'

export const revalidate = 60

export async function generateMetadata(props: PageProps<'/articulo/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params
  const article = await getArticleBySlug(slug)
  if (!article) return {}
  return { title: article.title, description: article.excerpt }
}

function renderContent(content: string) {
  // Normalizar saltos de línea
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Dividir en bloques por doble salto (o más) de línea
  const blocks = normalized.split(/\n{2,}/).filter((b) => b.trim() !== '')

  return blocks.map((block, blockIdx) => {
    const lines = block.split('\n').filter((l) => l.trim() !== '')
    if (lines.length === 0) return null

    // Si todas las líneas son viñetas (•, -, *)
    const isBulletList = lines.every((l) => /^[•\-\*]\s*/.test(l.trim()))
    if (isBulletList) {
      return (
        <ul key={blockIdx} className="mb-5 space-y-1.5">
          {lines.map((line, i) => (
            <li key={i} className="flex gap-2 items-start">
              <span className="text-verde font-700 mt-0.5 shrink-0">•</span>
              <span>{line.trim().replace(/^[•\-\*]\s*/, '')}</span>
            </li>
          ))}
        </ul>
      )
    }

    // Bloque de una sola línea corta sin puntuación final → subtítulo de sección
    if (lines.length === 1 && blockIdx > 0) {
      const line = lines[0].trim()
      const looksLikeHeading = line.length < 100 && !/[.,;]$/.test(line)
      if (looksLikeHeading) {
        return (
          <h3 key={blockIdx} className="font-heading font-700 text-xl text-tinta mt-7 mb-3">
            {line}
          </h3>
        )
      }
    }

    // Párrafo normal — saltos simples se convierten en <br>
    return (
      <p key={blockIdx} className="mb-5">
        {lines.map((line, i) => (
          <span key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    )
  })
}

export default async function ArticlePage(props: PageProps<'/articulo/[slug]'>) {
  const { slug } = await props.params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  const category = getCategoryBySlug(article.category)
  const related = (await getArticlesByCategory(article.category, 5)).filter(
    (a) => a.slug !== slug
  ).slice(0, 4)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Artículo */}
        <article className="lg:col-span-2">
          {/* Breadcrumb */}
          <nav className="text-xs font-sans text-gris-400 mb-4 flex items-center gap-2">
            <Link href="/" className="hover:text-verde transition-colors">Portada</Link>
            <span>/</span>
            {category && (
              <>
                <Link href={`/categoria/${category.slug}`} className="hover:text-verde transition-colors" style={{ color: category.color }}>
                  {category.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="line-clamp-1">{article.title}</span>
          </nav>

          {/* Categoría */}
          {category && (
            <Link href={`/categoria/${category.slug}`}>
              <span className="font-sans font-700 text-xs uppercase tracking-widest" style={{ color: category.color }}>
                {category.name}
              </span>
            </Link>
          )}

          {/* Titular */}
          <h1 className="font-heading font-900 text-3xl md:text-5xl text-tinta leading-tight mt-2 mb-4">
            {article.title}
          </h1>

          {/* Subtítulo / excerpt */}
          <p className="font-heading italic text-gris-600 text-lg md:text-xl leading-relaxed mb-5 border-l-4 pl-4"
            style={{ borderColor: category?.color ?? '#006039' }}>
            {article.excerpt}
          </p>

          {/* Regla */}
          <div className="border-t-2 border-tinta mb-4" />

          {/* Byline */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-gris-600 mb-5 pb-4 border-b border-gris-200">
            <span className="font-700 text-tinta">{article.author}</span>
            <span className="text-gris-300">·</span>
            <span>{formatDate(article.publishedAt)}</span>
            <span className="text-gris-300">·</span>
            <span>{article.readTime} minutos de lectura</span>
          </div>

          {/* Imagen principal */}
          <div className="relative mb-6 overflow-hidden" style={{ height: 380 }}>
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
              priority
            />
          </div>

          {/* Cuerpo */}
          <div className="body-text">
            {renderContent(article.content)}
          </div>

          {/* Compartir */}
          <div className="mt-8 pt-5 border-t border-gris-200 flex flex-wrap items-center gap-3">
            <span className="font-sans text-xs font-700 uppercase tracking-wider text-gris-600">Compartir:</span>
            {[
              { label: 'Facebook', bg: '#1877F2' },
              { label: 'X / Twitter', bg: '#000' },
              { label: 'WhatsApp', bg: '#25D366' },
            ].map((s) => (
              <button
                key={s.label}
                className="font-sans text-xs font-700 text-white px-4 py-1.5 uppercase tracking-wider hover:opacity-80 transition-opacity"
                style={{ backgroundColor: s.bg }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-6">
            {/* Más en categoría */}
            {related.length > 0 && (
              <div className="mb-6">
                <span className="font-sans font-700 text-xs uppercase tracking-widest" style={{ color: category?.color }}>
                  Más en {category?.name}
                </span>
                <div className="h-0.5 w-full mt-1 mb-3" style={{ backgroundColor: category?.color }} />
                {related.map((rel) => (
                  <NewsCard key={rel.id} article={rel} variant="minimal" />
                ))}
              </div>
            )}

            {/* Newsletter */}
            <div className="bg-tinta p-5 text-white">
              <h3 className="font-heading font-700 text-lg text-white mb-1">Boletín matutino</h3>
              <div className="w-8 border-t border-verde mb-3" />
              <p className="font-sans text-white/60 text-sm leading-relaxed mb-3">
                Las mejores noticias positivas de Colombia cada mañana en tu correo.
              </p>
              <input
                type="email"
                placeholder="tu@correo.com"
                className="w-full bg-white/5 border border-white/20 px-3 py-2 text-sm text-white placeholder-white/30 mb-2 focus:outline-none focus:border-verde font-sans"
              />
              <button className="w-full bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs py-2.5 tracking-widest uppercase transition-colors">
                Suscribirse
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
