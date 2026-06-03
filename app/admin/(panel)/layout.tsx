import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminNav from '@/components/admin/AdminNav'
import AdminMobileNav from '@/components/admin/AdminMobileNav'

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  // 1. Leer el rol directamente de app_metadata (sin query a la BD)
  //    Se actualiza con el SQL: UPDATE auth.users SET raw_app_meta_data = ...
  const metaRole = (user.app_metadata as Record<string, string> | null)?.role

  // 2. Intentar obtener el perfil completo via RPC (SECURITY DEFINER, bypasea RLS)
  let profile: { role: string; full_name: string } | null = null
  try {
    const { data: rpcData } = await supabase.rpc('get_my_profile')
    if (Array.isArray(rpcData) && rpcData.length > 0) {
      profile = rpcData[0] as { role: string; full_name: string }
    }
  } catch {
    // Si la función RPC no existe todavía, continuar con metaRole
  }

  // 3. Determinar el rol efectivo
  const effectiveRole = profile?.role || metaRole || 'lector'

  console.log('[PanelLayout] user:', user.email, '| metaRole:', metaRole, '| profileRole:', profile?.role)

  if (!effectiveRole || effectiveRole === 'lector') {
    redirect('/?acceso=denegado')
  }

  // 4. Construir el objeto de perfil para AdminNav
  const navProfile = profile ?? { role: effectiveRole, full_name: '' }

  return (
    <div className="min-h-screen bg-gris-100 flex">
      <AdminNav profile={navProfile} userEmail={user.email ?? ''} />
      <AdminMobileNav profile={navProfile} userEmail={user.email ?? ''} />
      <main className="flex-1 ml-0 md:ml-64 p-6 pt-16 md:pt-6">
        {children}
      </main>
    </div>
  )
}
