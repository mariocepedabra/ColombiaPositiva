export type Category = {
  slug: string
  name: string
  color: string
}

export type Article = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  author: string
  publishedAt: string
  readTime: number
  imageUrl: string
}

// Los slugs 'economia' y 'medio-ambiente' se conservan en URLs y BD
// (constraint articles_category_slug_check); solo cambia el nombre visible.
export const categories: Category[] = [
  { slug: 'personajes', name: 'Personajes', color: '#c0392b' },
  { slug: 'educacion', name: 'Educación', color: '#ca6f1e' },
  { slug: 'regiones', name: 'Regiones', color: '#922b21' },
  { slug: 'economia', name: 'Emprendimiento', color: '#1a5276' },
  { slug: 'cultura', name: 'Cultura', color: '#6c3483' },
  { slug: 'medio-ambiente', name: 'Turismo', color: '#1e8449' },
  { slug: 'deporte', name: 'Deporte', color: '#b7770d' },
  { slug: 'ciencia', name: 'Ciencia', color: '#148f77' },
]

export const breakingNewsFallback: string[] = [
  'Colombia Positiva — El periódico de las buenas noticias de Colombia',
  'Bienvenidos a Colombia Positiva, donde cada historia importa',
  'Porque Colombia tiene mucho de qué estar orgullosa',
  'Noticias que inspiran, historias que transforman',
]

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-CO', {
    month: 'short',
    day: 'numeric',
  })
}
