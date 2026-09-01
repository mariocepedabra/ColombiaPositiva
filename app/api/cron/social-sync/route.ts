import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runSocialSync } from '@/lib/social/sync'
import { revalidatePath } from 'next/cache'

// Sincronización diaria de redes. La dispara el cron de Vercel (ver vercel.json)
// y también el botón "Sincronizar ahora" del panel de métricas.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** El cron de Vercel manda `Authorization: Bearer <CRON_SECRET>`. */
function esCronAutorizado(request: NextRequest): boolean {
  const secreto = process.env.CRON_SECRET
  if (!secreto) return false
  return request.headers.get('authorization') === `Bearer ${secreto}`
}

/** Mario, ya autenticado como admin, puede lanzarla a mano desde el panel. */
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

export async function GET(request: NextRequest) {
  if (!esCronAutorizado(request) && !(await esAdmin())) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  try {
    const report = await runSocialSync()

    // Si entraron videos nuevos, refrescar la portada y el panel.
    if (report.imported > 0) {
      revalidatePath('/')
      revalidatePath('/admin/videos')
    }
    revalidatePath('/admin/metricas')

    return NextResponse.json(report, { status: report.ok ? 200 : 207 })
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[cron/social-sync]', mensaje)
    return NextResponse.json({ ok: false, error: mensaje }, { status: 500 })
  }
}
