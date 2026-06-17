'use client'

import { useState, useTransition } from 'react'
import { AD_ZONES, zoneLabel, type Ad } from '@/lib/ads'
import {
  approveAd, setAdStatus, togglePaid, deleteAd, setAdZones,
} from '@/app/admin/ads-actions'

const STATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', activo: 'Activo', pausado: 'Pausado', expirado: 'Expirado', rechazado: 'Rechazado',
}
const STATUS_COLOR: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  activo: 'bg-green-100 text-green-800',
  pausado: 'bg-gris-200 text-gris-600',
  expirado: 'bg-gris-200 text-gris-500',
  rechazado: 'bg-red-100 text-red-700',
}

export default function PautasManager({ ads }: { ads: Ad[] }) {
  if (ads.length === 0) {
    return (
      <div className="bg-white border border-gris-200 p-12 text-center">
        <p className="font-heading text-xl text-gris-400 italic">Aún no hay solicitudes de pauta</p>
        <p className="font-sans text-sm text-gris-400 mt-2">
          Las solicitudes enviadas desde <strong>/pauta</strong> aparecerán aquí.
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {ads.map((ad) => <AdRow key={ad.id} ad={ad} />)}
    </div>
  )
}

function AdRow({ ad }: { ad: Ad }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [zones, setZones] = useState<string[]>(ad.zones ?? [])
  const [editingZones, setEditingZones] = useState(false)

  function run(fn: () => Promise<{ error?: string }>) {
    setError('')
    startTransition(async () => {
      const r = await fn()
      if (r?.error) setError(r.error)
    })
  }

  function toggleZone(slug: string) {
    setZones((z) => z.includes(slug) ? z.filter((s) => s !== slug) : [...z, slug])
  }

  function saveZones() {
    run(async () => {
      const r = await setAdZones(ad.id, zones)
      if (!r.error) setEditingZones(false)
      return r
    })
  }

  return (
    <div className="bg-white border border-gris-200 p-5">
      <div className="flex flex-col md:flex-row gap-5">
        {/* Banner preview */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="border border-gris-200 bg-gris-100 overflow-hidden" style={{ aspectRatio: '970 / 250' }}>
            {ad.media_type === 'video' ? (
              <video src={ad.media_url} className="w-full h-full object-contain" muted loop playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ad.media_url} alt={ad.company || ad.advertiser_name} className="w-full h-full object-contain" />
            )}
          </div>
        </div>

        {/* Info + acciones */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-heading font-700 text-lg text-tinta">{ad.company || ad.advertiser_name}</h3>
              <p className="font-sans text-xs text-gris-600">{ad.advertiser_name}{ad.email ? ` · ${ad.email}` : ''}{ad.phone ? ` · ${ad.phone}` : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-sans text-xs px-2.5 py-1 rounded ${STATUS_COLOR[ad.status]}`}>{STATUS_LABEL[ad.status]}</span>
              <span className={`font-sans text-xs px-2.5 py-1 rounded ${ad.paid ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-600'}`}>
                {ad.paid ? '✓ Pagado' : '✗ No pagado'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 font-sans text-xs text-gris-600">
            <span><strong>{ad.days}</strong> día(s)</span>
            <span><strong>${ad.price.toLocaleString('es-CO')}</strong> COP</span>
            <span>{ad.media_type === 'video' ? '🎬 Video' : '🖼️ Imagen'}</span>
            {ad.target_url && <a href={ad.target_url} target="_blank" rel="noreferrer" className="text-verde hover:underline">Enlace ↗</a>}
            {ad.end_date && <span>Vence: {new Date(ad.end_date).toLocaleDateString('es-CO')}</span>}
          </div>

          {/* Zonas */}
          <div className="mt-3 border-t border-gris-100 pt-3">
            {!editingZones ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-sans text-xs font-700 uppercase tracking-wider text-gris-400">Zonas:</span>
                {zones.length === 0 ? (
                  <span className="font-sans text-xs text-gris-400 italic">sin asignar</span>
                ) : (
                  zones.map((z) => (
                    <span key={z} className="font-sans text-xs bg-verde-claro/30 text-verde-oscuro px-2 py-0.5 rounded">{zoneLabel(z)}</span>
                  ))
                )}
                <button onClick={() => setEditingZones(true)} className="font-sans text-xs text-verde hover:underline ml-1">Editar zonas</button>
              </div>
            ) : (
              <div>
                <p className="font-sans text-xs font-700 uppercase tracking-wider text-gris-400 mb-2">Selecciona dónde se mostrará el anuncio:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {AD_ZONES.map((z) => (
                    <label key={z.slug} className="flex items-center gap-2 font-sans text-xs text-gris-700 cursor-pointer">
                      <input type="checkbox" checked={zones.includes(z.slug)} onChange={() => toggleZone(z.slug)} className="accent-verde" />
                      {z.label}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={saveZones} disabled={isPending}
                    className="font-sans text-xs bg-verde text-white px-4 py-1.5 hover:bg-verde-oscuro disabled:opacity-60">Guardar zonas</button>
                  <button onClick={() => { setZones(ad.zones ?? []); setEditingZones(false) }}
                    className="font-sans text-xs text-gris-500 px-2 py-1.5 hover:underline">Cancelar</button>
                </div>
              </div>
            )}
          </div>

          {error && <p className="font-sans text-xs text-red-600 mt-2">{error}</p>}

          {/* Acciones principales */}
          <div className="flex flex-wrap gap-2 mt-3">
            {ad.status !== 'activo' && (
              <button onClick={() => run(() => approveAd(ad.id, ad.days))} disabled={isPending}
                className="font-sans text-xs bg-verde text-white px-4 py-1.5 hover:bg-verde-oscuro disabled:opacity-60">
                ✓ Aprobar y activar
              </button>
            )}
            {ad.status === 'activo' && (
              <button onClick={() => run(() => setAdStatus(ad.id, 'pausado'))} disabled={isPending}
                className="font-sans text-xs bg-gris-200 text-gris-700 px-4 py-1.5 hover:bg-gris-300 disabled:opacity-60">
                ⏸ Pausar
              </button>
            )}
            {ad.status === 'pausado' && (
              <button onClick={() => run(() => setAdStatus(ad.id, 'activo'))} disabled={isPending}
                className="font-sans text-xs bg-verde text-white px-4 py-1.5 hover:bg-verde-oscuro disabled:opacity-60">
                ▶ Reanudar
              </button>
            )}
            <button onClick={() => run(() => togglePaid(ad.id, !ad.paid))} disabled={isPending}
              className="font-sans text-xs border border-gris-300 text-gris-700 px-4 py-1.5 hover:border-verde disabled:opacity-60">
              {ad.paid ? 'Marcar NO pagado' : 'Marcar pagado'}
            </button>
            <button onClick={() => { if (confirm('¿Eliminar esta pauta? No se puede deshacer.')) run(() => deleteAd(ad.id)) }} disabled={isPending}
              className="font-sans text-xs text-red-600 px-4 py-1.5 hover:bg-red-50 disabled:opacity-60 ml-auto">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
