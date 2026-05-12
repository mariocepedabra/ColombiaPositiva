'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { signUp } from '../actions'

export default function RegistroPage() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')
    const formData = new FormData(e.currentTarget)

    if (formData.get('password') !== formData.get('confirm_password')) {
      setError('Las contraseñas no coinciden')
      return
    }

    startTransition(async () => {
      const result = await signUp(formData)
      if (result?.error) setError(result.error)
      else if (result?.success) setSuccess(result.success)
    })
  }

  return (
    <div className="min-h-screen bg-papel flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="font-heading font-900 text-3xl text-verde">Colombia Positiva</h1>
            <p className="font-heading italic text-gris-600 text-sm mt-1">Solicitar acceso como columnista</p>
          </Link>
        </div>

        <div className="bg-white border border-gris-200 p-8">
          <h2 className="font-heading font-700 text-xl text-tinta mb-2">Crear cuenta</h2>
          <p className="font-sans text-sm text-gris-600 mb-6">
            Una vez registrado, el administrador activará tu acceso como columnista.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 font-sans text-sm px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {success ? (
            <div className="bg-green-50 border border-green-200 text-green-700 font-sans text-sm px-4 py-3">
              {success}
              <p className="mt-2">
                <Link href="/admin/login" className="underline">Ir al inicio de sesión</Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  name="full_name"
                  required
                  className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde"
                  placeholder="Juan García"
                />
              </div>
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
                  minLength={6}
                  className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <label className="block font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mb-1">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  required
                  className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde"
                  placeholder="Repite la contraseña"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs py-3 tracking-widest uppercase transition-colors disabled:opacity-60"
              >
                {isPending ? 'Registrando...' : 'Crear cuenta'}
              </button>
            </form>
          )}

          <p className="font-sans text-xs text-gris-400 text-center mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/admin/login" className="text-verde hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
