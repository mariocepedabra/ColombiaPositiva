'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { signInPublic } from '@/app/public-actions'

export default function IngresarPage() {
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await signInPublic(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-heading font-900 text-3xl text-tinta">Ingresar</h1>
          <p className="font-sans text-sm text-gris-600 mt-1">
            Accede a tu cuenta de suscriptor de Colombia Positiva
          </p>
        </div>

        <div className="bg-white border border-gris-200 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 font-sans text-sm px-4 py-3 mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">Correo electrónico</label>
              <input type="email" name="email" required
                className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde" placeholder="tu@correo.com" />
            </div>
            <div>
              <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1.5">Contraseña</label>
              <input type="password" name="password" required
                className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde" placeholder="Tu contraseña" />
            </div>
            <button type="submit" disabled={isPending}
              className="w-full bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs py-3 tracking-widest uppercase transition-colors disabled:opacity-60">
              {isPending ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="font-sans text-xs text-gris-400 text-center mt-6">
            ¿Aún no eres suscriptor?{' '}
            <Link href="/suscripcion" className="text-verde hover:underline">Suscríbete aquí</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
