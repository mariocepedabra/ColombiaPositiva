'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { authSignIn, authSignUp } from '@/app/public-actions'

type Props = {
  // Qué hacer tras autenticarse correctamente. Por defecto refresca la vista.
  redirectTo?: string
  onSuccess?: () => void
  defaultTab?: 'login' | 'register'
}

export default function AuthForm({ redirectTo, onSuccess, defaultTab = 'login' }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = tab === 'login' ? await authSignIn(formData) : await authSignUp(formData)
      if (result.error) { setError(result.error); return }
      // Éxito
      onSuccess?.()
      router.refresh()
      if (redirectTo) router.push(redirectTo)
    })
  }

  return (
    <div>
      {/* Pestañas */}
      <div className="flex gap-2 mb-4">
        <button type="button" onClick={() => { setTab('login'); setError('') }}
          className={`flex-1 font-sans text-xs font-700 py-2 uppercase tracking-wider transition-colors ${tab === 'login' ? 'bg-verde text-white' : 'bg-gris-100 text-gris-600'}`}>
          Iniciar sesión
        </button>
        <button type="button" onClick={() => { setTab('register'); setError('') }}
          className={`flex-1 font-sans text-xs font-700 py-2 uppercase tracking-wider transition-colors ${tab === 'register' ? 'bg-verde text-white' : 'bg-gris-100 text-gris-600'}`}>
          Crear cuenta
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 font-sans text-xs px-3 py-2 mb-3">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {tab === 'register' && (
          <div>
            <label className="block font-sans text-[11px] font-700 uppercase tracking-wider text-gris-600 mb-1">
              Nombre <span className="font-400 normal-case tracking-normal">(opcional)</span>
            </label>
            <input type="text" name="full_name"
              className="w-full border border-gris-300 px-3 py-2 text-sm font-sans focus:outline-none focus:border-verde" placeholder="Tu nombre" />
          </div>
        )}
        <div>
          <label className="block font-sans text-[11px] font-700 uppercase tracking-wider text-gris-600 mb-1">Correo electrónico</label>
          <input type="email" name="email" required autoComplete="email"
            className="w-full border border-gris-300 px-3 py-2 text-sm font-sans focus:outline-none focus:border-verde" placeholder="tu@correo.com" />
        </div>
        <div>
          <label className="block font-sans text-[11px] font-700 uppercase tracking-wider text-gris-600 mb-1">Contraseña</label>
          <input type="password" name="password" required minLength={6}
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            className="w-full border border-gris-300 px-3 py-2 text-sm font-sans focus:outline-none focus:border-verde"
            placeholder={tab === 'login' ? 'Tu contraseña' : 'Mínimo 6 caracteres'} />
        </div>
        <button type="submit" disabled={isPending}
          className="w-full bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs py-3 tracking-widest uppercase transition-colors disabled:opacity-60">
          {isPending ? 'Procesando...' : tab === 'login' ? 'Ingresar' : 'Crear cuenta e ingresar'}
        </button>
      </form>

      <p className="font-sans text-[11px] text-gris-400 mt-3 text-center leading-relaxed">
        {tab === 'login'
          ? 'Ingresa para acceder a tu suscripción.'
          : 'Crea tu cuenta para suscribirte y copiar el texto de las notas.'}
      </p>
    </div>
  )
}
