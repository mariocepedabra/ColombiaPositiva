'use client'

import { useState, useMemo } from 'react'
import type { PanelVideo, DailyPoint } from '@/lib/social/panel'
import { num, fechaCorta, diaCorto } from '@/lib/social/formato'

// Gráficas del panel de métricas. Todas en SVG propio: el sitio no carga
// ninguna librería de gráficos, así que no se agrega peso a producción.

export const COLOR_RED: Record<string, string> = {
  tiktok: '#111111',
  instagram: '#c13584',
  facebook: '#1877f2',
}

const AZUL = '#013262'
const VERDE = '#31c303'

export type Metrica = 'views' | 'likes' | 'comments' | 'shares'

export const METRICAS: { key: Metrica; label: string; corto: string }[] = [
  { key: 'views', label: 'Vistas', corto: 'vistas' },
  { key: 'likes', label: 'Me gusta', corto: 'me gusta' },
  { key: 'comments', label: 'Comentarios', corto: 'comentarios' },
  { key: 'shares', label: 'Compartidos', corto: 'compartidos' },
]


/** Escala redondeada hacia arriba para que el eje termine en un número legible. */
function techo(max: number): number {
  if (max <= 5) return 5
  const magnitud = Math.pow(10, Math.floor(Math.log10(max)))
  return Math.ceil(max / (magnitud / 2)) * (magnitud / 2)
}

// ─────────────────────────────────────────────────────────────────
// Contenedor común
// ─────────────────────────────────────────────────────────────────

function Panel({
  titulo,
  descripcion,
  children,
  extra,
}: {
  titulo: string
  descripcion: string
  children: React.ReactNode
  extra?: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gris-200 p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="font-heading font-700 text-base text-tinta">{titulo}</h3>
          <p className="font-sans text-xs text-gris-400 mt-0.5">{descripcion}</p>
        </div>
        {extra}
      </div>
      {children}
    </div>
  )
}

