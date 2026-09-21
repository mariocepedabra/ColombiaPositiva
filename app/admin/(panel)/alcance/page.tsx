import Link from 'next/link'

import AlcancePanel from '@/components/admin/AlcancePanel'
import { resumenAlcance } from '@/lib/app-api/eventos'
import { createClient } from '@/lib/supabase/server'

// Panel exclusivo del administrador: alcance de la app móvil (lecturas por
// sección, ciudad, hora y día; sección × ciudad para vender pauta) a partir
// de la estadística anónima que manda la app. Sin usuarios ni IPs.
export const dynamic = 'force-dynamic'

function fechaBogota(desplazamientoDias = 0): string {
  const d = new Date(Date.now() - desplazamientoDias * 86_400_000)
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
}

function validarFecha(v: string | undefined, porDefecto: string): string {
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : porDefecto
}

export default async function AlcancePage(props: { searchParams: Promise<{ desde?: string; hasta?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <p className="p-6 font-sans text-sm text-red-600">No autorizado</p>

  let role = (user.app_metadata as Record<string, string> | null)?.role ?? 'lector'
  try {
    const { data } = await supabase.rpc('get_my_profile')
    if (Array.isArray(data) && data.length > 0) role = (data[0] as { role: string }).role || role
  } catch { /* usar app_metadata */ }

  if (role !== 'admin') {
    return (
      <div className="bg-white border border-gris-200 p-8 text-center">
        <p className="font-heading font-700 text-xl text-tinta mb-1">Sección restringida</p>
        <p className="font-sans text-sm text-gris-600">El alcance de la app es visible solo para la administración.</p>
      </div>
    )
  }

  const sp = await props.searchParams
  const hasta = validarFecha(sp.hasta, fechaBogota(0))
  const desde = validarFecha(sp.desde, fechaBogota(29))
  const resumen = await resumenAlcance(desde, hasta)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading font-700 text-2xl text-tinta">Alcance de la app</h1>
          <p className="font-sans text-sm text-gris-600 mt-0.5">
            Lecturas anónimas desde la app móvil. Sirve para vender pauta por alcance (sección × ciudad), nunca datos de personas.
          </p>
        </div>
        <form className="flex items-end gap-2 font-sans text-xs" action="/admin/alcance" method="GET">
          <label className="flex flex-col gap-1 text-gris-600">
            Desde
            <input type="date" name="desde" defaultValue={desde} className="border border-gris-300 px-2 py-1.5 bg-white" />
          </label>
          <label className="flex flex-col gap-1 text-gris-600">
            Hasta
            <input type="date" name="hasta" defaultValue={hasta} className="border border-gris-300 px-2 py-1.5 bg-white" />
          </label>
          <button type="submit" className="bg-verde text-white font-700 uppercase tracking-wider px-4 py-2 hover:bg-verde-oscuro transition-colors">
            Ver
          </button>
          <Link
            href={`/api/admin/alcance?desde=${desde}&hasta=${hasta}`}
            className="border border-gris-300 text-gris-600 font-700 uppercase tracking-wider px-4 py-2 hover:border-tinta hover:text-tinta transition-colors"
          >
            Exportar CSV
          </Link>
        </form>
      </div>

      {resumen ? (
        <AlcancePanel resumen={resumen} desde={desde} hasta={hasta} />
      ) : (
        <div className="bg-white border border-gris-200 p-8">
          <p className="font-heading font-700 text-xl text-tinta mb-2">Falta un paso en la base de datos</p>
          <p className="font-sans text-sm text-gris-600 leading-relaxed">
            Ejecuta en Supabase → SQL Editor el archivo{' '}
            <code className="bg-gris-100 px-1">supabase/migrations/2026-09-21_push_y_alcance.sql</code>. Es aditivo: crea las tablas de
            tokens push y de eventos anónimos, y la función que arma este resumen. Hasta entonces la app descarta los eventos.
          </p>
        </div>
      )}
    </div>
  )
}
