import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPlan, formatCop } from '@/lib/subscription'
import {
  getMyNotaSubmissions,
  getMyAds,
  getMySubscriptions,
  activeSubscription,
  formatMembershipDuration,
} from '@/lib/profile-stats'
import VisitedNotes from '@/components/perfil/VisitedNotes'

export const metadata: Metadata = {
  title: 'Mi perfil — Colombia Positiva',
  description: 'Tu actividad en Colombia Positiva: notas visitadas, aportes, suscripción y pautas.',
}

export const dynamic = 'force-dynamic'

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

function planLabel(plan: string): string {
  return getPlan(plan)?.name ?? (plan === 'manual' ? 'Acceso de cortesía' : plan)
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ingresar')

  // Nombre y rol (vía RPC, con respaldo en metadatos)
  let name = user.email?.split('@')[0] ?? 'Usuario'
  let role = (user.app_metadata as Record<string, string> | null)?.role ?? 'lector'
  try {
    const { data: rpcData } = await supabase.rpc('get_my_profile')
    if (Array.isArray(rpcData) && rpcData.length > 0) {
      const profile = rpcData[0] as { role: string; full_name: string }
      if (profile.full_name) name = profile.full_name
      if (profile.role) role = profile.role
    }
  } catch { /* usar metadatos */ }

  const email = user.email ?? ''
  const since = user.created_at

  const [notas, ads, subs] = await Promise.all([
    getMyNotaSubmissions(email),
    getMyAds(email),
    getMySubscriptions(user.id),
  ])

  const activeSub = activeSubscription(subs)
  const paidAds = ads.filter((a) => a.paid)
  const roleLabel = role === 'admin' ? 'Administrador' : role === 'columnista' ? 'Columnista' : 'Lector'
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Encabezado del perfil */}
      <div className="bg-white border border-gris-200 p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <span className="w-20 h-20 rounded-full bg-verde text-white flex items-center justify-center text-3xl font-700 flex-shrink-0">
          {initial}
        </span>
        <div className="text-center sm:text-left">
          <span className="font-sans text-xs font-700 uppercase tracking-widest text-verde">
            Mi perfil
          </span>
          <h1 className="font-heading font-900 text-3xl md:text-4xl text-tinta leading-tight mt-1">
            {name}
          </h1>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-sm text-gris-600 font-sans">
            <span>{email}</span>
            <span className="text-gris-300">·</span>
            <span className="bg-gris-100 px-2 py-0.5 text-xs font-700 uppercase tracking-wider text-gris-600">
              {roleLabel}
            </span>
          </div>
          <p className="font-sans text-xs text-gris-400 mt-2">
            Miembro desde el {fmtDate(since)} · {formatMembershipDuration(since)} en Colombia Positiva
          </p>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
        {/* Notas visitadas */}
        <section className="bg-white border border-gris-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📰</span>
            <h2 className="font-heading font-700 text-xl text-tinta">Notas que he visitado</h2>
          </div>
          <VisitedNotes />
        </section>

        {/* Notas Positivas aportadas */}
        <section className="bg-white border border-gris-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">✦</span>
            <h2 className="font-heading font-700 text-xl text-tinta">Mis Notas Positivas</h2>
          </div>
          <p className="font-sans text-sm text-gris-600 mb-3">
            Has aportado <strong className="text-tinta">{notas.length}</strong>{' '}
            {notas.length === 1 ? 'historia' : 'historias'} a Colombia Positiva.
          </p>
          {notas.length > 0 ? (
            <ul className="divide-y divide-gris-100 max-h-80 overflow-y-auto">
              {notas.map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-3 py-2.5">
                  <span className="font-heading text-sm text-tinta leading-snug">{n.title}</span>
                  <span className="font-sans text-[11px] text-gris-400 whitespace-nowrap mt-0.5">
                    {fmtDate(n.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Link
              href="/nota-positiva"
              className="inline-block font-sans text-xs bg-verde text-white px-4 py-2 hover:bg-verde-oscuro transition-colors"
            >
              Enviar mi primera Nota Positiva →
            </Link>
          )}
        </section>

        {/* Suscripción */}
        <section className="bg-white border border-gris-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎫</span>
            <h2 className="font-heading font-700 text-xl text-tinta">Mi suscripción</h2>
          </div>
          {activeSub ? (
            <div className="font-sans text-sm text-gris-600 space-y-1.5">
              <p>
                <span className="inline-block bg-verde-claro text-verde text-xs font-700 uppercase tracking-wider px-2 py-0.5">
                  Activa
                </span>
              </p>
              <p>Plan: <strong className="text-tinta">{planLabel(activeSub.plan)}</strong></p>
              <p>
                Vigencia:{' '}
                <strong className="text-tinta">
                  {activeSub.end_date ? `hasta el ${fmtDate(activeSub.end_date)}` : 'indefinida'}
                </strong>
              </p>
            </div>
          ) : (
            <div>
              <p className="font-sans text-sm text-gris-600 mb-3">
                No tienes una suscripción activa. Suscríbete para poder copiar el texto de las notas.
              </p>
              <Link
                href="/suscripcion"
                className="inline-block font-sans text-xs bg-verde text-white px-4 py-2 hover:bg-verde-oscuro transition-colors"
              >
                Ver planes de suscripción →
              </Link>
            </div>
          )}
        </section>

        {/* Pautas */}
        <section className="bg-white border border-gris-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📣</span>
            <h2 className="font-heading font-700 text-xl text-tinta">Mis pautas</h2>
          </div>
          {ads.length > 0 ? (
            <>
              <p className="font-sans text-sm text-gris-600 mb-3">
                Tienes <strong className="text-tinta">{ads.length}</strong>{' '}
                {ads.length === 1 ? 'pauta enviada' : 'pautas enviadas'}
                {paidAds.length > 0 && (
                  <> · <strong className="text-tinta">{paidAds.length}</strong> pagada{paidAds.length === 1 ? '' : 's'}</>
                )}
                .
              </p>
              <ul className="divide-y divide-gris-100 max-h-80 overflow-y-auto">
                {ads.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="font-sans text-sm text-gris-600">
                      {a.company || (a.media_type === 'video' ? 'Pauta en video' : 'Pauta en imagen')}
                      <span className="text-gris-400"> · {formatCop(a.price)}</span>
                    </span>
                    <span
                      className={`font-sans text-[11px] font-700 uppercase tracking-wider px-2 py-0.5 whitespace-nowrap ${
                        a.paid ? 'bg-verde-claro text-verde' : 'bg-gris-100 text-gris-600'
                      }`}
                    >
                      {a.paid ? 'Pagada' : 'Sin pagar'}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div>
              <p className="font-sans text-sm text-gris-600 mb-3">
                No has pagado ninguna pauta. Promociona tu marca o causa en Colombia Positiva.
              </p>
              <Link
                href="/pauta"
                className="inline-block font-sans text-xs bg-verde text-white px-4 py-2 hover:bg-verde-oscuro transition-colors"
              >
                Publicar una Pauta Positiva →
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
