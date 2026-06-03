export type Video = {
  id: string
  title: string
  url: string
  platform: 'tiktok' | 'youtube' | 'direct'
  is_active: boolean
  created_at: string
}

/** Convierte la URL original en la URL de embed correspondiente */
export function getEmbedUrl(video: Pick<Video, 'url' | 'platform'>): string {
  if (video.platform === 'tiktok') {
    // https://www.tiktok.com/@user/video/1234567890
    const match = video.url.match(/video\/(\d+)/)
    if (match) return `https://www.tiktok.com/embed/v2/${match[1]}`
    // vm.tiktok.com/XXXX
    const numMatch = video.url.match(/\/(\d{15,20})/)
    if (numMatch) return `https://www.tiktok.com/embed/v2/${numMatch[1]}`
    return video.url
  }
  if (video.platform === 'youtube') {
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
export function detectPlatform(url: string): 'tiktok' | 'youtube' | 'direct' {
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  return 'direct'
}

/** Devuelve la etiqueta legible de la plataforma */
export function platformLabel(platform: Video['platform']): string {
  return { tiktok: 'TikTok', youtube: 'YouTube', direct: 'Archivo' }[platform]
}
