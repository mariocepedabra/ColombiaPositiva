// URL pública del sitio. Se usa para construir enlaces absolutos (compartir,
// Open Graph, imagen-tarjeta) que funcionan al pegarlos en otras plataformas.
export const SITE_URL = 'https://colombiapositiva.com'

export function articleUrl(slug: string): string {
  return `${SITE_URL}/articulo/${slug}`
}

// URL estable de la imagen-tarjeta de una nota (para vista previa y compartir).
export function cardImageUrl(slug: string): string {
  return `${SITE_URL}/api/tarjeta/${encodeURIComponent(slug)}`
}
