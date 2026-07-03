'use client'

import { useState, useTransition } from 'react'
import { formatCop, type PlanId, type Plan } from '@/lib/subscription'
import { startSubscriptionCheckout } from '@/app/suscripcion-actions'

type Props = {
  plans: Plan[]
  loggedIn: boolean
  userName?: string
  alreadySubscribed: boolean
  gatewayConfigured: boolean
}

export default function PlanesSuscripcion({ plans, loggedIn, userName, alreadySubscribed, gatewayConfigured }: Props) {
  const [selected, setSelected] = useState<PlanId | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('register')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  if (alreadySubscribed) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 font-sans text-center p-8">
        <div className="text-4xl mb-3">✅</div>
        <p className="font-heading font-700 text-xl mb-1">Ya tienes una suscripción activa</p>
        <p className="text-sm">Puedes copiar el texto de las notas de Colombia Positiva. ¡Gracias por apoyarnos!</p>
      </div>
    )
  }

  function choosePlan(id: PlanId) {
    setSelected(id)
    setError('')
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    formData.set('plan', selected!)
    formData.set('mode', mode)
    startTransition(async () => {
      const result = await startSubscriptionCheckout(formData)
      if (result.error) setError(result.error)
      else if (result.url) window.location.href = result.url
    })
  }

  return (
    <div>
      {/* Tarjetas de planes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const isSel = selected === plan.id
          return (
            <button
              key={plan.id}
              onClick={() => choosePlan(plan.id)}
              className={`relative text-left border p-5 transition-all ${
                isSel ? 'border-verde ring-2 ring-verde bg-verde-claro/10' : 'border-gris-200 bg-white hover:border-verde'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 left-5 bg-[rgb(239,190,5)] text-[rgb(1,50,98)] font-sans font-700 text-[10px] uppercase tracking-wider px-2 py-0.5">
                  Más popular
                </span>
              )}
              <p className="font-heading font-700 text-lg text-tinta">{plan.name}</p>
              <p className="font-heading font-900 text-2xl text-verde mt-1">{formatCop(plan.priceCop)}</p>
              <p className="font-sans text-xs text-gris-400 mt-0.5">{plan.usdLabel}</p>
              <div className={`mt-3 font-sans text-xs font-700 uppercase tracking-wider ${isSel ? 'text-verde' : 'text-gris-400'}`}>
                {isSel ? '✓ Seleccionado' : 'Elegir'}
              </div>
            </button>
          )
        })}
      </div>

      {/* Paso de pago */}
      {selected && (
        <div className="mt-8 bg-white border border-gris-200 p-6 md:p-8 max-w-lg mx-auto">
          <h3 className="font-heading font-700 text-xl text-tinta mb-1">Casi listo</h3>
          <p className="font-sans text-sm text-gris-600 mb-5">
            Plan <strong>{plans.find((p) => p.id === selected)!.name}</strong> — {formatCop(plans.find((p) => p.id === selected)!.priceCop)}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 font-sans text-sm px-4 py-3 mb-4">{error}</div>
          )}

          {loggedIn ? (
            <form onSubmit={handleSubmit}>
              <p className="font-sans text-sm text-gris-600 mb-4">
                Estás ingresando como <strong>{userName}</strong>. Continúa al pago para activar tu suscripción.
              </p>
              <PayButton isPending={isPending} gatewayConfigured={gatewayConfigured} />
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Toggle registro / login */}
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setMode('register')}
                  className={`flex-1 font-sans text-xs font-700 py-2 uppercase tracking-wider transition-colors ${mode === 'register' ? 'bg-verde text-white' : 'bg-gris-100 text-gris-600'}`}>
                  Crear cuenta
                </button>
                <button type="button" onClick={() => setMode('login')}
                  className={`flex-1 font-sans text-xs font-700 py-2 uppercase tracking-wider transition-colors ${mode === 'login' ? 'bg-verde text-white' : 'bg-gris-100 text-gris-600'}`}>
                  Ya tengo cuenta
                </button>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">
                    Nombre <span className="font-400 normal-case tracking-normal">(opcional)</span>
                  </label>
                  <input type="text" name="full_name"
                    className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde" placeholder="Tu nombre" />
                </div>
              )}
              <div>
                <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">Correo electrónico</label>
                <input type="email" name="email" required
                  className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde" placeholder="tu@correo.com" />
              </div>
              <div>
                <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">Contraseña</label>
                <input type="password" name="password" required minLength={6}
                  className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde" placeholder="Mínimo 6 caracteres" />
              </div>
              <PayButton isPending={isPending} gatewayConfigured={gatewayConfigured} />
            </form>
          )}
        </div>
      )}
    </div>
  )
}

function PayButton({ isPending, gatewayConfigured }: { isPending: boolean; gatewayConfigured: boolean }) {
  return (
    <>
      <button type="submit" disabled={isPending || !gatewayConfigured}
        className="w-full bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs py-3.5 tracking-widest uppercase transition-colors disabled:opacity-60">
        {isPending ? 'Redirigiendo...' : gatewayConfigured ? '💳 Continuar al pago' : 'Pago no disponible aún'}
      </button>
      {!gatewayConfigured && (
        <p className="font-sans text-xs text-gris-400 mt-2 text-center">
          El pago en línea aún no está habilitado. Vuelve más tarde.
        </p>
      )}
    </>
  )
}
