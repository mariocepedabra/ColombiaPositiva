'use server'

import { createClient } from '@/lib/supabase/server'
import { setVideoVisibility, type VideoVisibility } from '@/lib/video-visibility'
import { revalidatePath } from 'next/cache'

// Verifica que el usuario actual sea admin (mismo criterio que ads-actions).
async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  let role = (user.app_metadata as Record<string, string>)?.role ?? 'lector'
  try {
    const { data: rpcData } = await supabase.rpc('get_my_profile')
    if (Array.isArray(rpcData) && rpcData.length > 0) {
      role = (rpcData[0] as { role: string }).role || role
    }
  } catch { /* usar app_metadata */ }
  return role === 'admin'
}

export async function saveVideoVisibility(next: VideoVisibility): Promise<{ error?: string }> {
  if (!await isCurrentUserAdmin()) return { error: 'Sin permisos' }
  const res = await setVideoVisibility(next)
  if (res.error) return { error: res.error }
  revalidatePath('/')
  revalidatePath('/admin/videos')
  return {}
}
