'use client'

import { useState } from 'react'

const REGIONES = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
  'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba',
  'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
  'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
  'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
  'Vaupés', 'Vichada', 'Bogotá D.C.'
]

type MediaMode = 'none' | 'image' | 'video'

export default function NotaPositivaForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [region, setRegion] = useState('')
  const [mediaMode, setMediaMode] = useState<MediaMode>('none')
  const [mediaUrl, setMediaUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSending(true)

    try {
      const res = await fetch('/api/nota-positiva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email || undefined,
          title,
          description,
          region: region || undefined,
          mediaUrl: mediaUrl || undefined,
          mediaType: mediaMode !== 'none' ? mediaMode : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar')

      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar. Intenta de nuevo.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-6">🌿</div>
        <h3 className="font-heading font-700 text-2xl text-verde mb-3">
          ¡Gracias, {name.split(' ')[0]}!
        </h3>
        <p className="font-sans text-gris-600 text-base leading-relaxed max-w-md mx-auto">
          Tu historia ha sido recibida. El equipo de Colombia Positiva la revisará
          y si es publicada, te contactaremos.
        </p>
        <button
          onClick={() => {
            setSent(false)
            setName(''); setEmail(''); setTitle(''); setDescription('')
            setRegion(''); setMediaMode('none'); setMediaUrl('')
          }}
          className="mt-8 font-sans text-xs text-verde hover:underline"
        >
          Enviar otra historia →
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 font-sans text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Nombre */}
        <div>
          <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">
            Tu nombre *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gris-300 bg-white px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde"
            placeholder="Juan García"
          />
        </div>

        {/* Email (opcional) */}
        <div>
          <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">
            Tu correo <span className="font-400 normal-case tracking-normal">(opcional)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gris-300 bg-white px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde"
            placeholder="tu@correo.com"
          />
        </div>
      </div>

      {/* Región */}
      <div>
        <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">
          Región de Colombia <span className="font-400 normal-case tracking-normal">(opcional)</span>
        </label>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full border border-gris-300 bg-white px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde"
        >
          <option value="">Selecciona un departamento...</option>
          {REGIONES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Titular */}
      <div>
        <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">
          Titular de tu historia *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border border-gris-300 bg-white px-3 py-2.5 text-base font-heading focus:outline-none focus:border-verde"
          placeholder="¿Cuál es la buena noticia?"
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">
          Cuéntanos la historia *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={6}
          className="w-full border border-gris-300 bg-white px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde resize-y"
          placeholder="Comparte todos los detalles de esta buena noticia. ¿Qué pasó? ¿A quién involucra? ¿Por qué es importante para Colombia?"
        />
      </div>

      {/* Multimedia */}
      <div>
        <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-2">
          Adjuntar imagen o video <span className="font-400 normal-case tracking-normal">(opcional)</span>
        </label>
        <div className="flex gap-2 mb-3">
          {(['none', 'image', 'video'] as MediaMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMediaMode(m); setMediaUrl('') }}
              className={`font-sans text-xs px-3 py-1.5 border transition-colors ${
                mediaMode === m
                  ? 'bg-verde text-white border-verde'
                  : 'border-gris-300 text-gris-600 hover:border-verde'
              }`}
            >
              {m === 'none' ? 'Sin adjunto' : m === 'image' ? '🖼️ Imagen' : '🎥 Video'}
            </button>
          ))}
        </div>

        {mediaMode !== 'none' && (
          <input
            type="url"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            className="w-full border border-gris-300 bg-white px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde"
            placeholder={
              mediaMode === 'image'
                ? 'https://enlace-a-tu-imagen.com/foto.jpg'
                : 'https://youtube.com/watch?v=... o https://instagram.com/...'
            }
          />
        )}
      </div>

      {/* Botón */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={sending}
          className="w-full md:w-auto bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs px-10 py-3.5 tracking-widest uppercase transition-colors disabled:opacity-60"
        >
          {sending ? 'Enviando...' : '✦ Enviar mi nota positiva'}
        </button>
        <p className="font-sans text-xs text-gris-400 mt-3">
          Tu historia será revisada por el equipo editorial antes de ser publicada.
        </p>
      </div>
    </form>
  )
}
