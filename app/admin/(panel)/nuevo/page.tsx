import { createClient } from '@/lib/supabase/server'
import ArticleForm from '@/components/admin/ArticleForm'
import Link from 'next/link'

export default async function NuevoArticuloPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let fullName = 'Redacción Colombia Positiva'
  try {
    const { data: rpcData } = await supabase.rpc('get_my_profile')
    if (Array.isArray(rpcData) && rpcData.length > 0) {
      fullName = (rpcData[0] as { full_name: string }).full_name || fullName
    }
  } catch { /* usar valor por defecto */ }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/articulos" className="font-sans text-xs text-gris-400 hover:text-verde transition-colors">
          ← Artículos
        </Link>
        <span className="text-gris-300">/</span>
        <h1 className="font-heading font-700 text-2xl text-tinta">Nueva nota</h1>
      </div>

      <ArticleForm authorName={fullName} />
    </div>
  )
}
