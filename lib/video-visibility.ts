import { createAdminClient } from '@/lib/supabase/admin'

// Visibilidad de cada división de "Historias de Colombia Positiva" en la portada.
// Se guarda como un pequeño JSON en un bucket privado de Supabase (app-config),
// para no requerir cambios en la base de datos. SOLO se usa en el servidor.

export type VideoVisibility = {
  instagram: boolean
  facebook: boolean
  tiktok: boolean
}

export const DEFAULT_VIDEO_VISIBILITY: VideoVisibility = {
  instagram: true,
  facebook: true,
  tiktok: true,
}

const BUCKET = 'app-config'
const PATH = 'video-visibility.json'

// Cualquier valor ausente o no-booleano se interpreta como "visible" (true).
function normalize(raw: unknown): VideoVisibility {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    instagram: r.instagram !== false,
    facebook: r.facebook !== false,
    tiktok: r.tiktok !== false,
  }
}

export async function getVideoVisibility(): Promise<VideoVisibility> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.storage.from(BUCKET).download(PATH)
    if (error || !data) return { ...DEFAULT_VIDEO_VISIBILITY }
    return normalize(JSON.parse(await data.text()))
  } catch {
    // Ante cualquier fallo, todo visible: la portada nunca se rompe por esto.
    return { ...DEFAULT_VIDEO_VISIBILITY }
  }
}

// Crea el bucket de configuración si aún no existe (red de seguridad; en
// producción ya se creó de antemano).
async function ensureBucket(admin: ReturnType<typeof createAdminClient>): Promise<void> {
  const { data } = await admin.storage.getBucket(BUCKET)
  if (data) return
  await admin.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 1024 * 1024,
    allowedMimeTypes: ['application/json'],
  })
}

export async function setVideoVisibility(next: VideoVisibility): Promise<{ error?: string }> {
  try {
    const admin = createAdminClient()
    await ensureBucket(admin)
    const body = Buffer.from(JSON.stringify(normalize(next)))
    const { error } = await admin.storage.from(BUCKET).upload(PATH, body, {
      contentType: 'application/json',
      upsert: true,
    })
    if (error) return { error: error.message }
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al guardar la visibilidad' }
  }
}
