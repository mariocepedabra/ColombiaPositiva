'use client'

import { useState } from 'react'
import type { Video, VideoSectionKey } from '@/lib/videos'
import { platformLabel, detectPlatform, effectivePlatform, videoSectionKey } from '@/lib/videos'
import type { VideoVisibility } from '@/lib/video-visibility'
import { saveVideoVisibility } from '@/app/admin/videos-actions'

type Tab = VideoSectionKey

const TAB_CONFIG: { id: Tab; label: string; placeholder: string; hint: string }[] = [
  {
    id: 'instagram',
    label: '📸 Instagram',
    placeholder: 'https://www.instagram.com/reel/ABC123...',
    hint: 'Pega el link de un reel o video de Instagram (instagram.com/reel/... o /p/...)',
  },
  {
    id: 'facebook',
    label: '📘 Facebook',
    placeholder: 'https://www.facebook.com/watch?v=... o /reel/...',
    hint: 'Pega el link de un video o reel de Facebook (facebook.com o fb.watch)',
  },
  {
    id: 'tiktok',
    label: '🎵 TikTok',
    placeholder: 'https://www.tiktok.com/@usuario/video/123456...',
    hint: 'Pega el link de un video de TikTok (tiktok.com)',
  },
]

const PLATFORM_COLORS: Record<Video['platform'], string> = {
  instagram: 'bg-purple-100 text-purple-700',
  facebook:  'bg-blue-100 text-blue-700',
  tiktok:    'bg-pink-100 text-pink-700',
  youtube:   'bg-red-100 text-red-700',
  direct:    'bg-gris-100 text-gris-600',
}

const GROUPS: { key: Tab; name: string }[] = [
  { key: 'instagram', name: 'Instagram' },
  { key: 'facebook',  name: 'Facebook' },
  { key: 'tiktok',    name: 'TikTok' },
]

