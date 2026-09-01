// Cuentas oficiales de Colombia Positiva en cada red.
// Se pueden sobreescribir por variable de entorno sin tocar el código.

export const TIKTOK_HANDLE =
  process.env.TIKTOK_HANDLE?.replace(/^@/, '') || 'colombia.positiva'

/** Cuenta de Instagram (usuario, sin @). Solo se usa con la API de Meta. */
export const INSTAGRAM_HANDLE =
  process.env.INSTAGRAM_HANDLE?.replace(/^@/, '') || 'colombiapositiva10'

/** ID de la página de Facebook. Solo se usa con la API de Meta. */
export const FACEBOOK_PAGE_ID =
  process.env.FACEBOOK_PAGE_ID || '100066399406261'

export type SocialPlatform = 'tiktok' | 'instagram' | 'facebook'

/** Métricas normalizadas de un video, iguales para las tres redes. */
export type SocialVideoStats = {
  platform: SocialPlatform
  externalId: string
  url: string
  title: string
  thumbnailUrl: string | null
  publishedAt: string | null
  views: number
  likes: number
  comments: number
  shares: number
}
