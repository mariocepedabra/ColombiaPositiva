'use client'

import { useState } from 'react'
import { savePricing } from '@/app/admin/pricing-actions'
import { usdLabel } from '@/lib/subscription'
import type { Pricing } from '@/lib/pricing'

const FIELDS: { key: keyof Pricing; label: string }[] = [
  { key: 'sub1d', label: '1 día' },
  { key: 'sub1m', label: '1 mes' },
  { key: 'sub6m', label: '6 meses' },
  { key: 'sub1y', label: '1 año' },
]

type SubKey = 'sub1d' | 'sub1m' | 'sub6m' | 'sub1y'

export default function SubPriceEditor({ initial }: { initial: Pricing }) {
  const [values, setValues] = useState<Record<SubKey, string>>({
    sub1d: String(initial.sub1d),
    sub1m: String(initial.sub1m),
    sub6m: String(initial.sub6m),
    sub1y: String(initial.sub1y),
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  function set(key: SubKey, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }))
  }

  async function handleSave() {
    const patch: Partial<Pricing> = {}
    for (const f of FIELDS) {
      const n = parseInt(values[f.key as SubKey], 10)
      if (!Number.isFinite(n) || n <= 0) {
        setMsg({ text: `El precio de "${f.label}" no es válido.`, ok: false })
        return
      }
      patch[f.key] = n
    }
    setSaving(true)
    setMsg(null)
    const res = await savePricing(patch)
    setSaving(false)
    if (res.error) setMsg({ text: res.error, ok: false })
    else setMsg({ text: 'Precios actualizados. Ya se ven en la página de suscripción.', ok: true })
  }

  return (
    <div className="bg-white border border-gris-200 p-5 mb-6">
      <h2 className="font-sans font-700 text-xs uppercase tracking-widest text-gris-600 mb-1">
        Precios de suscripción
      </h2>
      <p className="font-sans text-xs text-gris-400 mb-4">
        Se reflejan en <strong>/suscripcion</strong> y en el monto del pago. El valor en dólares se calcula automáticamente.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {FIELDS.map((f) => {
          const n = parseInt(values[f.key as SubKey], 10)
          return (
            <div key={f.key}>
              <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">
                {f.label} (COP)
              </label>
              <div className="flex items-center">
                <span className="font-sans text-sm text-gris-500 border border-r-0 border-gris-300 px-2 py-2.5 bg-gris-100">$</span>
                <input
                  type="number"
                  min={1}
                  value={values[f.key as SubKey]}
                  onChange={(e) => set(f.key as SubKey, e.target.value)}
                  className="w-full border border-gris-300 px-2 py-2.5 text-sm font-sans focus:outline-none focus:border-verde"
                />
              </div>
              <p className="font-sans text-[11px] text-gris-400 mt-1">
                {Number.isFinite(n) && n > 0 ? usdLabel(n) : '—'}
              </p>
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs px-6 py-3 tracking-widest uppercase transition-colors disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar precios'}
        </button>
        {msg && (
          <p className={`font-sans text-xs ${msg.ok ? 'text-verde' : 'text-red-600'}`}>{msg.text}</p>
        )}
      </div>
    </div>
  )
}
