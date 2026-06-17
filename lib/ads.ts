// ---- Zonas donde se pueden ubicar los anuncios ----
// El `slug` se guarda en ad_submissions.zones[]. El `label` se muestra en el panel.
export type AdZoneSlug =
  | 'noticias-top'
  | 'noticias-bottom'
  | 'masleidas-top'
  | 'masleidas-bottom'
  | 'historias-top'
  | 'historias-bottom'
  | 'categorias-top'
  | 'categorias-bottom'
  | 'footer'

export const AD_ZONES: { slug: AdZoneSlug; label: string }[] = [
  { slug: 'noticias-top',     label: 'Arriba de Noticias Principales' },
  { slug: 'noticias-bottom',  label: 'Abajo de Noticias Principales' },
  { slug: 'masleidas-top',    label: 'Arriba de Las 10 más leídas' },
  { slug: 'masleidas-bottom', label: 'Abajo de Las 10 más leídas' },
  { slug: 'historias-top',    label: 'Arriba de Historias de Colombia Positiva' },
  { slug: 'historias-bottom', label: 'Abajo de Historias de Colombia Positiva' },
  { slug: 'categorias-top',   label: 'Arriba de las secciones por categoría' },
  { slug: 'categorias-bottom',label: 'Abajo de las secciones por categoría' },
  { slug: 'footer',           label: 'Pie de página (footer)' },
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
