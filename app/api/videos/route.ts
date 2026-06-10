import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectPlatform, platformLabel } from '@/lib/videos'

async function getAdminClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  try {
    const { data } = await supabase.rpc('get_my_profile')
    const profile = Array.isArray(data) ? data[0] as { role: string } : null
    if (profile?.role !== 'admin') return null
    return supabase  // devolver el cliente autenticado como Mario
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
  const supabase = await getAdminClient()
  if (!supabase) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  try {
    const { url, title, platform: explicitPlatform } = await request.json()
    if (!url) return NextResponse.json({ error: 'URL requerida' }, { status: 400 })

    const platform = explicitPlatform ?? detectPlatform(url)

    // El link debe corresponder a la división elegida (Instagram/Facebook/TikTok)
    if (['instagram', 'facebook', 'tiktok'].includes(platform) && detectPlatform(url) !== platform) {
      return NextResponse.json(
        { error: `El link no corresponde a ${platformLabel(platform)}. Verifica la URL.` },
        { status: 400 }
      )
    }

    const row = { url: url.trim(), title: title?.trim() ?? '', is_active: true }
    let { data, error } = await supabase
      .from('videos')
      .insert({ ...row, platform })
      .select()
      .single()

    // Si la columna platform tiene un CHECK antiguo que no acepta los valores
    // nuevos (instagram/facebook), guardamos 'direct': la portada y el panel
    // clasifican por URL, así que el video queda en la división correcta.
    if (error?.code === '23514') {
      ;({ data, error } = await supabase
        .from('videos')
        .insert({ ...row, platform: 'direct' })
        .select()
        .single())
    }

    if (error) {
      console.error('Video insert error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ video: data })
  } catch (err) {
    console.error('POST /api/videos:', err)
    return NextResponse.json({ error: 'Error al guardar el video' }, { status: 500 })
  }
}
