import { createClient } from '@/lib/supabase/server'
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role === 'lector') {
    redirect('/admin/login?error=sin-permisos')
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