function SelectorMetrica({
  valor,
  onChange,
}: {
  valor: Metrica
  onChange: (m: Metrica) => void
}) {
  return (
    <div className="flex flex-wrap gap-1 shrink-0">
      {METRICAS.map((m) => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          className={`font-sans text-[11px] uppercase tracking-wider px-2.5 py-1.5 border transition-colors ${
            valor === m.key
              ? 'bg-[#013262] text-white border-[#013262]'
              : 'bg-white text-gris-600 border-gris-200 hover:border-gris-400'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// 1. Comparativo entre videos
// ─────────────────────────────────────────────────────────────────

export function ComparativoVideos({
  videos,
  onSelect,
}: {
  videos: PanelVideo[]
  onSelect: (v: PanelVideo) => void
}) {
  const [metrica, setMetrica] = useState<Metrica>('views')
  const [cuantos, setCuantos] = useState(12)

  const orden = useMemo(
    () => [...videos].sort((a, b) => b[metrica] - a[metrica]).slice(0, cuantos),
    [videos, metrica, cuantos]
  )
  const max = Math.max(...orden.map((v) => v[metrica]), 1)
  const etiqueta = METRICAS.find((m) => m.key === metrica)!.corto

  if (videos.length === 0) return null

  return (
    <Panel
      titulo="Comparativo entre videos"
      descripcion={`Los ${orden.length} videos con más ${etiqueta}. Haz clic en uno para ver su ficha.`}
      extra={<SelectorMetrica valor={metrica} onChange={setMetrica} />}
    >
      <div className="space-y-2">
        {orden.map((v, i) => {
          const pct = (v[metrica] / max) * 100
          const color = COLOR_RED[v.platform] ?? AZUL
          return (
            <button
              key={`${v.platform}:${v.external_id}`}
              onClick={() => onSelect(v)}
              className="w-full text-left group"
            >
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className="font-sans text-xs text-gris-600 truncate group-hover:text-tinta">
                  <span className="text-gris-300 font-700 mr-1.5">{i + 1}</span>
                  {v.title || 'Sin título'}
                </span>
                <span className="font-sans text-xs font-700 text-tinta shrink-0 tabular-nums">
                  {num(v[metrica])}
                </span>
              </div>
              <div className="h-3 bg-gris-100 w-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 group-hover:opacity-80"
                  style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: color }}
                />
              </div>
            </button>
          )
        })}
      </div>

      {videos.length > cuantos && (
        <button
          onClick={() => setCuantos((n) => n + 12)}
          className="mt-4 font-sans text-xs uppercase tracking-widest text-gris-600 border border-gris-200 px-4 py-2 hover:border-gris-400 transition-colors"
        >
          Ver más ({videos.length - cuantos} restantes)
        </button>
      )}
    </Panel>
  )
}

// ─────────────────────────────────────────────────────────────────
// 2. Evolución diaria
// ─────────────────────────────────────────────────────────────────

export function EvolucionDiaria({ daily }: { daily: DailyPoint[] }) {
  const [metrica, setMetrica] = useState<Metrica>('views')
  const [activo, setActivo] = useState<number | null>(null)

  const puntos = daily
  const etiqueta = METRICAS.find((m) => m.key === metrica)!.corto

  if (puntos.length === 0) {
    return (
      <Panel titulo="Evolución diaria" descripcion="Acumulado de toda la cuenta, día a día">
        <p className="font-sans text-sm text-gris-400 italic py-8 text-center">
          Todavía no hay historial. Se registra una foto por día tras cada sincronización.
        </p>
      </Panel>
    )
  }

  const W = 720
  const H = 220
  const P = { top: 16, right: 16, bottom: 28, left: 56 }
  const innerW = W - P.left - P.right
  const innerH = H - P.top - P.bottom

  const valores = puntos.map((p) => p[metrica])
  const maxY = techo(Math.max(...valores, 1))
  const x = (i: number) =>
    P.left + (puntos.length === 1 ? innerW / 2 : (i / (puntos.length - 1)) * innerW)
  const y = (v: number) => P.top + innerH - (v / maxY) * innerH

  const linea = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p[metrica])}`).join(' ')
  const area =
    puntos.length > 1
      ? `${linea} L ${x(puntos.length - 1)} ${P.top + innerH} L ${x(0)} ${P.top + innerH} Z`
      : ''

  // Crecimiento del último día frente al anterior
  const crecimiento =
    puntos.length > 1
      ? puntos[puntos.length - 1][metrica] - puntos[puntos.length - 2][metrica]
      : null

  return (
    <Panel
      titulo="Evolución diaria"
      descripcion={
        puntos.length === 1
          ? 'Hoy hay una sola medición: la curva se irá dibujando con los días.'
          : `Acumulado de ${etiqueta} de toda la cuenta, día a día`
      }
      extra={<SelectorMetrica valor={metrica} onChange={setMetrica} />}
    >
      {crecimiento !== null && (
        <p className="font-sans text-sm text-gris-600 mb-3">
          Último día:{' '}
          <span className={crecimiento > 0 ? 'text-green-600 font-700' : 'text-gris-400 font-600'}>
            {crecimiento > 0 ? '+' : ''}
            {num(crecimiento)} {etiqueta}
          </span>
        </p>
      )}

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px]" role="img">
          {/* Rejilla y eje Y */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const vy = P.top + innerH - f * innerH
            return (
              <g key={f}>
                <line x1={P.left} y1={vy} x2={W - P.right} y2={vy} stroke="#e8e8e4" strokeWidth={1} />
                <text
                  x={P.left - 8}
                  y={vy + 4}
                  textAnchor="end"
                  className="fill-gris-400"
                  style={{ fontSize: 11 }}
                >
                  {num(Math.round(maxY * f))}
                </text>
              </g>
            )
          })}

          {area && <path d={area} fill={AZUL} opacity={0.08} />}
          <path d={linea} fill="none" stroke={AZUL} strokeWidth={2.5} strokeLinejoin="round" />

          {puntos.map((p, i) => (
            <g key={p.day}>
              <circle
                cx={x(i)}
                cy={y(p[metrica])}
                r={activo === i ? 6 : 4}
                fill="#fff"
                stroke={activo === i ? VERDE : AZUL}
                strokeWidth={2.5}
              />
              {/* Zona de captura del cursor, más ancha que el punto */}
              <rect
                x={x(i) - 18}
                y={P.top}
                width={36}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setActivo(i)}
                onMouseLeave={() => setActivo(null)}
              />
              {i % Math.ceil(puntos.length / 8) === 0 && (
                <text
                  x={x(i)}
                  y={H - 8}
                  textAnchor="middle"
                  className="fill-gris-400"
                  style={{ fontSize: 11 }}
                >
                  {diaCorto(p.day)}
                </text>
              )}
            </g>
          ))}

          {activo !== null && (
            <g>
              <line
                x1={x(activo)}
                y1={P.top}
                x2={x(activo)}
                y2={P.top + innerH}
                stroke={VERDE}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <text
                x={Math.min(Math.max(x(activo), P.left + 40), W - P.right - 40)}
                y={P.top + 12}
                textAnchor="middle"
                className="fill-tinta"
                style={{ fontSize: 12, fontWeight: 700 }}
              >
                {num(puntos[activo][metrica])} {etiqueta}
              </text>
            </g>
          )}
        </svg>
      </div>
    </Panel>
  )
}

