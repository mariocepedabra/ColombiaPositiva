import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo']
const MAX_SIZE = 500 * 1024 * 1024 // 500 MB

async function getAdminClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  try {
    const { data } = await supabase.rpc('get_my_profile')
    const profile = Array.isArray(data) ? data[0] as { role: string } : null
    if (profile?.role !== 'admin') return null
    return supabase
  } catch { return null }
}

export async function POST(request: NextRequest) {
  const supabase = await getAdminClient()
  if (!supabase) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  try {
    const formData = await request.formData()
    const file  = formData.get('file')  as File | null
    const title = (formData.get('title') as string | null)?.trim() ?? ''

    if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    if (!ALLOWED.includes(file.type))
      return NextResponse.json({ error: 'Formato no permitido. Usa MP4, MOV o WEBM.' }, { status: 400 })
    if (file.size > MAX_SIZE)
      return NextResponse.json({ error: 'El archivo no puede superar 500 MB' }, { status: 400 })

    const ext      = file.name.split('.').pop() ?? 'mp4'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer   = Buffer.from(await file.arrayBuffer())

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filename, buffer, { contentType: file.type, cacheControl: '3600', upsert: false })

    if (uploadError) {
      console.error('Storage upload error:', uploadError.message)
      return NextResponse.json({ error: 'Error al subir el archivo: ' + uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('videos').getPublicUrl(uploadData.path)

    const { data: videoData, error: dbError } = await supabase
      .from('videos')
      .insert({ url: urlData.publicUrl, title, platform: 'direct', is_active: true })
      .select()
      .single()

    if (dbError) throw dbError
    return NextResponse.json({ video: videoData })
  } catch (err) {
    console.error('POST /api/videos/upload:', err)
    return NextResponse.json({ error: 'Error al subir el video' }, { status: 500 })
  }
}
