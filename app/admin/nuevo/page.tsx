import { createClient } from '@/lib/supabase/server'
import ArticleForm from '@/components/admin/ArticleForm'
import Link from 'next/link'

export default async function NuevoArticuloPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user!.id).single()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/articulos" className="font-sans text-xs text-gris-400 hover:text-verde transition-colors">
          ← Artículos
        </Link>
        <span className="text-gris-300">/</span>
        <h1 className="font-heading font-700 text-2xl text-tinta">Nueva nota</h1>
      </div>

      <ArticleForm authorName={profile?.full_name || 'Redacción Colombia Positiva'} />
    </div>
  )
}
