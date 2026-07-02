import { createClient } from '@/lib/supabase/server'
import VideoManager from '@/components/admin/VideoManager'
import type { Video } from '@/lib/videos'
import { getVideoVisibility } from '@/lib/video-visibility'

export default async function VideosPage() {
  const supabase = await createClient()

  // Verificar sesión
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <p className="p-6 font-sans text-sm text-red-600">No autorizado</p>

  // Obtener todos los videos — el RLS permite al admin ver activos e inactivos
  let videos: Video[] = []
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error('[VideosPage] fetch error:', error.message)
    videos = (data ?? []) as Video[]
  } catch (err) {
    console.error('[VideosPage] exception:', err)
  }

  const visibility = await getVideoVisibility()

  return <VideoManager initialVideos={videos} initialVisibility={visibility} />
}
