'use client'

import { useState, useRef } from 'react'
import type { Video } from '@/lib/videos'
import { platformLabel } from '@/lib/videos'

type Tab = 'tiktok' | 'youtube' | 'upload'

const TAB_CONFIG: { id: Tab; label: string; placeholder: string }[] = [
  { id: 'tiktok',  label: '🎵 TikTok',        placeholder: 'https://www.tiktok.com/@usuario/video/123456...' },
  { id: 'youtube', label: '▶️ YouTube',        placeholder: 'https://www.youtube.com/watch?v=... o youtu.be/...' },
  { id: 'upload',  label: '📁 Subir archivo',  placeholder: '' },
]

const PLATFORM_COLORS: Record<Video['platform'], string> = {
  tiktok:  'bg-pink-100 text-pink-700',
  youtube: 'bg-red-100 text-red-700',
  direct:  'bg-blue-100 text-blue-700',
}

export default function VideoManager({ initialVideos }: { initialVideos: Video[] }) {
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  const [tab, setTab]       = useState<Tab>('tiktok')
  const [url, setUrl]       = useState('')
  const [title, setTitle]   = useState('')
  const [file, setFile]     = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function flash(msg: string, isError = false) {
    if (isError) { setError(msg); setTimeout(() => setError(''), 4000) }
    else { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }
  }

  // ── Agregar por URL ──────────────────────────────────────────────
  async function handleAddUrl(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), title: title.trim(), platform: tab }),
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

  // ── Subir archivo ────────────────────────────────────────────────
  async function uploadFile(f: File) {
    if (f.size > 500 * 1024 * 1024) { flash('El archivo no puede superar 500 MB', true); return }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', f)
      formData.append('title', title.trim())
      const res = await fetch('/api/videos/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setVideos((prev) => [data.video, ...prev])
      setFile(null); setTitle('')
      flash('Video subido correctamente ✓')
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Error al subir', true)
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

  const activeCount = videos.filter((v) => v.is_active).length
  const cfg = TAB_CONFIG.find((t) => t.id === tab)!

  return (
    <div>
      {/* Cabecera */}
      <div className="mb-6">
        <h1 className="font-heading font-700 text-2xl text-tinta">Videos — Historias de Colombia Positiva</h1>
        <p className="font-sans text-sm text-gris-600 mt-0.5">
          {activeCount} video{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''} en el carrusel · {videos.length} total
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
              onClick={() => { setTab(t.id); setUrl(''); setTitle(''); setFile(null) }}
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

        {/* Form TikTok / YouTube */}
        {tab !== 'upload' && (
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
        )}

        {/* Form Subir archivo */}
        {tab === 'upload' && (
          <div className="space-y-4">
            <div>
              <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-2">
                Archivo de video * <span className="font-400 normal-case tracking-normal text-gris-400">(MP4, MOV, WEBM · máx 500 MB)</span>
              </label>
              {file ? (
                <div className="border border-gris-200 px-4 py-3 flex items-center justify-between bg-gris-100">
                  <span className="font-sans text-sm text-tinta truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="font-sans text-xs text-red-600 hover:underline ml-4 flex-shrink-0"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed cursor-pointer p-8 text-center transition-colors ${
                    dragOver ? 'border-verde bg-verde-claro/20' : 'border-gris-300 hover:border-verde'
                  }`}
                >
                  <p className="font-sans text-sm text-gris-600 mb-1">
                    Arrastra el video aquí o{' '}
                    <span className="text-verde underline">haz clic para seleccionar</span>
                  </p>
                  <p className="font-sans text-xs text-gris-400">MP4, MOV, WEBM · máx 500 MB</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = '' }}
                className="hidden"
              />
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
              type="button"
              disabled={loading || !file}
              onClick={() => file && uploadFile(file)}
              className="bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs px-8 py-3 tracking-widest uppercase transition-colors disabled:opacity-60"
            >
              {loading ? 'Subiendo...' : '↑ Subir video'}
            </button>
          </div>
        )}
      </div>

      {/* ── Lista de videos ── */}
      <div className="bg-white border border-gris-200">
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-gris-200 bg-gris-100">
          <div className="col-span-6 font-sans text-xs uppercase tracking-widest text-gris-400">Título / URL</div>
          <div className="col-span-2 font-sans text-xs uppercase tracking-widest text-gris-400">Plataforma</div>
          <div className="col-span-2 font-sans text-xs uppercase tracking-widest text-gris-400">Estado</div>
          <div className="col-span-2 font-sans text-xs uppercase tracking-widest text-gris-400">Acciones</div>
        </div>

        {videos.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-heading italic text-gris-400 text-lg">Aún no hay videos. ¡Agrega el primero!</p>
          </div>
        ) : (
          videos.map((video) => (
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
                <span className={`font-sans text-xs font-700 px-2 py-1 rounded ${PLATFORM_COLORS[video.platform]}`}>
                  {platformLabel(video.platform)}
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
          ))
        )}
      </div>
    </div>
  )
}
