import { createClient } from '@/lib/supabase/server'
import type { Video } from '@/lib/videos'
import VideoCarousel from './VideoCarousel'

async function getActiveVideos(): Promise<Video[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('videos')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    return (data ?? []) as Video[]
  } catch {
    return []
  }
}

export default async function VideoSection() {
  const videos = await getActiveVideos()
  if (videos.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      {/* Título de la sección — mismo estilo que "Noticias Principales" */}
      <div className="ornament text-xs tracking-widest uppercase mb-5 font-sans">
        <span>Historias de Colombia Positiva</span>
      </div>

      <VideoCarousel videos={videos} />
    </section>
  )
}
