import { createClient } from '@/lib/supabase/server'
import { getAllProfiles } from '@/lib/articles'
import { getActiveSubscriberIds, getUserEmails } from '@/lib/admin-data'
import { redirect } from 'next/navigation'
import { setUserAccess } from '@/app/admin/ads-actions'

export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()

  // Verificar rol via RPC (bypasea RLS)
  let myRole = (user!.app_metadata as Record<string, string>)?.role ?? 'lector'
  try {
    const { data: rpcData } = await supabase.rpc('get_my_profile')
    if (Array.isArray(rpcData) && rpcData.length > 0) {
      myRole = (rpcData[0] as { role: string }).role || myRole
    }
  } catch { /* usar app_metadata */ }

  if (myRole !== 'admin') redirect('/admin')

  const [profiles, activeSubs, emails] = await Promise.all([
    getAllProfiles(session?.access_token),
    getActiveSubscriberIds(),
    getUserEmails(),
  ])

  // ¿Este usuario puede copiar el texto de las notas?
  const canCopy = (p: { id: string; role: string; full_name: string }) =>
    p.role === 'admin' || p.full_name?.toLowerCase().includes('mario') || activeSubs.has(p.id)

  // Acceso efectivo para el selector (Suscriptor = suscripción activa, role 'lector')
  const accessValue = (p: { id: string; role: string }) => {
    if (p.role === 'admin') return 'admin'
    if (p.role === 'columnista') return 'columnista'
    if (activeSubs.has(p.id)) return 'suscriptor'
    return 'lector'
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-700 text-2xl text-tinta">Usuarios</h1>
        <p className="font-sans text-sm text-gris-600 mt-0.5">{profiles.length} usuarios registrados</p>
      </div>

      <div className="bg-white border border-gris-200">
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-gris-200 bg-gris-100">
          <div className="col-span-4 font-sans text-xs uppercase tracking-widest text-gris-400">Usuario</div>
          <div className="col-span-2 font-sans text-xs uppercase tracking-widest text-gris-400">Rol actual</div>
          <div className="col-span-2 font-sans text-xs uppercase tracking-widest text-gris-400">Puede copiar</div>
          <div className="col-span-2 font-sans text-xs uppercase tracking-widest text-gris-400">Registro</div>
          <div className="col-span-2 font-sans text-xs uppercase tracking-widest text-gris-400">Cambiar rol</div>
        </div>

        {profiles.map((profile) => (
          <div key={profile.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-4 border-b border-gris-100 last:border-0 items-center">
            <div className="md:col-span-4">
              <p className="font-sans text-sm font-600 text-tinta">{profile.full_name || '(sin nombre)'}</p>
              <p className="font-sans text-xs text-gris-400">{emails.get(profile.id) ?? `${profile.id.slice(0, 8)}...`}</p>
            </div>
            <div className="md:col-span-2">
              <span className={`font-sans text-xs px-3 py-1 ${
                profile.role === 'admin'
                  ? 'bg-verde text-white'
                  : profile.role === 'columnista'
                  ? 'bg-tinta text-white'
                  : 'bg-gris-200 text-gris-600'
              }`}>
                {profile.role === 'admin' ? 'Administrador'
                  : profile.role === 'columnista' ? 'Columnista'
                  : 'Lector'}
              </span>
            </div>
            <div className="md:col-span-2">
              {canCopy(profile) ? (
                <span className="font-sans text-xs px-3 py-1 bg-green-100 text-green-800 rounded">✓ Sí</span>
              ) : (
                <span className="font-sans text-xs px-3 py-1 bg-gris-100 text-gris-500 rounded">✗ No</span>
              )}
            </div>
            <div className="md:col-span-2">
              <p className="font-sans text-xs text-gris-400">
                {new Date(profile.created_at).toLocaleDateString('es-CO', {
                  year: 'numeric', month: 'short', day: 'numeric'
                })}
              </p>
            </div>
            <div className="md:col-span-2">
              {profile.id !== user!.id && (
                <form action={async (formData: FormData) => {
                  'use server'
                  const value = formData.get('role') as string
                  const email = (formData.get('email') as string) || null
                  await setUserAccess(formData.get('user_id') as string, email, value)
                }}>
                  <input type="hidden" name="user_id" value={profile.id} />
                  <input type="hidden" name="email" value={emails.get(profile.id) ?? ''} />
                  <select
                    name="role"
                    defaultValue={accessValue(profile)}
                    className="w-full border border-gris-300 px-2 py-1.5 text-xs font-sans focus:outline-none focus:border-verde bg-white"
                  >
                    <option value="lector">Lector</option>
                    <option value="suscriptor">Suscriptor</option>
                    <option value="columnista">Columnista</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="submit"
                    className="mt-1 w-full font-sans text-xs text-verde hover:underline text-left"
                  >
                    Aplicar →
                  </button>
                </form>
              )}
              {profile.id === user!.id && (
                <span className="font-sans text-xs text-gris-400 italic">Tu cuenta</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
