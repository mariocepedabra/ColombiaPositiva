'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signOutPublic } from '@/app/public-actions'

type Props = {
  name: string
  role: string
}

export default function UserMenu({ name, role }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initial = name.charAt(0).toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-sans text-gris-600 hover:text-verde transition-colors"
      >
        {/* Avatar inicial */}
        <span className="w-5 h-5 rounded-full bg-verde text-white flex items-center justify-center text-[10px] font-700 flex-shrink-0">
          {initial}
        </span>
        <span className="max-w-[120px] truncate">{name}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gris-200 shadow-lg z-50">
          {/* Info del usuario */}
          <div className="px-4 py-3 border-b border-gris-100">
            <p className="font-sans text-xs font-700 text-tinta truncate">{name}</p>
            <p className="font-sans text-[10px] text-gris-400 mt-0.5 capitalize">
              {role === 'admin' ? 'Administrador' : role === 'columnista' ? 'Columnista' : 'Lector'}
            </p>
          </div>

          {/* Opciones */}
          {(role === 'admin' || role === 'columnista') && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-sans text-gris-600 hover:bg-gris-100 hover:text-verde transition-colors"
            >
              <span className="text-sm">⚙️</span>
              <span>Panel de edición</span>
            </Link>
          )}

          <button
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-sans text-gris-600 hover:bg-gris-100 hover:text-verde transition-colors text-left"
          >
            <span className="text-sm">👤</span>
            <span>Mi perfil</span>
          </button>

          <div className="border-t border-gris-100" />

          <form action={signOutPublic}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-sans text-gris-600 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
            >
              <span className="text-sm">↩</span>
              <span>Cerrar sesión</span>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
