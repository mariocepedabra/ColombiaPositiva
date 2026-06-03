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
      {/* Título de la sección */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 border-t-2 border-tinta" />
        <h2 className="font-sans font-700 text-xs uppercase tracking-[0.25em] text-tinta whitespace-nowrap">
          🎬 Historias de Colombia Positiva
        </h2>
        <div className="flex-1 border-t-2 border-tinta" />
      </div>

      <VideoCarousel videos={videos} />
    </section>
  )
}
