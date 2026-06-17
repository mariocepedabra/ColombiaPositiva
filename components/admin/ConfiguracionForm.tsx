'use client'

import { useState, useTransition } from 'react'
import { saveSettings } from '@/app/admin/ads-actions'

type Status = {
  publicKeySet: boolean
  privateKeySet: boolean
  eventsSecretSet: boolean
  integritySecretSet: boolean
  adMaxImageMb: number
  adMaxVideoMb: number
}

export default function ConfiguracionForm({ status }: { status: Status }) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setSuccess('')
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await saveSettings(formData)
      if (r.error) setError(r.error)
      else if (r.success) setSuccess('Configuración guardada correctamente.')
    })
  }

  const placeholder = (set: boolean) => (set ? '•••••••••• (ya configurada — deja vacío para conservar)' : 'No configurada')

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 font-sans text-sm px-4 py-3">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 font-sans text-sm px-4 py-3">{success}</div>}

      {/* Pasarela de pagos */}
      <div className="bg-white border border-gris-200 p-6">
        <h2 className="font-heading font-700 text-lg text-tinta mb-1">Pasarela de pagos</h2>
        <p className="font-sans text-xs text-gris-500 mb-5">
          Llaves de la pasarela (Wompi u otra). Por seguridad, las llaves ya guardadas no se muestran;
          deja un campo vacío para conservar su valor actual.
        </p>

        <div className="space-y-4">
          <Field name="gateway_public_key" label="Llave pública" set={status.publicKeySet} placeholder={placeholder(status.publicKeySet)} />
          <Field name="gateway_private_key" label="Llave privada" set={status.privateKeySet} placeholder={placeholder(status.privateKeySet)} secret />
          <Field name="gateway_events_secret" label="Secreto de eventos (webhook)" set={status.eventsSecretSet} placeholder={placeholder(status.eventsSecretSet)} secret />
          <Field name="gateway_integrity_secret" label="Secreto de integridad" set={status.integritySecretSet} placeholder={placeholder(status.integritySecretSet)} secret />
        </div>

        <div className="mt-4 bg-papel border border-gris-200 p-3">
          <p className="font-sans text-xs text-gris-600">
            <strong>URL del webhook</strong> (configúrala en el panel de la pasarela):<br />
            <code className="text-verde">https://colombiapositiva.com/api/gateway/webhook</code>
          </p>
        </div>
      </div>

      {/* Límites de archivos */}
      <div className="bg-white border border-gris-200 p-6">
        <h2 className="font-heading font-700 text-lg text-tinta mb-1">Pautas — peso máximo de archivos</h2>
        <p className="font-sans text-xs text-gris-500 mb-5">Tamaño máximo permitido para los banners que suben los anunciantes.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">Imagen (MB)</label>
            <input type="number" name="ad_max_image_mb" min={1} defaultValue={status.adMaxImageMb}
              className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde" />
          </div>
          <div>
            <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">Video (MB)</label>
            <input type="number" name="ad_max_video_mb" min={1} defaultValue={status.adMaxVideoMb}
              className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde" />
          </div>
        </div>
      </div>

      <button type="submit" disabled={isPending}
        className="bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs px-10 py-3 tracking-widest uppercase transition-colors disabled:opacity-60">
        {isPending ? 'Guardando...' : 'Guardar configuración'}
      </button>
    </form>
  )
}

function Field({ name, label, set, placeholder, secret }: { name: string; label: string; set: boolean; placeholder: string; secret?: boolean }) {
  return (
    <div>
      <label className="flex items-center gap-2 font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">
        {label}
        {set && <span className="font-400 normal-case tracking-normal text-green-600">✓ configurada</span>}
      </label>
      <input type={secret ? 'password' : 'text'} name={name} autoComplete="off"
        className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde"
        placeholder={placeholder} />
    </div>
  )
}
