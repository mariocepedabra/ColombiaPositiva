import { createClient } from '@/lib/supabase/server'
import { getAllProfiles } from '@/lib/articles'
import { redirect } from 'next/navigation'
import { updateUserRole } from '../../actions'

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  if (myProfile?.role !== 'admin') redirect('/admin')

  const profiles = await getAllProfiles()

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-700 text-2xl text-tinta">Usuarios</h1>
        <p className="font-sans text-sm text-gris-600 mt-0.5">{profiles.length} usuarios registrados</p>
      </div>

      <div className="bg-white border border-gris-200">
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-gris-200 bg-gris-100">
          <div className="col-span-4 font-sans text-xs uppercase tracking-widest text-gris-400">Nombre</div>
          <div className="col-span-3 font-sans text-xs uppercase tracking-widest text-gris-400">Rol actual</div>
          <div className="col-span-3 font-sans text-xs uppercase tracking-widest text-gris-400">Registro</div>
          <div className="col-span-2 font-sans text-xs uppercase tracking-widest text-gris-400">Cambiar rol</div>
        </div>

        {profiles.map((profile) => (
          <div key={profile.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-4 border-b border-gris-100 last:border-0 items-center">
            <div className="md:col-span-4">
              <p className="font-sans text-sm font-600 text-tinta">{profile.full_name || '(sin nombre)'}</p>
              <p className="font-sans text-xs text-gris-400">{profile.id.slice(0, 8)}...</p>
            </div>
            <div className="md:col-span-3">
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
            <div className="md:col-span-3">
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
                  const role = formData.get('role') as string
                  await updateUserRole(profile.id, role)
                }}>
                  <select
                    name="role"
                    defaultValue={profile.role}
                    className="w-full border border-gris-300 px-2 py-1.5 text-xs font-sans focus:outline-none focus:border-verde bg-white"
                  >
                    <option value="lector">Lector</option>
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
