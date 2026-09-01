import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { importTikTokUrls } from '@/lib/social/sync'
import { revalidatePath } from 'next/cache'

// Importación masiva de enlaces de TikTok.
//
// TikTok solo entrega los 10 videos más recientes a quien no tiene sesión
// iniciada, así que el histórico no se puede enumerar automáticamente. Este
// endpoint recibe una lista de enlaces, la compara contra lo que ya está
// publicado en la web, e importa únicamente los que faltan.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function esAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    const { data } = await supabase.rpc('get_my_profile')
    const perfil = Array.isArray(data) ? (data[0] as { role: string }) : null
    return perfil?.role === 'admin'
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  try {
    const { texto } = await request.json()
    if (typeof texto !== 'string' || !texto.trim()) {
      return NextResponse.json({ error: 'Pega al menos un enlace de TikTok' }, { status: 400 })
    }

    const resultado = await importTikTokUrls(texto)

    if (resultado.importados > 0) {
      revalidatePath('/')
      revalidatePath('/admin/videos')
    }
    revalidatePath('/admin/metricas')

    return NextResponse.json(resultado)
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[importar-tiktok]', mensaje)
    return NextResponse.json({ error: mensaje }, { status: 500 })
  }
}