// ─────────────────────────────────────────────────────────────────
// 3. Rendimiento por fecha de publicación
// ─────────────────────────────────────────────────────────────────

export function RendimientoPorFecha({
  videos,
  onSelect,
}: {
  videos: PanelVideo[]
  onSelect: (v: PanelVideo) => void
}) {
  const [activo, setActivo] = useState<string | null>(null)

  const conFecha = useMemo(
    () =>
      videos
        .filter((v) => v.published_at)
        .map((v) => ({ ...v, t: new Date(v.published_at as string).getTime() }))
        .sort((a, b) => a.t - b.t),
    [videos]
  )

  if (conFecha.length < 2) return null

  const W = 720
  const H = 240
  const P = { top: 16, right: 16, bottom: 30, left: 56 }
  const innerW = W - P.left - P.right
  const innerH = H - P.top - P.bottom

  const minT = conFecha[0].t
  const maxT = conFecha[conFecha.length - 1].t
  const rango = Math.max(maxT - minT, 1)
  const maxY = techo(Math.max(...conFecha.map((v) => v.views), 1))
  const promedio = conFecha.reduce((s, v) => s + v.views, 0) / conFecha.length

  const x = (t: number) => P.left + ((t - minT) / rango) * innerW
  const y = (v: number) => P.top + innerH - (v / maxY) * innerH

  const seleccionado = conFecha.find((v) => `${v.platform}:${v.external_id}` === activo)

  return (
    <Panel
      titulo="Rendimiento por fecha de publicación"
      descripcion="Cada punto es un video. Sirve para ver si hay épocas que rinden mejor."
    >
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px]" role="img">
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const vy = P.top + innerH - f * innerH
            return (
              <g key={f}>
                <line x1={P.left} y1={vy} x2={W - P.right} y2={vy} stroke="#e8e8e4" strokeWidth={1} />
                <text
                  x={P.left - 8}
                  y={vy + 4}
                  textAnchor="end"
                  className="fill-gris-400"
                  style={{ fontSize: 11 }}
                >
                  {num(Math.round(maxY * f))}
                </text>
              </g>
            )
          })}

          {/* Promedio de la cuenta */}
          <line
            x1={P.left}
            y1={y(promedio)}
            x2={W - P.right}
            y2={y(promedio)}
            stroke={VERDE}
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
          <text
            x={W - P.right}
            y={y(promedio) - 6}
            textAnchor="end"
            style={{ fontSize: 11, fontWeight: 600 }}
            fill={VERDE}
          >
            promedio {num(Math.round(promedio))}
          </text>

          {conFecha.map((v) => {
            const clave = `${v.platform}:${v.external_id}`
            const esActivo = activo === clave
            return (
              <circle
                key={clave}
                cx={x(v.t)}
                cy={y(v.views)}
                r={esActivo ? 8 : 5}
                fill={COLOR_RED[v.platform] ?? AZUL}
                opacity={esActivo ? 1 : 0.72}
                stroke="#fff"
                strokeWidth={1.5}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setActivo(clave)}
                onMouseLeave={() => setActivo(null)}
                onClick={() => onSelect(v)}
              />
            )
          })}

          {/* Eje X: primera y última fecha */}
          <text x={P.left} y={H - 8} className="fill-gris-400" style={{ fontSize: 11 }}>
            {fechaCorta(conFecha[0].published_at)}
          </text>
          <text
            x={W - P.right}
            y={H - 8}
            textAnchor="end"
            className="fill-gris-400"
            style={{ fontSize: 11 }}
          >
            {fechaCorta(conFecha[conFecha.length - 1].published_at)}
          </text>
        </svg>
      </div>

      <p className="font-sans text-xs text-gris-600 mt-2 h-4">
        {seleccionado ? (
          <>
            <strong className="text-tinta">{seleccionado.title || 'Sin título'}</strong> ·{' '}
            {num(seleccionado.views)} vistas · {fechaCorta(seleccionado.published_at)}
          </>
        ) : (
          'Pasa el cursor sobre un punto para ver el video; haz clic para abrir su ficha.'
        )}
      </p>
    </Panel>
  )
}

// ─────────────────────────────────────────────────────────────────
// 4. Ficha individual
// ─────────────────────────────────────────────────────────────────

