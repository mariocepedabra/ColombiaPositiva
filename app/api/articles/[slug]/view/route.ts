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

    return NextResponse.json({ success: true })
  } catch {
    // No interrumpir la experiencia del usuario si falla
    return NextResponse.json({ success: false })
  }
}
