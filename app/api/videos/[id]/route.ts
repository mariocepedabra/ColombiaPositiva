import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

// PATCH — actualizar video (toggle activo, editar título)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  try {
    const { id } = await params
    const body = await request.json()
    const supabase = createAdminClient()

    const allowed = ['is_active', 'title']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0)
      return NextResponse.json({ error: 'Sin campos para actualizar' }, { status: 400 })

    const { data, error } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ video: data })
  } catch (err) {
    console.error('PATCH /api/videos/[id]:', err)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

// DELETE — eliminar video (y archivo si es directo)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Obtener el video para saber si hay que borrar del storage
    const { data: video } = await supabase
      .from('videos')
      .select('url, platform')
      .eq('id', id)
      .single()

    // Si es archivo directo en Supabase Storage, eliminarlo también
    if (video?.platform === 'direct') {
      try {
        const url = new URL(video.url)
        const pathParts = url.pathname.split('/videos/')
        if (pathParts.length > 1) {
          await supabase.storage.from('videos').remove([pathParts[1]])
        }
      } catch { /* continuar aunque falle el borrado del archivo */ }
    }

    const { error } = await supabase.from('videos').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/videos/[id]:', err)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
