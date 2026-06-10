export type Platform = 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'direct'

export type Video = {
  id: string
  title: string
  url: string
  platform: Platform
  is_active: boolean
  created_at: string
}

/** Las tres divisiones de "Historias de Colombia Positiva" en la portada */
export type VideoSectionKey = 'instagram' | 'facebook' | 'tiktok'

/** Convierte la URL original en la URL de embed correspondiente */
export function getEmbedUrl(video: Pick<Video, 'url' | 'platform'>): string {
  const platform = effectivePlatform(video)

  if (platform === 'tiktok') {
    // https://www.tiktok.com/@user/video/1234567890
    const match = video.url.match(/video\/(\d+)/)
    if (match) return `https://www.tiktok.com/embed/v2/${match[1]}`
    // vm.tiktok.com/XXXX
    const numMatch = video.url.match(/\/(\d{15,20})/)
    if (numMatch) return `https://www.tiktok.com/embed/v2/${numMatch[1]}`
    return video.url
  }
  if (platform === 'instagram') {
    // instagram.com/reel/CODE, /p/CODE o /tv/CODE
    const m = video.url.match(/instagram\.com\/(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/)
    if (m) {
      const kind = m[1] === 'reels' ? 'reel' : m[1]
      return `https://www.instagram.com/${kind}/${m[2]}/embed/`
    }
    return video.url
  }
  if (platform === 'facebook') {
    // El plugin oficial acepta cualquier URL de video/reel de Facebook
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(video.url)}&show_text=false`
  }
  if (platform === 'youtube') {
    // youtube.com/watch?v=ID
    let m = video.url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
    if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0`
    // youtu.be/ID
    m = video.url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
    if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0`
    // youtube.com/shorts/ID
    m = video.url.match(/shorts\/([a-zA-Z0-9_-]{11})/)
    if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0`
    return video.url
  }
  return video.url // direct: src de <video>
}

/** Detecta automáticamente la plataforma a partir de la URL */
export function detectPlatform(url: string): Platform {
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook'
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  return 'direct'
}

/**
 * Plataforma real del video, derivada de la URL.
 * La columna `platform` en BD puede tener un valor legado (p. ej. 'direct'
 * como fallback si el constraint no acepta los valores nuevos), así que la
 * URL es la fuente de verdad para clasificar.
 */
export function effectivePlatform(video: Pick<Video, 'url' | 'platform'>): Platform {
  const fromUrl = detectPlatform(video.url)
  return fromUrl !== 'direct' ? fromUrl : video.platform
}

/** División de la portada a la que pertenece el video (null = no se muestra) */
export function videoSectionKey(video: Pick<Video, 'url' | 'platform'>): VideoSectionKey | null {
  const platform = effectivePlatform(video)
  if (platform === 'instagram' || platform === 'facebook' || platform === 'tiktok') return platform
  return null
}

/** Devuelve la etiqueta legible de la plataforma */
export function platformLabel(platform: Platform): string {
  return {
    instagram: 'Instagram',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    direct: 'Archivo',
  }[platform]
}