export default function VideoManager({
  initialVideos,
  initialVisibility,
}: {
  initialVideos: Video[]
  initialVisibility: VideoVisibility
}) {
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  const [tab, setTab]       = useState<Tab>('instagram')
  const [url, setUrl]       = useState('')
  const [title, setTitle]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [visibility, setVisibility] = useState<VideoVisibility>(initialVisibility)
  const [savingPlatform, setSavingPlatform] = useState<VideoSectionKey | null>(null)

  function flash(msg: string, isError = false) {
    if (isError) { setError(msg); setTimeout(() => setError(''), 4000) }
    else { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }
  }

  // ── Agregar por URL ──────────────────────────────────────────────
  async function handleAddUrl(e: React.FormEvent) {
    e.preventDefault()
    const cleanUrl = url.trim()
    if (!cleanUrl) return

    // El link debe corresponder a la red social de la pestaña activa
    if (detectPlatform(cleanUrl) !== tab) {
      flash(`Ese link no parece ser de ${platformLabel(tab)}. Revisa la URL o cambia de pestaña.`, true)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl, title: title.trim(), platform: tab }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setVideos((prev) => [data.video, ...prev])
      setUrl(''); setTitle('')
      flash('Video agregado correctamente ✓')
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Error al agregar', true)
    } finally { setLoading(false) }
  }

  // ── Eliminar ─────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este video del carrusel? Esta acción no se puede deshacer.')) return
    try {
      const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setVideos((prev) => prev.filter((v) => v.id !== id))
      flash('Video eliminado')
    } catch { flash('Error al eliminar', true) }
  }

  // ── Toggle activo ────────────────────────────────────────────────
  async function handleToggle(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current }),
      })
      if (!res.ok) throw new Error()
      setVideos((prev) => prev.map((v) => v.id === id ? { ...v, is_active: !current } : v))
    } catch { flash('Error al actualizar', true) }
  }

  // ── Mostrar/ocultar una red social en la portada ─────────────────
  async function toggleVisibility(key: VideoSectionKey) {
    const prev = visibility
    const next = { ...visibility, [key]: !visibility[key] }
    setVisibility(next)            // optimista
    setSavingPlatform(key)
    const res = await saveVideoVisibility(next)
    setSavingPlatform(null)
    if (res.error) {
      setVisibility(prev)          // revertir si falla
      flash(res.error || 'No se pudo actualizar la visibilidad', true)
    } else {
      const name = GROUPS.find((g) => g.key === key)?.name ?? ''
      flash(next[key] ? `${name} se mostrará en la portada` : `${name} se ocultará de la portada`)
    }
  }

  // Agrupar por división (la URL es la fuente de verdad)
  const grouped: Record<Tab, Video[]> = { instagram: [], facebook: [], tiktok: [] }
  const otros: Video[] = []
  for (const video of videos) {
    const key = videoSectionKey(video)
    if (key) grouped[key].push(video)
    else otros.push(video)
  }

  const activeCount = videos.filter((v) => v.is_active && videoSectionKey(v)).length
  const cfg = TAB_CONFIG.find((t) => t.id === tab)!

  function renderRow(video: Video) {
    const platform = effectivePlatform(video)
    return (
      <div
        key={video.id}
        className="grid grid-cols-1 md:grid-cols-12 gap-3 px-4 py-4 border-b border-gris-100 last:border-0 items-center"
      >
        {/* Título / URL */}
        <div className="md:col-span-6">
          <p className="font-sans text-sm font-600 text-tinta line-clamp-1">
            {video.title || <span className="italic text-gris-400">(sin título)</span>}
          </p>
          <p className="font-sans text-xs text-gris-400 truncate mt-0.5">{video.url}</p>
          <p className="font-sans text-xs text-gris-400 mt-0.5">
            {new Date(video.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>

        {/* Plataforma */}
        <div className="md:col-span-2">
          <span className={`font-sans text-xs font-700 px-2 py-1 rounded ${PLATFORM_COLORS[platform]}`}>
            {platformLabel(platform)}
          </span>
        </div>

        {/* Toggle activo */}
        <div className="md:col-span-2">
          <button
            onClick={() => handleToggle(video.id, video.is_active)}
            className={`flex items-center gap-2 font-sans text-xs font-700 px-3 py-1.5 border transition-colors ${
              video.is_active
                ? 'bg-verde text-white border-verde hover:bg-verde-oscuro'
                : 'border-gris-300 text-gris-400 hover:border-verde hover:text-verde'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${video.is_active ? 'bg-white' : 'bg-gris-300'}`} />
            {video.is_active ? 'Activo' : 'Inactivo'}
          </button>
        </div>

        {/* Eliminar */}
        <div className="md:col-span-2">
          <button
            onClick={() => handleDelete(video.id)}
            className="font-sans text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 transition-colors"
          >
            🗑 Eliminar
          </button>
        </div>
      </div>
    )
  }

  function renderGroup(name: string, list: Video[], opts?: { note?: string; platformKey?: VideoSectionKey }) {
    const key = opts?.platformKey
    const on = key ? visibility[key] : true
    const saving = key ? savingPlatform === key : false
    return (
      <div className="bg-white border border-gris-200 mb-6">
        <div className="px-4 py-3 border-b border-gris-200 bg-gris-100 flex items-center justify-between gap-3">
          <h3 className="font-sans font-700 text-xs uppercase tracking-widest text-gris-600">
            {name} · {list.length} video{list.length !== 1 ? 's' : ''}
          </h3>
          {key ? (
            <div className="flex items-center gap-2.5">
              <span className={`font-sans text-xs font-700 ${on ? 'text-verde' : 'text-gris-400'}`}>
                {on ? 'Visible en portada' : 'Oculta en portada'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`${on ? 'Ocultar' : 'Mostrar'} ${name} en la portada`}
                disabled={saving}
                onClick={() => toggleVisibility(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  on ? 'bg-verde' : 'bg-gris-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                    on ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ) : opts?.note ? (
            <span className="font-sans text-xs text-gris-400 hidden sm:block">{opts.note}</span>
          ) : null}
        </div>
        {list.length === 0 ? (
          <div className="p-6 text-center">
            <p className="font-heading italic text-gris-400 text-sm">
              Aún no hay videos de {name}. Agrega el primero desde la pestaña de arriba.
            </p>
          </div>
        ) : (
          list.map(renderRow)
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Cabecera */}
      <div className="mb-6">
        <h1 className="font-heading font-700 text-2xl text-tinta">Videos — Historias de Colombia Positiva</h1>
        <p className="font-sans text-sm text-gris-600 mt-0.5">
          {activeCount} video{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''} en la portada · {videos.length} total ·
          divisiones: Instagram, Facebook y TikTok
        </p>
      </div>

      {/* Alertas */}
      {error   && <div className="bg-red-50 border border-red-200 text-red-700 font-sans text-sm px-4 py-3 mb-4">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 font-sans text-sm px-4 py-3 mb-4">{success}</div>}

      {/* ── Formulario ── */}
      <div className="bg-white border border-gris-200 p-6 mb-8">
        <h2 className="font-sans font-700 text-xs uppercase tracking-widest text-gris-600 mb-4">
          Agregar nuevo video
        </h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 border-b border-gris-200 pb-0">
          {TAB_CONFIG.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setUrl(''); setTitle('') }}
              className={`font-sans text-xs font-700 px-4 py-2 border-b-2 transition-colors -mb-px ${
                tab === t.id
                  ? 'border-verde text-verde'
                  : 'border-transparent text-gris-400 hover:text-tinta'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleAddUrl} className="space-y-4">
          <div>
            <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">
              Link del video *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={cfg.placeholder}
              required
              className="w-full border border-gris-300 bg-white px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde"
            />
            <p className="font-sans text-xs text-gris-400 mt-1.5">{cfg.hint}</p>
          </div>
          <div>
            <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">
              Título <span className="font-400 normal-case tracking-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Escribe un título descriptivo..."
              className="w-full border border-gris-300 bg-white px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs px-8 py-3 tracking-widest uppercase transition-colors disabled:opacity-60"
          >
            {loading ? 'Agregando...' : '+ Agregar video'}
          </button>
        </form>
      </div>

      {/* ── Listas por división ── */}
      {GROUPS.map((g) => (
        <div key={g.key}>{renderGroup(g.name, grouped[g.key], { platformKey: g.key })}</div>
      ))}

      {/* Videos legados (YouTube / archivos subidos) que ya no aparecen en la portada */}
      {otros.length > 0 &&
        renderGroup('Otros videos', otros, { note: 'YouTube y archivos — ya no se muestran en la portada' })}
    </div>
  )
}
