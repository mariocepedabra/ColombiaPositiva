'use client'

import { useState, useRef } from 'react'

const REGIONES = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
  'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba',
  'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
  'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
  'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
  'Vaupés', 'Vichada', 'Bogotá D.C.'
]

export default function NotaPositivaForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [region, setRegion] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageError, setImageError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setImageError('La imagen no puede superar 5 MB')
      return
    }
    setUploadingImage(true)
    setImageError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/nota-positiva/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir la imagen')
      setImageUrl(data.url)
    } catch (err: unknown) {
      setImageError(err instanceof Error ? err.message : 'Error al subir la imagen')
    } finally {
      setUploadingImage(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave() {
    setDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) uploadFile(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!imageUrl) {
      setError('Debes adjuntar una imagen de portada.')
      return
    }
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
          mediaUrl: imageUrl,
          mediaType: 'image',
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

  function resetForm() {
    setSent(false)
    setName(''); setEmail(''); setTitle(''); setDescription('')
    setRegion(''); setImageUrl(''); setImageError('')
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
          onClick={resetForm}
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

      {/* Imagen de portada */}
      <div>
        <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-2">
          Imagen de portada *
        </label>

        {imageUrl ? (
          <div className="relative border border-gris-200 overflow-hidden" style={{ height: 200 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Vista previa de portada"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => { setImageUrl(''); setImageError('') }}
              className="absolute top-2 right-2 bg-[#006138]/70 text-white font-sans text-xs px-2 py-1 hover:bg-[#006138]/90 transition-colors"
            >
              Quitar imagen
            </button>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed cursor-pointer p-8 text-center transition-colors ${
              dragOver ? 'border-verde bg-verde-claro/20' : 'border-gris-300 hover:border-verde'
            }`}
          >
            {uploadingImage ? (
              <p className="font-sans text-sm text-gris-600">Subiendo imagen...</p>
            ) : (
              <>
                <p className="font-sans text-sm text-gris-600 mb-1">
                  Arrastra y suelta una imagen aquí, o{' '}
                  <span className="text-verde underline">haz clic para seleccionar</span>
                </p>
                <p className="font-sans text-xs text-gris-400">
                  JPG, PNG, WEBP · Máx 5 MB
                </p>
              </>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
        {imageError && (
          <p className="font-sans text-xs text-red-600 mt-1">{imageError}</p>
        )}
      </div>

      {/* Botón */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={sending || uploadingImage}
          className="w-full md:w-auto bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs px-10 py-3.5 tracking-widest uppercase transition-colors disabled:opacity-60"
        >
          {sending ? 'Enviando...' : '✦ Enviar mi nota positiva'}
        </button>
        <p className="font-sans text-xs text-gris-400 mt-3">
          Tu historia será revisada por el equipo editorial antes de ser publicada.
        </p>
        <p className="font-sans text-xs text-gris-400 mt-1">
          Te contactaremos si necesitamos más información.
        </p>
      </div>
    </form>
  )
}
