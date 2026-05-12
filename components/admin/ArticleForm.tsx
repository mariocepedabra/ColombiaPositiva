'use client'

import { useState, useTransition } from 'react'
import { saveArticle } from '@/app/admin/actions'
import { categories } from '@/lib/data'
import { DbArticle } from '@/lib/articles'
import ImageUploader from './ImageUploader'

type Props = {
  article?: DbArticle
  authorName: string
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export default function ArticleForm({ article, authorName }: Props) {
  const [title, setTitle] = useState(article?.title ?? '')
  const [slug, setSlug] = useState(article?.slug ?? '')
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? '')
  const [content, setContent] = useState(article?.content ?? '')
  const [categorySlug, setCategorySlug] = useState(article?.category_slug ?? 'economia')
  const [imageUrl, setImageUrl] = useState(article?.image_url ?? '')
  const [author, setAuthor] = useState(article?.author_name ?? authorName)
  const [readTime, setReadTime] = useState(article?.read_time ?? 5)
  const [isPublished, setIsPublished] = useState(article?.is_published ?? false)
  const [publishedAt, setPublishedAt] = useState(
    article?.published_at
      ? new Date(article.published_at).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  )
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!article) setSlug(generateSlug(val))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const formData = new FormData()
    formData.set('article_id', article?.id ?? '')
    formData.set('title', title)
    formData.set('slug', slug)
    formData.set('excerpt', excerpt)
    formData.set('content', content)
    formData.set('category_slug', categorySlug)
    formData.set('image_url', imageUrl)
    formData.set('author_name', author)
    formData.set('read_time', String(readTime))
    formData.set('is_published', String(isPublished))
    formData.set('published_at', new Date(publishedAt).toISOString())

    startTransition(async () => {
      const result = await saveArticle(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 font-sans text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-5">
          {/* Titular */}
          <div>
            <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1">
              Titular *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              className="w-full border border-gris-300 px-3 py-2.5 text-base font-heading focus:outline-none focus:border-verde"
              placeholder="El titular de la noticia..."
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1">
              URL (slug)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full border border-gris-300 px-3 py-2 text-sm font-sans text-gris-600 focus:outline-none focus:border-verde"
              placeholder="url-de-la-noticia"
            />
            <p className="font-sans text-xs text-gris-400 mt-1">
              colombiapositiva.com/articulo/<strong>{slug || 'url-del-articulo'}</strong>
            </p>
          </div>

          {/* Resumen */}
          <div>
            <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1">
              Resumen / Subtítulo *
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              required
              rows={2}
              className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde resize-none"
              placeholder="Un resumen breve de 1-2 líneas..."
            />
          </div>

          {/* Cuerpo */}
          <div>
            <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1">
              Cuerpo del artículo *
            </label>
            <p className="font-sans text-xs text-gris-400 mb-1">
              Separa los párrafos con una línea en blanco
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={16}
              className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde resize-y"
              placeholder="Escribe aquí el contenido completo de la noticia...&#10;&#10;Puedes agregar más párrafos dejando una línea en blanco entre ellos."
            />
          </div>

          {/* Imagen */}
          <div>
            <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-2">
              Imagen
            </label>
            <ImageUploader value={imageUrl} onChange={setImageUrl} />
          </div>
        </div>

        {/* Sidebar de configuración */}
        <div className="space-y-5">
          {/* Estado de publicación */}
          <div className="bg-white border border-gris-200 p-4">
            <h3 className="font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-3">
              Estado
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setIsPublished(false)}
                className={`flex-1 py-2 text-xs font-sans font-700 uppercase tracking-wider border transition-colors ${
                  !isPublished ? 'bg-tinta text-white border-tinta' : 'border-gris-300 text-gris-600 hover:border-tinta'
                }`}
              >
                Borrador
              </button>
              <button
                type="button"
                onClick={() => setIsPublished(true)}
                className={`flex-1 py-2 text-xs font-sans font-700 uppercase tracking-wider border transition-colors ${
                  isPublished ? 'bg-verde text-white border-verde' : 'border-gris-300 text-gris-600 hover:border-verde'
                }`}
              >
                Publicar
              </button>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs py-3 tracking-widest uppercase transition-colors disabled:opacity-60"
            >
              {isPending ? 'Guardando...' : article ? 'Actualizar nota' : 'Guardar nota'}
            </button>
          </div>

          {/* Categoría */}
          <div className="bg-white border border-gris-200 p-4">
            <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-2">
              Categoría *
            </label>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde bg-white"
            >
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Autor */}
          <div className="bg-white border border-gris-200 p-4">
            <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-2">
              Autor
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full border border-gris-300 px-3 py-2 text-sm font-sans focus:outline-none focus:border-verde"
            />
          </div>

          {/* Fecha de publicación */}
          <div className="bg-white border border-gris-200 p-4">
            <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-2">
              Fecha de publicación
            </label>
            <input
              type="datetime-local"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="w-full border border-gris-300 px-3 py-2 text-sm font-sans focus:outline-none focus:border-verde"
            />
          </div>

          {/* Tiempo de lectura */}
          <div className="bg-white border border-gris-200 p-4">
            <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-2">
              Tiempo de lectura (minutos)
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={readTime}
              onChange={(e) => setReadTime(parseInt(e.target.value) || 5)}
              className="w-full border border-gris-300 px-3 py-2 text-sm font-sans focus:outline-none focus:border-verde"
            />
          </div>
        </div>
      </div>
    </form>
  )
}
