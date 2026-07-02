'use client'

import { useState } from 'react'
import { savePricing } from '@/app/admin/pricing-actions'

export default function AdPriceEditor({ initialPerDay }: { initialPerDay: number }) {
  const [value, setValue] = useState(String(initialPerDay))
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  async function handleSave() {
    const perDay = parseInt(value, 10)
    if (!Number.isFinite(perDay) || perDay <= 0) {
      setMsg({ text: 'Ingresa un precio válido (mayor a 0).', ok: false })
      return
    }
    setSaving(true)
    setMsg(null)
    const res = await savePricing({ adPerDay: perDay })
    setSaving(false)
    if (res.error) setMsg({ text: res.error, ok: false })
    else setMsg({ text: 'Precio actualizado. Ya se ve en la página de pauta.', ok: true })
  }

  return (
    <div className="bg-white border border-gris-200 p-5 mb-6">
      <h2 className="font-sans font-700 text-xs uppercase tracking-widest text-gris-600 mb-1">
        Precio de las pautas
      </h2>
      <p className="font-sans text-xs text-gris-400 mb-4">
        Precio por día que paga el anunciante. Se refleja en <strong>/pauta</strong> y en el total del pago.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">
            Precio por día (COP)
          </label>
          <div className="flex items-center">
            <span className="font-sans text-sm text-gris-500 border border-r-0 border-gris-300 px-3 py-2.5 bg-gris-100">$</span>
            <input
              type="number"
              min={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-40 border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde"
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs px-6 py-3 tracking-widest uppercase transition-colors disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar precio'}
        </button>
      </div>
      {msg && (
        <p className={`font-sans text-xs mt-3 ${msg.ok ? 'text-verde' : 'text-red-600'}`}>{msg.text}</p>
      )}
    </div>
  )
}
