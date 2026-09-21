import type { DbArticle } from '@/lib/articles'
import type { NotaResumen, SlugSeccion } from './contratos'

// Campos que necesita un listado. No se trae `content`: en la portada son
// ~50 notas y el cuerpo pesa más que todo lo demás junto.
export const CAMPOS_RESUMEN =
  'id,slug,title,excerpt,category_slug,author_name,published_at,read_time,image_url'

export type FilaResumen = Pick<
  DbArticle,
  'id' | 'slug' | 'title' | 'excerpt' | 'category_slug' | 'author_name' | 'published_at' | 'read_time' | 'image_url'
>

export function aNotaResumen(fila: FilaResumen): NotaResumen {
  const imagen = fila.image_url?.trim()
  return {
    id: fila.id,
    slug: fila.slug,
    titulo: fila.title,
    bajada: fila.excerpt ?? '',
    seccion: fila.category_slug as SlugSeccion,
    autor: fila.author_name,
    publicadoEn: fila.published_at,
    minutosLectura: fila.read_time ?? 5,
    // Solo URLs absolutas: la app las pasa por /api/imagen. Sin foto → null y
    // la app pone la portada genérica.
    imagen: imagen && /^https?:\/\//i.test(imagen) ? imagen : null,
  }
}