export function FichaVideo({
  video,
  historia,
  promedioCuenta,
  onClose,
}: {
  video: PanelVideo
  historia: { day: string; views: number }[]
  promedioCuenta: number
  onClose: () => void
}) {
  const color = COLOR_RED[video.platform] ?? AZUL
  const interacciones = video.likes + video.comments + video.shares
  const tasa = video.views > 0 ? (interacciones / video.views) * 100 : 0
  const vsPromedio = promedioCuenta > 0 ? ((video.views - promedioCuenta) / promedioCuenta) * 100 : 0

  // Mini-serie de la evolución propia del video
  const W = 520
  const H = 120
  const P = 10
  const maxV = Math.max(...historia.map((h) => h.views), 1)
  const px = (i: number) =>
    P + (historia.length === 1 ? (W - 2 * P) / 2 : (i / (historia.length - 1)) * (W - 2 * P))
  const py = (v: number) => H - P - (v / maxV) * (H - 2 * P)
  const linea = historia.map((h, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(h.views)}`).join(' ')

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gris-200 w-full max-w-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-gris-200">
          <div className="min-w-0">
            <span
              className="font-sans text-[10px] uppercase tracking-widest font-700"
              style={{ color }}
            >
              {video.platform}
            </span>
            <h3 className="font-heading font-700 text-lg text-tinta leading-tight mt-0.5">
              {video.title || 'Sin título'}
            </h3>
            <p className="font-sans text-xs text-gris-400 mt-1">
              Publicado el {fechaCorta(video.published_at)}
              {video.on_site && <span className="text-verde"> · Publicado en la web</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="font-sans text-2xl leading-none text-gris-400 hover:text-tinta shrink-0"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Cifras */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-gris-200">
          {[
            { l: 'Vistas', v: video.views },
            { l: 'Me gusta', v: video.likes },
            { l: 'Comentarios', v: video.comments },
            { l: 'Compartidos', v: video.shares },
          ].map((c) => (
            <div key={c.l} className="p-4 border-r last:border-r-0 border-gris-200">
              <p className="font-sans text-[10px] uppercase tracking-widest text-gris-400 mb-1">
                {c.l}
              </p>
              <p className="font-heading font-900 text-2xl text-tinta">{num(c.v)}</p>
            </div>
          ))}
        </div>

        {/* Comparación con la cuenta */}
        <div className="p-5 border-b border-gris-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-widest text-gris-400 mb-1">
              Frente al promedio de la cuenta
            </p>
            <p
              className={`font-heading font-900 text-2xl ${
                vsPromedio >= 0 ? 'text-green-600' : 'text-amber-600'
              }`}
            >
              {vsPromedio >= 0 ? '+' : ''}
              {vsPromedio.toFixed(0)}%
            </p>
            <p className="font-sans text-xs text-gris-400">
              promedio: {num(Math.round(promedioCuenta))} vistas
            </p>
          </div>
          <div>
            <p className="font-sans text-[10px] uppercase tracking-widest text-gris-400 mb-1">
              Tasa de interacción
            </p>
            <p className="font-heading font-900 text-2xl text-tinta">{tasa.toFixed(1)}%</p>
            <p className="font-sans text-xs text-gris-400">
              {num(interacciones)} interacciones sobre {num(video.views)} vistas
            </p>
          </div>
        </div>

        {/* Evolución propia */}
        <div className="p-5">
          <p className="font-sans text-[10px] uppercase tracking-widest text-gris-400 mb-2">
            Evolución de sus vistas
          </p>
          {historia.length > 1 ? (
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
              <path
                d={`${linea} L ${px(historia.length - 1)} ${H - P} L ${px(0)} ${H - P} Z`}
                fill={color}
                opacity={0.1}
              />
              <path d={linea} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
              {historia.map((h, i) => (
                <circle key={h.day} cx={px(i)} cy={py(h.views)} r={3} fill="#fff" stroke={color} strokeWidth={2}>
                  <title>
                    {h.day}: {num(h.views)} vistas
                  </title>
                </circle>
              ))}
            </svg>
          ) : (
            <p className="font-sans text-sm text-gris-400 italic">
              Aún no hay suficientes mediciones. La curva aparece cuando haya al menos dos días.
            </p>
          )}
        </div>

        <div className="p-5 pt-0">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-sans text-xs uppercase tracking-widest text-white px-5 py-2.5 transition-opacity hover:opacity-85"
            style={{ backgroundColor: color }}
          >
            Ver el video ↗
          </a>
        </div>
      </div>
    </div>
  )
}
