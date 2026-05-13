import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AdminNav from '@/components/admin/AdminNav'

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  // Intentar con admin client (bypasea RLS)
  const adminClient = createAdminClient()
  const { data: profileAdmin, error: adminError } = await adminClient
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (adminError || !profileAdmin) {
    console.error('[PanelLayout] Admin client error:', adminError?.message, '| user.id:', user.id)
  }

  // Fallback: intentar con el cliente normal (usa sesión del usuario)
  let profile = profileAdmin
  if (!profile) {
    const { data: profileFallback, error: fallbackError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle()

    if (fallbackError) {
      console.error('[PanelLayout] Fallback client error:', fallbackError.message)
    }
    profile = profileFallback
  }

  console.log('[PanelLayout] user.id:', user.id, '| profile:', JSON.stringify(profile))

  if (!profile || profile.role === 'lector') {
    // Redirigir al home (NO a /admin/login) para evitar loop con el middleware
    redirect('/?acceso=denegado')
  }

  return (
    <div className="min-h-screen bg-gris-100 flex">
      <AdminNav profile={profile} userEmail={user.email ?? ''} />
      <main className="flex-1 ml-0 md:ml-64 p-6">
        {children}
      </main>
    </div>
  )
}
