import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSettings } from '@/lib/settings'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

// Esta ruta NO recibe el archivo (para no chocar con el límite de tamaño de
// cuerpo de las funciones serverless de Vercel). En su lugar valida los datos
// del archivo y devuelve una URL firmada para que el navegador suba el archivo
// directamente a Supabase Storage. Así el límite real es el de Supabase / la
// configuración del panel, no el de la plataforma.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
    }

    const kind = body.kind === 'video' ? 'video' : 'image'
    const filename = typeof body.filename === 'string' ? body.filename : ''
    const contentType = typeof body.contentType === 'string' ? body.contentType : ''
    const size = typeof body.size === 'number' ? body.size : 0

    const settings = await getSettings()
    const isVideo = kind === 'video'
    const allowed = isVideo ? VIDEO_TYPES : IMAGE_TYPES
    const maxMb = isVideo ? settings.ad_max_video_mb : settings.ad_max_image_mb

    if (!allowed.includes(contentType)) {
      return NextResponse.json(
        { error: isVideo ? 'Formato de video no permitido. Usa MP4, WebM o MOV.' : 'Formato de imagen no permitido. Usa JPG, PNG o WEBP.' },
        { status: 400 }
      )
    }

    if (size > maxMb * 1024 * 1024) {
      return NextResponse.json(
        { error: `El archivo no puede superar ${maxMb} MB` },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    // Cada tipo va al bucket que corresponde: las imágenes a "article-images" y
    // los videos a "videos" (ese bucket admite formatos de video y tiene un
    // límite de tamaño mayor). El navegador subirá el archivo directamente ahí.
    const bucket = isVideo ? 'videos' : 'article-images'
    const ext = filename.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg')
    const path = `pautas/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path)

    if (error || !data) {
      console.error('[pauta/upload] Signed URL error:', error)
      return NextResponse.json({ error: 'No se pudo preparar la subida del archivo' }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return NextResponse.json({
      path: data.path,
      token: data.token,
      publicUrl: urlData.publicUrl,
      bucket,
      contentType,
    })
  } catch (error) {
    console.error('[pauta/upload] error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
