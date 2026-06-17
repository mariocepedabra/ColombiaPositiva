import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSettings } from '@/lib/settings'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const kind = (formData.get('kind') as string) || 'image' // 'image' | 'video'

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
    }

    const settings = await getSettings()
    const isVideo = kind === 'video'
    const allowed = isVideo ? VIDEO_TYPES : IMAGE_TYPES
    const maxMb = isVideo ? settings.ad_max_video_mb : settings.ad_max_image_mb

    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: isVideo ? 'Formato de video no permitido. Usa MP4, WebM o MOV.' : 'Formato de imagen no permitido. Usa JPG, PNG o WEBP.' },
        { status: 400 }
      )
    }

    if (file.size > maxMb * 1024 * 1024) {
      return NextResponse.json(
        { error: `El archivo no puede superar ${maxMb} MB` },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const ext = file.name.split('.').pop() ?? (isVideo ? 'mp4' : 'jpg')
    const filename = `pautas/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data, error } = await supabase.storage
      .from('article-images')
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('[pauta/upload] Storage error:', error)
      return NextResponse.json({ error: 'Error al subir el archivo: ' + error.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from('article-images')
      .getPublicUrl(data.path)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error) {
    console.error('[pauta/upload] error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
