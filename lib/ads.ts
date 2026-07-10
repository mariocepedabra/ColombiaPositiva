import { categories } from '@/lib/data'

// ---- Zonas donde se pueden ubicar los anuncios ----
// El `slug` se guarda en ad_submissions.zones[]. El `label` se muestra en el panel.
// Las zonas por categoría usan el slug `cat-<slug>-top` / `cat-<slug>-bottom`.
export type AdZoneSlug = string

// Slugs de la zona superior/inferior de una sección por categoría
export function categoryZoneTop(slug: string): string {
  return `cat-${slug}-top`
}
export function categoryZoneBottom(slug: string): string {
  return `cat-${slug}-bottom`
}

export const AD_ZONES: { slug: string; label: string }[] = [
  { slug: 'noticias-top',      label: 'Arriba de Noticias Principales' },
  { slug: 'noticias-bottom',   label: 'Abajo de Noticias Principales' },
  { slug: 'masleidas-top',     label: 'Arriba de Las 10 más leídas' },
  { slug: 'masleidas-bottom',  label: 'Abajo de Las 10 más leídas' },
  // Zona general que envuelve todas las secciones por categoría
  { slug: 'categorias-top',    label: 'Arriba de todas las secciones por categoría' },
  // Una zona arriba y otra abajo de cada sección por categoría
  ...categories.flatMap((c) => [
    { slug: categoryZoneTop(c.slug),    label: `Arriba de la categoría ${c.name}` },
    { slug: categoryZoneBottom(c.slug), label: `Abajo de la categoría ${c.name}` },
  ]),
  { slug: 'categorias-bottom', label: 'Abajo de todas las secciones por categoría' },
  { slug: 'historias-top',     label: 'Arriba de Historias de Colombia Positiva' },
  { slug: 'historias-bottom',  label: 'Abajo de Historias de Colombia Positiva' },
  { slug: 'footer',            label: 'Pie de página (footer)' },
]

export function zoneLabel(slug: string): string {
  return AD_ZONES.find((z) => z.slug === slug)?.label ?? slug
}

// Precio por día de una pauta (COP). Configurable a futuro.
export const AD_PRICE_PER_DAY = 10_000

export type Ad = {
  id: string
  created_at: string
  advertiser_name: string
  company: string | null
  email: string | null
  phone: string | null
  target_url: string | null
  media_type: 'image' | 'video'
  media_url: string
  days: number
  price: number
  status: 'pendiente' | 'activo' | 'pausado' | 'expirado' | 'rechazado'
  paid: boolean
  payment_reference: string | null
  start_date: string | null
  end_date: string | null
  zones: string[]
  sort_order: number
}
