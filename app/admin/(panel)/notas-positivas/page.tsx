import { createClient } from '@/lib/supabase/server'
import { getNotaPositivaSubmissions } from '@/lib/articles'
import { redirect } from 'next/navigation'

export default async function NotasPositivasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  if (profile?.role !== 'admin') redirect('/admin')

  const submissions = await getNotaPositivaSubmissions()

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-700 text-2xl text-tinta">Notas del público</h1>
        <p className="font-sans text-sm text-gris-600 mt-0.5">
          {submissions.length} historias enviadas por lectores
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-white border border-gris-200 p-12 text-center">
          <p className="font-heading text-xl text-gris-400 italic">Aún no hay envíos del público</p>
          <p className="font-sans text-sm text-gris-400 mt-2">
            Las historias enviadas desde <strong>Nota Positiva</strong> aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => (
            <div key={s.id} className="bg-white border border-gris-200 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-heading font-700 text-lg text-tinta">{s.title}</h3>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="font-sans text-xs text-gris-600">
                      <strong>{s.name}</strong>
                    </span>
                    {s.email && (
                      <span className="font-sans text-xs text-gris-400">{s.email}</span>
                    )}
                    {s.region && (
                      <span className="font-sans text-xs bg-gris-100 px-2 py-0.5 text-gris-600">
                        {s.region}
                      </span>
                    )}
                  </div>
                </div>
                <p className="font-sans text-xs text-gris-400 whitespace-nowrap">
                  {new Date(s.created_at).toLocaleDateString('es-CO', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </p>
              </div>

              <p className="font-sans text-sm text-gris-600 leading-relaxed mb-3">{s.description}</p>

              {s.media_url && (
                <div className="mt-2">
                  <span className="font-sans text-xs font-700 uppercase tracking-wider text-gris-400">
                    {s.media_type === 'video' ? '🎥 Video:' : '🖼️ Imagen:'}
                  </span>{' '}
                  <a
                    href={s.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-xs text-verde hover:underline break-all"
                  >
                    {s.media_url}
                  </a>
                </div>
              )}

              <div className="mt-4 flex gap-3">
                <a
                  href={`/admin/nuevo?titulo=${encodeURIComponent(s.title)}`}
                  className="font-sans text-xs bg-verde text-white px-4 py-1.5 hover:bg-verde-oscuro transition-colors"
                >
                  Convertir en artículo →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
