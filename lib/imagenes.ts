// Configuración compartida del optimizador de imágenes propio (/api/imagen).
// La usan el loader de next/image (cliente) y la ruta que sirve las imágenes
// (servidor), así que aquí no puede haber nada específico de uno u otro lado.

// Imagen de respaldo cuando una nota no trae foto o la original no responde.
// Es un archivo local, así que nunca depende de un servidor externo.
export const IMAGEN_RESPALDO = '/portada-generica.svg'

// Anchos que puede pedir next/image (deviceSizes + imageSizes por defecto).
// Restringir a esta lista evita que un tercero genere variantes infinitas.
export const ANCHOS = [
  16, 32, 48, 64, 96, 128, 256, 384,
  640, 750, 828, 1080, 1200, 1920, 2048, 3840,
] as const

export function anchoMasCercano(width: number): number {
  if (!Number.isFinite(width) || width <= 0) return 640
  return ANCHOS.reduce((mejor, w) =>
    Math.abs(w - width) < Math.abs(mejor - width) ? w : mejor
  )
}

export function calidadValida(quality?: number): number {
  if (!Number.isFinite(quality as number)) return 72
  return Math.min(Math.max(Math.round(quality as number), 40), 90)
}

// Dominios desde los que aceptamos descargar imágenes. Sin esta lista la ruta
// sería un proxy abierto que cualquiera podría usar contra terceros.
export function hostPermitido(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === 'pagina10.com' || host === 'www.pagina10.com') return true
  if (host.endsWith('.supabase.co')) return true
  return false
}
