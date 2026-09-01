'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { PanelData, PanelVideo, PanelTotals } from '@/lib/social/panel'
import type { SocialPlatform } from '@/lib/social/accounts'

const REDES: { key: SocialPlatform; nombre: string; color: string; icono: string }[] = [
  {
    key: 'tiktok',
    nombre: 'TikTok',
    color: '#111111',
    icono:
      'M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  },
  {
    key: 'instagram',
    nombre: 'Instagram',
    color: '#c13584',
    icono:
      'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  {
    key: 'facebook',
    nombre: 'Facebook',
    color: '#1877f2',
    icono:
      'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
]

const num = (n: number) => n.toLocaleString('es-CO')

function fecha(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function fechaHora(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  })
}

export default function SocialMetrics({ data }: { data: PanelData }) {
  const router = useRouter()
  const [filtro, setFiltro] = useState<SocialPlatform | 'todas'>('todas')
  const [sincronizando, setSincronizando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [error, setError] = useState('')

  const visibles = useMemo(
    () => (filtro === 'todas' ? data.videos : data.videos.filter((v) => v.platform === filtro)),
    [data.videos, filtro]
  )

  const maxViews = Math.max(...visibles.map((v) => v.views), 1)

  async function sincronizar() {
    setSincronizando(true)
    setAviso('')
    setError('')
    try {
      const res = await fetch('/api/cron/social-sync')
      const json = await res.json()
      if (!res.ok && res.status !== 207) throw new Error(json.error || 'No se pudo sincronizar')

      const partes = [`${json.updated ?? 0} videos actualizados`]
      if (json.imported > 0) partes.push(`${json.imported} nuevos publicados en la portada`)
      setAviso(`Listo: ${partes.join(' · ')}`)
      if (json.errors?.length) setError(json.errors.join(' · '))
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo sincronizar')
    } finally {
      setSincronizando(false)
    }
  }

  // ── Falta ejecutar la migración SQL ────────────────────────────────
  if (data.needsSetup) {
    return (
      <div>
        <Cabecera />
        <div className="bg-white border-l-4 border-amber-500 border-y border-r border-gris-200 p-6">
          <p className="font-heading font-700 text-lg text-tinta mb-2">
            Falta un paso para activar el panel
          </p>
          <p className="font-sans text-sm text-gris-600 leading-relaxed mb-4">
            Las tablas de métricas todavía no existen en la base de datos. Abre el{' '}
            <strong>SQL Editor de Supabase</strong> y ejecuta una sola vez el archivo{' '}
            <code className="bg-gris-100 px-1.5 py-0.5 text-xs">
              supabase/migrations/2026-09-01_metricas_redes.sql
            </code>{' '}
            del repositorio. Es aditivo: no borra ni modifica nada de lo que ya existe.
          </p>
          <p className="font-sans text-xs text-gris-400">
            Detalle técnico: {data.setupMessage}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Cabecera />

      {/* Estado de la sincronización */}
      <div className="bg-white border border-gris-200 p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <p className="font-sans text-xs uppercase tracking-widest text-gris-400 mb-1">
            Última actualización automática
          </p>
          <p className="font-sans text-sm text-tinta">
            {data.lastRun ? (
              <>
                {fechaHora(data.lastRun.finished_at ?? data.lastRun.started_at)}
                {data.lastRun.imported > 0 && (
                  <span className="text-verde font-600">
                    {' '}
                    · {data.lastRun.imported} video{data.lastRun.imported === 1 ? '' : 's'} nuevo
                    {data.lastRun.imported === 1 ? '' : 's'} publicado
                    {data.lastRun.imported === 1 ? '' : 's'}
                  </span>
                )}
              </>
            ) : (
              <span className="text-gris-400 italic">Aún no se ha ejecutado</span>
            )}
          </p>
          <p className="font-sans text-xs text-gris-400 mt-0.5">
            Se actualiza sola todos los días a las 3:00 a. m. (hora de Colombia)
          </p>
        </div>
        <button
          onClick={sincronizar}
          disabled={sincronizando}
          className="font-sans text-xs uppercase tracking-widest bg-verde text-white px-5 py-2.5 hover:bg-verde-oscuro transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {sincronizando ? 'Sincronizando…' : '↻ Sincronizar ahora'}
        </button>
      </div>

      {aviso && (
        <p className="font-sans text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-2.5 mb-4">
          {aviso}
        </p>
      )}
      {error && (
        <p className="font-sans text-sm text-amber-800 bg-amber-50 border border-amber-200 px-4 py-2.5 mb-4">
          {error}
        </p>
      )}

      {/* Totales globales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Tarjeta etiqueta="Vistas totales" valor={data.global.views} destacada />
        <Tarjeta etiqueta="Me gusta" valor={data.global.likes} />
        <Tarjeta etiqueta="Comentarios" valor={data.global.comments} />
        <Tarjeta etiqueta="Compartidos" valor={data.global.shares} />
      </div>

      {/* Resumen por red */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {REDES.map((red) => (
          <TarjetaRed key={red.key} red={red} total={data.totals[red.key]} />
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Pestana
          activa={filtro === 'todas'}
          onClick={() => setFiltro('todas')}
          label={`Todas (${data.videos.length})`}
        />
        {REDES.map((red) => (
          <Pestana
            key={red.key}
            activa={filtro === red.key}
            onClick={() => setFiltro(red.key)}
            label={`${red.nombre} (${data.totals[red.key].videos})`}
            color={red.color}
          />
        ))}
      </div>

      {/* Ranking */}
      <div className="bg-white border border-gris-200">
        <div className="hidden lg:grid grid-cols-12 gap-3 px-4 py-3 border-b border-gris-200 bg-gris-100">
          <div className="col-span-1 font-sans text-xs uppercase tracking-widest text-gris-400">#</div>
          <div className="col-span-5 font-sans text-xs uppercase tracking-widest text-gris-400">Video</div>
          <div className="col-span-3 font-sans text-xs uppercase tracking-widest text-gris-400">Vistas</div>
          <div className="col-span-3 font-sans text-xs uppercase tracking-widest text-gris-400">
            Interacciones
          </div>
        </div>

        {visibles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-heading text-xl text-gris-400 italic mb-2">
              Todavía no hay métricas para esta red
            </p>
            <p className="font-sans text-sm text-gris-400">
              {filtro === 'instagram' || filtro === 'facebook'
                ? 'Instagram y Facebook necesitan conectar la API de Meta. Los pasos están en METRICAS-REDES.md.'
                : 'Usa “Sincronizar ahora” para traer los datos por primera vez.'}
            </p>
          </div>
        ) : (
          visibles.map((video, idx) => (
            <FilaVideo key={`${video.platform}:${video.external_id}`} video={video} indice={idx} maxViews={maxViews} />
          ))
        )}
      </div>
    </div>
  )
}

function Cabecera() {
  return (
    <div className="mb-6">
      <h1 className="font-heading font-700 text-2xl text-tinta">Métricas de Redes Sociales</h1>
      <p className="font-sans text-sm text-gris-600 mt-0.5">
        Rendimiento de los videos de Colombia Positiva en TikTok, Instagram y Facebook
      </p>
    </div>
  )
}

function Tarjeta({
  etiqueta,
  valor,
  destacada = false,
}: {
  etiqueta: string
  valor: number
  destacada?: boolean
}) {
  return (
    <div className="bg-white border border-gris-200 p-5">
      <p className="font-sans text-xs uppercase tracking-widest text-gris-400 mb-2">{etiqueta}</p>
      <p
        className={`font-heading font-900 ${destacada ? 'text-4xl text-verde' : 'text-3xl text-tinta'}`}
      >
        {num(valor)}
      </p>
    </div>
  )
}

function TarjetaRed({
  red,
  total,
}: {
  red: (typeof REDES)[number]
  total: PanelTotals
}) {
  const sinDatos = total.videos === 0
  return (
    <div className="bg-white border border-gris-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4" fill={red.color} viewBox="0 0 24 24" aria-hidden>
          <path d={red.icono} />
        </svg>
        <h3
          className="font-sans font-700 text-xs uppercase tracking-widest"
          style={{ color: red.color }}
        >
          {red.nombre}
        </h3>
      </div>

      {sinDatos ? (
        <p className="font-sans text-sm text-gris-400 italic">
          {red.key === 'tiktok' ? 'Sin datos aún' : 'Pendiente de conectar'}
        </p>
      ) : (
        <>
          <p className="font-heading font-900 text-3xl text-tinta leading-none">
            {num(total.views)}
          </p>
          <p className="font-sans text-xs text-gris-400 mt-1 mb-3">vistas acumuladas</p>
          <div className="flex gap-4 font-sans text-xs text-gris-600">
            <span>{num(total.videos)} videos</span>
            <span>♥ {num(total.likes)}</span>
            <span>💬 {num(total.comments)}</span>
          </div>
        </>
      )}
    </div>
  )
}

function Pestana({
  activa,
  onClick,
  label,
  color,
}: {
  activa: boolean
  onClick: () => void
  label: string
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`font-sans text-xs uppercase tracking-widest px-4 py-2 border transition-colors ${
        activa
          ? 'bg-verde text-white border-verde'
          : 'bg-white text-gris-600 border-gris-200 hover:border-gris-400'
      }`}
      style={activa && color ? { backgroundColor: color, borderColor: color } : undefined}
    >
      {label}
    </button>
  )
}

function FilaVideo({
  video,
  indice,
  maxViews,
}: {
  video: PanelVideo
  indice: number
  maxViews: number
}) {
  const [sinPortada, setSinPortada] = useState(false)
  const red = REDES.find((r) => r.key === video.platform)
  const pct = maxViews > 0 ? (video.views / maxViews) * 100 : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 px-4 py-3 border-b border-gris-200 last:border-b-0 items-center hover:bg-gris-100/50 transition-colors">
      {/* Posición */}
      <div className="hidden lg:block col-span-1">
        <span className="font-heading font-900 text-xl text-gris-300">{indice + 1}</span>
      </div>

      {/* Miniatura + título */}
      <div className="col-span-5 flex items-center gap-3 min-w-0">
        <div
          className="w-11 h-16 shrink-0 bg-gris-100 border border-gris-200 overflow-hidden flex items-center justify-center"
          style={{ borderColor: red?.color ? `${red.color}33` : undefined }}
        >
          {video.thumbnail_url && !sinPortada ? (
            // Portada servida por el CDN de la red; si el enlace caduca se
            // reemplaza por el ícono de la plataforma.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.thumbnail_url}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setSinPortada(true)}
            />
          ) : (
            red && (
              <svg className="w-4 h-4 opacity-30" fill={red.color} viewBox="0 0 24 24" aria-hidden>
                <path d={red.icono} />
              </svg>
            )
          )}
        </div>

        <div className="min-w-0">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-sm font-600 text-tinta hover:text-verde hover:underline line-clamp-2 leading-snug"
          >
            {video.title || 'Sin título'}
          </a>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {red && (
              <span
                className="font-sans text-[10px] uppercase tracking-widest font-700"
                style={{ color: red.color }}
              >
                {red.nombre}
              </span>
            )}
            <span className="font-sans text-xs text-gris-400">{fecha(video.published_at)}</span>
            {video.on_site && (
              <span className="font-sans text-[10px] uppercase tracking-wider bg-verde-claro text-verde px-1.5 py-0.5">
                En la web
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Vistas */}
      <div className="col-span-3">
        <div className="flex items-baseline gap-2">
          <span className="font-heading font-900 text-lg text-tinta">{num(video.views)}</span>
          <span className="font-sans text-xs text-gris-400">vistas</span>
          {video.views_delta !== null && video.views_delta > 0 && (
            <span className="font-sans text-xs text-green-600 font-600">
              +{num(video.views_delta)} hoy
            </span>
          )}
        </div>
        <div className="h-1.5 bg-gris-100 mt-1.5 w-full">
          <div
            className="h-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: red?.color ?? '#013262' }}
          />
        </div>
      </div>

      {/* Interacciones */}
      <div className="col-span-3 flex gap-4 font-sans text-sm text-gris-600">
        <span title="Me gusta">♥ {num(video.likes)}</span>
        <span title="Comentarios">💬 {num(video.comments)}</span>
        <span title="Compartidos">↗ {num(video.shares)}</span>
      </div>
    </div>
  )
}
