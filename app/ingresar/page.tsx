'use client'

import Link from 'next/link'
import AuthForm from '@/components/AuthForm'

export default function IngresarPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-heading font-900 text-3xl text-tinta">Tu cuenta</h1>
          <p className="font-sans text-sm text-gris-600 mt-1">
            Inicia sesión o crea tu cuenta de Colombia Positiva
          </p>
        </div>

        <div className="bg-white border border-gris-200 p-8">
          <AuthForm redirectTo="/" />
        </div>

        <p className="font-sans text-xs text-gris-400 text-center mt-6">
          ¿Quieres copiar el texto de las notas?{' '}
          <Link href="/suscripcion" className="text-verde hover:underline">Suscríbete aquí</Link>
        </p>
      </div>
    </div>
  )
}
