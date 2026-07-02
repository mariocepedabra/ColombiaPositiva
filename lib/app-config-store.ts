import { createAdminClient } from '@/lib/supabase/admin'

// Almacén de configuración simple basado en un bucket privado de Supabase
// (app-config). Guarda pequeños archivos JSON sin requerir cambios en la BD.
// SOLO se usa en el servidor (service role).

const BUCKET = 'app-config'

export async function readConfigJson<T extends object>(path: string, fallback: T): Promise<T> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.storage.from(BUCKET).download(path)
    if (error || !data) return { ...fallback }
    const parsed = JSON.parse(await data.text())
    return { ...fallback, ...parsed }
  } catch {
    return { ...fallback }
  }
}

async function ensureBucket(admin: ReturnType<typeof createAdminClient>): Promise<void> {
  const { data } = await admin.storage.getBucket(BUCKET)
  if (data) return
  await admin.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 1024 * 1024,
    allowedMimeTypes: ['application/json'],
  })
}

export async function writeConfigJson(path: string, value: unknown): Promise<{ error?: string }> {
  try {
    const admin = createAdminClient()
    await ensureBucket(admin)
    const { error } = await admin.storage.from(BUCKET).upload(path, Buffer.from(JSON.stringify(value)), {
      contentType: 'application/json',
      upsert: true,
    })
    if (error) return { error: error.message }
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al guardar la configuración' }
  }
}
