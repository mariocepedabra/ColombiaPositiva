import Link from 'next/link'
import Image from 'next/image'
import { Article, categories, formatDateShort } from '@/lib/data'

type Props = {
  article: Article
  variant?: 'vertical' | 'horizontal' | 'minimal'
  showImage?: boolean
}

export default function NewsCard({ article, variant = 'vertical', showImage = true }: Props) {
  const category = categories.find((c) => c.slug === article.category)

  if (variant === 'horizontal') {
    return (
      <article className="group flex gap-4 py-4 border-b border-gris-200 last:border-0">
        {showImage && (
          <Link href={`/articulo/${article.slug}`} className="relative flex-shrink-0 overflow-hidden w-28 h-20">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              sizes="112px"
              className="object-cover group-hover:opacity-90 transition-opacity"
            />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          {category && (
            <span className="text-xs font-sans font-700 uppercase tracking-widest" style={{ color: category.color }}>
              {category.name}
            </span>
          )}
          <Link href={`/articulo/${article.slug}`}>
            <h3 className="font-heading font-700 text-titulo text-sm leading-snug mt-0.5 line-clamp-3 group-hover:text-verde transition-colors">
              {article.title}
            </h3>
          </Link>
          <p className="text-xs text-gris-400 font-sans mt-1">
            {article.author} — {formatDateShort(article.publishedAt)}
          </p>
        </div>
      </article>
    )
  }

  if (variant === 'minimal') {
    return (
      <article className="group py-3 border-b border-gris-200 last:border-0">
        {category && (
          <span className="text-xs font-sans font-700 uppercase tracking-widest" style={{ color: category.color }}>
            {category.name}
          </span>
        )}
        <Link href={`/articulo/${article.slug}`}>
          <h3 className="font-heading font-600 text-titulo text-sm leading-snug mt-0.5 line-clamp-2 group-hover:text-verde transition-colors">
            {article.title}
          </h3>
        </Link>
        <p className="text-xs text-gris-400 font-sans mt-1">{formatDateShort(article.publishedAt)}</p>
      </article>
    )
  }

  // vertical (default)
  return (
    <article className="group flex flex-col h-full">
      {showImage && (
        <Link href={`/articulo/${article.slug}`} className="relative overflow-hidden block" style={{ height: 200 }}>
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover group-hover:opacity-90 transition-opacity duration-300"
          />
        </Link>
      )}
      <div className="flex-1 pt-3 flex flex-col">
        {category && (
          <span className="text-xs font-sans font-700 uppercase tracking-widest mb-1.5" style={{ color: category.color }}>
            {category.name}
          </span>
        )}
        <Link href={`/articulo/${article.slug}`} className="flex-1">
          <h3 className="font-heading font-700 text-titulo text-base leading-snug mb-2 line-clamp-3 group-hover:text-verde transition-colors">
            {article.title}
          </h3>
          <p className="text-gris-600 font-sans text-sm leading-relaxed line-clamp-2">
            {article.excerpt}
          </p>
        </Link>
        <div className="mt-3 pt-2.5 border-t border-gris-200 flex items-center justify-between">
          <span className="text-xs text-gris-400 font-sans">{article.author}</span>
          <span className="text-xs text-gris-400 font-sans">
            {formatDateShort(article.publishedAt)} · {article.readTime} min
          </span>
        </div>
      </div>
    </article>
  )
}
