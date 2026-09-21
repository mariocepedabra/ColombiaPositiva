import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    if (!slug) return NextResponse.json({ success: false })

    const supabase = createAdminClient()
    await supabase.rpc('increment_view_count', { article_slug: slug })

    // Conteo por día para "las más leídas de la semana" (web y app). Si la
    // migración 2026-09-21_vistas_diarias.sql aún no se corrió, la función no
    // existe y simplemente se ignora: el contador acumulado sigue igual.
    await supabase.rpc('increment_daily_view', { article_slug: slug }).then(
      () => undefined,
      () => undefined,
    )

    return NextResponse.json({ success: true })
  } catch {
    // No interrumpir la experiencia del usuario si falla
    return NextResponse.json({ success: false })
  }
}
