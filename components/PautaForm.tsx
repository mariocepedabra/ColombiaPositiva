'use client'

import { useState, useRef } from 'react'
import { getAdCheckoutUrl } from '@/app/public-actions'
import { createClient } from '@/lib/supabase/client'

type Props = {
  maxImageMb: number
  maxVideoMb: number
  gatewayConfigured: boolean
  pricePerDay: number
}

export default function PautaForm({ maxImageMb, maxVideoMb, gatewayConfigured, pricePerDay }: Props) {
  const [advertiserName, setAdvertiserName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [kind, setKind] = useState<'image' | 'video'>('image')
  const [mediaUrl, setMediaUrl] = useState('')
  const [days, setDays] = useState(1)

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  // Estado tras enviar: pantalla de pago
  const [submitted, setSubmitted] = useState<{ id: string; price: number; days: number } | null>(null)
  const [paying, setPaying] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const total = days * pricePerDay
  const maxMb = kind === 'video' ? maxVideoMb : maxImageMb

  async function uploadFile(file: File) {
    if (file.size > maxMb * 1024 * 1024) {
      setUploadError(`El archivo no puede superar ${maxMb} MB`)
      return
    }
    setUploading(true)
    setUploadError('')
    try {
      // 1) Pedimos al servidor una URL firmada (petición pequeña, sin el archivo).
      //    Así el archivo NO pasa por la función serverless y evitamos su límite
      //    de tamaño; el peso máximo real lo define la configuración del panel.
      const res = await fetch('/api/pauta/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir el archivo')

      // 2) Subimos el archivo directamente a Supabase Storage con la URL firmada.
      const supabase = createClient()
      const { error: uploadErr } = await supabase.storage
        .from(data.bucket)
        .uploadToSignedUrl(data.path, data.token, file, { contentType: file.type })
      if (uploadErr) throw new Error(uploadErr.message || 'Error al subir el archivo')

      setMediaUrl(data.publicUrl)
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  function switchKind(next: 'image' | 'video') {
    if (next === kind) return
    setKind(next)
    setMediaUrl('')
    setUploadError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!mediaUrl) {
      setError(`Debes subir ${kind === 'video' ? 'un video' : 'una imagen'} para tu anuncio.`)
      return
    }
    setError('')
    setSending(true)
    try {
      const res = await fetch('/api/pauta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advertiserName, company: company || undefined, email: email || undefined,
          phone: phone || undefined, targetUrl: targetUrl || undefined,
          mediaUrl, mediaType: kind, days,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar')
      setSubmitted({ id: data.id, price: data.price, days: data.days })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar. Intenta de nuevo.')
    } finally {
      setSending(false)
    }
  }

  async function handlePay() {
    if (!submitted) return
    setPaying(true)
    try {
      const url = await getAdCheckoutUrl(submitted.id, submitted.price, email || undefined)
      if (url) {
        window.location.href = url
      } else {
        setError('El pago no está disponible en este momento. Tu solicitud quedó registrada y será revisada.')
        setPaying(false)
      }
    } catch {
      setError('No se pudo iniciar el pago. Tu solicitud quedó registrada.')
      setPaying(false)
    }
  }

  // ---- Pantalla de confirmación + pago ----
  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="font-heading font-700 text-2xl text-verde mb-2">¡Tu solicitud fue recibida!</h3>
        <p className="font-sans text-gris-600 text-sm leading-relaxed max-w-md mx-auto mb-6">
          Hola <strong>{advertiserName.split(' ')[0]}</strong>, tu anuncio quedó registrado.
          Puedes pagarlo ahora para agilizar su activación, o esperar a que el equipo de
          Colombia Positiva lo revise.
        </p>

        <div className="bg-papel border border-gris-200 p-5 max-w-sm mx-auto mb-6 text-left">
          <div className="flex justify-between py-1 text-sm font-sans">
            <span className="text-gris-600">Duración</span>
            <span className="font-600 text-tinta">{submitted.days} día(s)</span>
          </div>
          <div className="flex justify-between py-1 text-sm font-sans border-t border-gris-200 mt-1 pt-2">
            <span className="text-gris-600">Total a pagar</span>
            <span className="font-700 text-verde text-lg">${submitted.price.toLocaleString('es-CO')} COP</span>
          </div>
        </div>

        {error && <p className="font-sans text-sm text-red-600 mb-4">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handlePay}
            disabled={paying || !gatewayConfigured}
            className="bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs px-8 py-3.5 tracking-widest uppercase transition-colors disabled:opacity-60"
          >
            {paying ? 'Redirigiendo...' : gatewayConfigured ? '💳 Pagar ahora' : 'Pago no disponible aún'}
          </button>
          <a
            href="/"
            className="border border-gris-300 text-gris-600 hover:border-verde hover:text-verde font-sans font-700 text-xs px-8 py-3.5 tracking-widest uppercase transition-colors flex items-center justify-center"
          >
            Pagar después
          </a>
        </div>
        <p className="font-sans text-xs text-gris-400 mt-5">
          Tu anuncio quedará en espera hasta que el equipo lo apruebe.
        </p>
      </div>
    )
  }

  // ---- Formulario ----
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 font-sans text-sm px-4 py-3">{error}</div>
      )}

      {/* Datos del anunciante */}
      <div>
        <h3 className="font-heading font-700 text-lg text-tinta mb-4">Datos del anunciante</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">Nombre completo *</label>
            <input type="text" value={advertiserName} onChange={(e) => setAdvertiserName(e.target.value)} required
              className="w-full border border-gris-300 bg-white px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde" placeholder="Juan Pérez" />
          </div>
          <div>
            <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">Empresa o marca</label>
            <input type="text" value={company} onChange={(e) => setCompany(e.target.value)}
              className="w-full border border-gris-300 bg-white px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde" placeholder="Mi Empresa S.A.S." />
          </div>
          <div>
            <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">Correo electrónico</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gris-300 bg-white px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde" placeholder="correo@miempresa.com" />
          </div>
          <div>
            <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">Teléfono / WhatsApp</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gris-300 bg-white px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde" placeholder="310 123 4567" />
          </div>
        </div>
        <div className="mt-5">
          <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">
            URL de destino <span className="font-400 normal-case tracking-normal">(opcional)</span>
          </label>
          <input type="url" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)}
            className="w-full border border-gris-300 bg-white px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde" placeholder="https://www.miempresa.com" />
          <p className="font-sans text-xs text-gris-400 mt-1">¿A qué página deben llegar los usuarios al hacer clic en tu anuncio? Si la dejas vacía, el anuncio no tendrá enlace.</p>
        </div>
      </div>

      {/* Banner */}
      <div className="border-t border-gris-200 pt-6">
        <h3 className="font-heading font-700 text-lg text-tinta mb-4">Tu banner</h3>
        <div className="flex gap-2 mb-4">
          <button type="button" onClick={() => switchKind('image')}
            className={`font-sans text-xs font-700 px-4 py-2 tracking-wider uppercase transition-colors ${kind === 'image' ? 'bg-verde text-white' : 'bg-gris-100 text-gris-600 hover:bg-gris-200'}`}>
            🖼️ Imagen
          </button>
          <button type="button" onClick={() => switchKind('video')}
            className={`font-sans text-xs font-700 px-4 py-2 tracking-wider uppercase transition-colors ${kind === 'video' ? 'bg-verde text-white' : 'bg-gris-100 text-gris-600 hover:bg-gris-200'}`}>
            🎬 Video
          </button>
        </div>

        <p className="font-sans text-xs text-gris-500 mb-2">
          {kind === 'video'
            ? `Formatos: MP4, WebM o MOV · Peso máximo: ${maxVideoMb} MB · Se reproduce sin audio, en bucle.`
            : `Formato JPG o PNG · Tamaño recomendado: 970 × 250 px · Peso máximo: ${maxImageMb} MB`}
        </p>

        {mediaUrl ? (
          <div className="relative border border-gris-200 overflow-hidden bg-gris-100">
            {kind === 'video' ? (
              <video src={mediaUrl} className="w-full max-h-64 object-contain" muted autoPlay loop playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl} alt="Vista previa del banner" className="w-full max-h-64 object-contain" />
            )}
            <button type="button" onClick={() => setMediaUrl('')}
              className="absolute top-2 right-2 bg-[#013262]/70 text-white font-sans text-xs px-2 py-1 hover:bg-[#013262]/90 transition-colors">
              Quitar
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed cursor-pointer p-8 text-center transition-colors ${dragOver ? 'border-verde bg-verde-claro/20' : 'border-gris-300 hover:border-verde'}`}
          >
            {uploading ? (
              <p className="font-sans text-sm text-gris-600">Subiendo {kind === 'video' ? 'video' : 'imagen'}...</p>
            ) : (
              <>
                <p className="font-sans text-sm text-gris-600 mb-1">
                  Haz clic para seleccionar tu {kind === 'video' ? 'video' : 'imagen'}{' '}
                  <span className="text-verde underline">o arrástralo aquí</span>
                </p>
                <p className="font-sans text-xs text-gris-400">
                  {kind === 'video' ? `MP4, WebM o MOV · Máx. ${maxVideoMb} MB` : `JPG, PNG o WEBP · Máx. ${maxImageMb} MB`}
                </p>
              </>
            )}
          </div>
        )}
        <input ref={fileInputRef} type="file"
          accept={kind === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp,image/gif'}
          onChange={handleFileSelect} className="hidden" />
        {uploadError && <p className="font-sans text-xs text-red-600 mt-1">{uploadError}</p>}
      </div>

      {/* Duración y precio */}
      <div className="border-t border-gris-200 pt-6">
        <h3 className="font-heading font-700 text-lg text-tinta mb-4">Duración y precio</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">¿Cuántos días deseas pautar? *</label>
            <p className="font-sans text-xs text-gris-400 mb-2">Precio: ${pricePerDay.toLocaleString('es-CO')} COP por día. Sin mínimo de días.</p>
            <div className="flex items-center">
              <button type="button" onClick={() => setDays((d) => Math.max(1, d - 1))}
                className="w-11 h-11 border border-gris-300 text-tinta text-lg hover:bg-gris-100">−</button>
              <input type="number" min={1} value={days}
                onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 h-11 border-t border-b border-gris-300 text-center font-sans text-sm focus:outline-none" />
              <button type="button" onClick={() => setDays((d) => d + 1)}
                className="w-11 h-11 border border-gris-300 text-tinta text-lg hover:bg-gris-100">+</button>
            </div>
          </div>
          <div className="bg-verde text-white text-center px-8 py-4 w-full sm:w-auto">
            <p className="font-sans text-xs uppercase tracking-widest opacity-80">Total a pagar</p>
            <p className="font-heading font-900 text-2xl">${total.toLocaleString('es-CO')} COP</p>
            <p className="font-sans text-xs opacity-80">{days} día(s) × ${pricePerDay.toLocaleString('es-CO')} COP</p>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button type="submit" disabled={sending || uploading}
          className="w-full bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs py-4 tracking-widest uppercase transition-colors disabled:opacity-60">
          {sending ? 'Enviando...' : 'Continuar →'}
        </button>
        <p className="font-sans text-xs text-gris-400 mt-3 text-center">
          Tu anuncio quedará en espera hasta que sea aprobado por nuestro equipo.
        </p>
      </div>
    </form>
  )
}
