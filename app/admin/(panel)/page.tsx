import { createClient } from '@/lib/supabase/server'
import { getAllArticlesAdmin } from '@/lib/articles'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Usar RPC con SECURITY DEFINER (bypasea RLS) para obtener el perfil
  let profile: { role: string; full_name: string } | null = null
  try {
    const { data: rpcData } = await supabase.rpc('get_my_profile')
    if (Array.isArray(rpcData) && rpcData.length > 0) {
      profile = rpcData[0] as { role: string; full_name: string }
    }
  } catch {
    // fallback a app_metadata
  }
  // Asegurar nombre y rol desde app_metadata si el perfil no está disponible
  if (!profile) {
    profile = {
      role: (user!.app_metadata as Record<string, string>)?.role ?? 'lector',
      full_name: '',
    }
  }

  const articles = await getAllArticlesAdmin()
  const published = articles.filter((a) => a.is_published)
  const drafts = articles.filter((a) => !a.is_published)

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading font-700 text-3xl text-tinta">
          Bienvenido, {profile?.full_name?.split(' ')[0] || user!.email?.split('@')[0] || 'Editor'}
        </h1>
        <p className="font-sans text-sm text-gris-600 mt-1">
          Panel de administración · Colombia Positiva
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gris-200 p-6">
          <p className="font-sans text-xs uppercase tracking-widest text-gris-400 mb-1">Total artículos</p>
          <p className="font-heading font-700 text-4xl text-tinta">{articles.length}</p>
        </div>
        <div className="bg-white border border-gris-200 p-6">
          <p className="font-sans text-xs uppercase tracking-widest text-gris-400 mb-1">Publicados</p>
          <p className="font-heading font-700 text-4xl text-verde">{published.length}</p>
        </div>
        <div className="bg-white border border-gris-200 p-6">
          <p className="font-sans text-xs uppercase tracking-widest text-gris-400 mb-1">Borradores</p>
          <p className="font-heading font-700 text-4xl text-tinta">{drafts.length}</p>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/admin/nuevo"
          className="bg-verde text-white p-6 flex items-center gap-4 hover:bg-verde-oscuro transition-colors group"
        >
          <span className="text-3xl">✍️</span>
          <div>
            <p className="font-sans font-700 text-sm uppercase tracking-wider">Nueva nota</p>
            <p className="font-sans text-xs text-white/70 mt-0.5">Publicar un nuevo artículo</p>
          </div>
        </Link>
        <Link
          href="/admin/articulos"
          className="bg-white border border-gris-200 p-6 flex items-center gap-4 hover:border-verde transition-colors"
        >
          <span className="text-3xl">📰</span>
          <div>
            <p className="font-sans font-700 text-sm uppercase tracking-wider text-tinta">Mis artículos</p>
            <p className="font-sans text-xs text-gris-400 mt-0.5">Ver y gestionar todos los artículos</p>
          </div>
        </Link>
        {profile?.role === 'admin' && (
          <>
            <Link
              href="/admin/usuarios"
              className="bg-white border border-gris-200 p-6 flex items-center gap-4 hover:border-verde transition-colors"
            >
              <span className="text-3xl">👥</span>
              <div>
                <p className="font-sans font-700 text-sm uppercase tracking-wider text-tinta">Usuarios</p>
                <p className="font-sans text-xs text-gris-400 mt-0.5">Gestionar roles y accesos</p>
              </div>
            </Link>
            <Link
              href="/admin/notas-positivas"
              className="bg-white border border-gris-200 p-6 flex items-center gap-4 hover:border-verde transition-colors"
            >
              <span className="text-3xl">📬</span>
              <div>
                <p className="font-sans font-700 text-sm uppercase tracking-wider text-tinta">Notas del público</p>
                <p className="font-sans text-xs text-gris-400 mt-0.5">Historias enviadas por lectores</p>
              </div>
            </Link>
          </>
        )}
      </div>

      {/* Últimos artículos */}
      {articles.length > 0 && (
        <div className="bg-white border border-gris-200 p-6">
          <h2 className="font-sans font-700 text-xs uppercase tracking-widest text-gris-600 mb-4">
            Últimos artículos
          </h2>
          <div className="space-y-3">
            {articles.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-gris-100 last:border-0">
                <div>
                  <p className="font-sans text-sm text-tinta font-600 line-clamp-1">{a.title}</p>
                  <p className="font-sans text-xs text-gris-400">{a.category_slug} · {new Date(a.created_at).toLocaleDateString('es-CO')}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className={`font-sans text-xs px-2 py-0.5 ${a.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {a.is_published ? 'Publicado' : 'Borrador'}
                  </span>
                  <Link href={`/admin/editar/${a.id}`} className="font-sans text-xs text-verde hover:underline">
                    Editar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
