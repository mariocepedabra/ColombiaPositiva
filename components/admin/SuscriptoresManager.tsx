'use client'

import { useState, useTransition } from 'react'
import { grantManualSubscription, revokeSubscription, reactivateSubscription } from '@/app/admin/ads-actions'
import type { AdminSubscription } from '@/lib/admin-data'

const PLAN_LABEL: Record<string, string> = {
  '1d': '1 día', '1m': '1 mes', '6m': '6 meses', '1y': '1 año', manual: 'Manual',
}
const STATUS_COLOR: Record<string, string> = {
  activa: 'bg-green-100 text-green-800',
  pendiente_pago: 'bg-yellow-100 text-yellow-800',
  vencida: 'bg-gris-200 text-gris-500',
  cancelada: 'bg-red-50 text-red-600',
}

function isVigente(s: AdminSubscription): boolean {
  if (s.status !== 'activa') return false
  if (!s.end_date) return true
  return new Date(s.end_date) >= new Date()
}

export default function SuscriptoresManager({ subscriptions, names }: { subscriptions: AdminSubscription[]; names: Record<string, string> }) {
  return (
    <div className="space-y-8">
      <GrantForm />

      <div>
        <h2 className="font-heading font-700 text-lg text-tinta mb-3">Suscripciones</h2>
        {subscriptions.length === 0 ? (
          <div className="bg-white border border-gris-200 p-8 text-center">
            <p className="font-heading text-lg text-gris-400 italic">Aún no hay suscripciones</p>
          </div>
        ) : (
          <div className="bg-white border border-gris-200">
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-gris-200 bg-gris-100 font-sans text-xs uppercase tracking-widest text-gris-400">
              <div className="col-span-4">Suscriptor</div>
              <div className="col-span-2">Plan</div>
              <div className="col-span-2">Origen</div>
              <div className="col-span-2">Vence</div>
              <div className="col-span-2">Acción</div>
            </div>
            {subscriptions.map((s) => <SubRow key={s.id} sub={s} name={s.user_id ? names[s.user_id] : ''} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function SubRow({ sub, name }: { sub: AdminSubscription; name?: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const vigente = isVigente(sub)

  function run(fn: () => Promise<{ error?: string }>) {
    setError('')
    startTransition(async () => { const r = await fn(); if (r?.error) setError(r.error) })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-4 border-b border-gris-100 last:border-0 items-center">
      <div className="md:col-span-4">
        <p className="font-sans text-sm font-600 text-tinta truncate">{name || '(sin nombre)'}</p>
        <p className="font-sans text-xs text-gris-400 truncate">{sub.email || '(sin correo)'}</p>
        <span className={`inline-block font-sans text-[11px] px-2 py-0.5 rounded mt-1 ${STATUS_COLOR[sub.status] ?? 'bg-gris-200'}`}>
          {vigente ? 'Activa' : sub.status === 'activa' ? 'Vencida' : sub.status === 'pendiente_pago' ? 'Pendiente de pago' : sub.status === 'cancelada' ? 'Cancelada' : sub.status}
        </span>
      </div>
      <div className="md:col-span-2 font-sans text-sm text-gris-600">{PLAN_LABEL[sub.plan] ?? sub.plan}</div>
      <div className="md:col-span-2 font-sans text-xs text-gris-500">{sub.source === 'manual' ? '🎁 Manual' : '💳 Pago'}</div>
      <div className="md:col-span-2 font-sans text-xs text-gris-500">
        {sub.end_date ? new Date(sub.end_date).toLocaleDateString('es-CO') : 'Indefinida'}
      </div>
      <div className="md:col-span-2">
        {sub.status === 'cancelada' ? (
          <button onClick={() => run(() => reactivateSubscription(sub.id))} disabled={isPending}
            className="font-sans text-xs text-verde hover:underline disabled:opacity-60">Reactivar</button>
        ) : (
          <button onClick={() => run(() => revokeSubscription(sub.id))} disabled={isPending}
            className="font-sans text-xs text-red-600 hover:underline disabled:opacity-60">Revocar</button>
        )}
        {error && <p className="font-sans text-[11px] text-red-600 mt-1">{error}</p>}
      </div>
    </div>
  )
}

function GrantForm() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setSuccess('')
    const form = e.currentTarget
    const formData = new FormData(form)
    startTransition(async () => {
      const r = await grantManualSubscription(formData)
      if (r.error) setError(r.error)
      else if (r.success) { setSuccess(r.success); form.reset() }
    })
  }

  return (
    <div className="bg-white border border-gris-200 p-6">
      <h2 className="font-heading font-700 text-lg text-tinta mb-1">Dar acceso gratis</h2>
      <p className="font-sans text-xs text-gris-500 mb-5">
        Otorga a una persona el acceso para copiar el texto de las notas sin pagar.
        Si el correo <strong>ya existe</strong> (incluso si hizo clic en pagar y no pagó), solo se le otorga el acceso.
        Si es un correo <strong>nuevo</strong>, la contraseña es obligatoria para que pueda ingresar. El nombre es opcional.
      </p>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 font-sans text-sm px-4 py-3 mb-4">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 font-sans text-sm px-4 py-3 mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">Correo electrónico *</label>
          <input type="email" name="email" required
            className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde" placeholder="amigo@correo.com" />
        </div>
        <div>
          <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">
            Contraseña <span className="font-400 normal-case tracking-normal">(solo si es correo nuevo)</span>
          </label>
          <input type="text" name="password" minLength={6}
            className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde" placeholder="Mínimo 6 caracteres" />
        </div>
        <div>
          <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">
            Nombre <span className="font-400 normal-case tracking-normal">(opcional)</span>
          </label>
          <input type="text" name="full_name"
            className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde" placeholder="Nombre de la persona" />
        </div>
        <div>
          <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">Duración</label>
          <select name="duration_days"
            className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans bg-white focus:outline-none focus:border-verde">
            <option value="">Indefinida</option>
            <option value="1">1 día</option>
            <option value="30">1 mes</option>
            <option value="182">6 meses</option>
            <option value="365">1 año</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <button type="submit" disabled={isPending}
            className="bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs px-8 py-3 tracking-widest uppercase transition-colors disabled:opacity-60">
            {isPending ? 'Creando...' : '🎁 Otorgar acceso'}
          </button>
        </div>
      </form>
    </div>
  )
}
