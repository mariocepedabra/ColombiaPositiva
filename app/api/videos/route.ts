import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { detectPlatform } from '@/lib/videos'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  try {
    const { data } = await supabase.rpc('get_my_profile')
    const profile = Array.isArray(data) ? data[0] as { role: string } : null
    return profile?.role === 'admin' ? user : null
  } catch { return null }
}

// GET — todos los videos activos (público)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('videos')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    return NextResponse.json({ videos: data ?? [] })
  } catch {
    return NextResponse.json({ videos: [] })
  }
}

// POST — crear video desde URL (solo admin)
export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  try {
    const { url, title, platform: explicitPlatform } = await request.json()
    if (!url) return NextResponse.json({ error: 'URL requerida' }, { status: 400 })

    const platform = explicitPlatform ?? detectPlatform(url)
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('videos')
      .insert({ url: url.trim(), title: title?.trim() ?? '', platform, is_active: true })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ video: data })
  } catch (err) {
    console.error('POST /api/videos:', err)
    return NextResponse.json({ error: 'Error al guardar el video' }, { status: 500 })
  }
}
