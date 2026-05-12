'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { signIn } from '../actions'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await signIn(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="min-h-screen bg-papel flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="font-heading font-900 text-3xl text-verde">Colombia Positiva</h1>
            <p className="font-heading italic text-gris-600 text-sm mt-1">Panel de administración</p>
          </Link>
        </div>

        <div className="bg-white border border-gris-200 p-8">
          <h2 className="font-heading font-700 text-xl text-tinta mb-6">Iniciar sesión</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 font-sans text-sm px-4 py-3 mb-4">
              {error === 'Invalid login credentials'
                ? 'Correo o contraseña incorrectos'
                : error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde"
                placeholder="tu@correo.com"
              />
            </div>
            <div>
              <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                required
                className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs py-3 tracking-widest uppercase transition-colors disabled:opacity-60"
            >
              {isPending ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="font-sans text-xs text-gris-400 text-center mt-6">
            ¿Quieres ser columnista?{' '}
            <Link href="/admin/registro" className="text-verde hover:underline">
              Solicitar acceso
            </Link>
          </p>
        </div>

        <p className="text-center mt-4">
          <Link href="/" className="font-sans text-xs text-gris-400 hover:text-verde transition-colors">
            ← Volver al periódico
          </Link>
        </p>
      </div>
    </div>
  )
}
