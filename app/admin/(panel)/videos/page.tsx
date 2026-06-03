import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import VideoManager from '@/components/admin/VideoManager'
import type { Video } from '@/lib/videos'

export default async function VideosPage() {
  // Verificar que es admin
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return <p>No autorizado</p>

  // Obtener todos los videos (incluyendo inactivos) con admin client
  let videos: Video[] = []
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
    videos = (data ?? []) as Video[]
  } catch {
    videos = []
  }

  return <VideoManager initialVideos={videos} />
}
