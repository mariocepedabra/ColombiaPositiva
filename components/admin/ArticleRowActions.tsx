'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteArticle, togglePublish } from '@/app/admin/actions'

type Props = {
  articleId: string
  slug: string
  categorySlug: string
  isPublished: boolean
}

export default function ArticleRowActions({ articleId, slug, categorySlug, isPublished }: Props) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('¿Eliminar este artículo? Esta acción no se puede deshacer.')) return
    await deleteArticle(articleId, categorySlug, slug)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/admin/editar/${articleId}`}
        className="font-sans text-xs text-verde hover:underline"
      >
        Editar
      </Link>
      <Link
        href={`/articulo/${slug}`}
        target="_blank"
        className="font-sans text-xs text-gris-400 hover:text-tinta"
      >
        Ver
      </Link>
      <form action={togglePublish.bind(null, articleId, isPublished)}>
        <button
          type="submit"
          className={`font-sans text-xs px-3 py-1 border transition-colors ${
            isPublished
              ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
              : 'bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200'
          }`}
        >
          {isPublished ? '● Publicado' : '○ Borrador'}
        </button>
      </form>
      <button
        type="button"
        onClick={handleDelete}
        className="font-sans text-xs text-red-500 hover:text-red-700"
      >
        Eliminar
      </button>
    </div>
  )
}
