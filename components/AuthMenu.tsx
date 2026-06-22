'use client'

import { useState, useRef, useEffect } from 'react'
import AuthForm from './AuthForm'

export default function AuthMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-sans font-600 text-verde hover:text-verde-oscuro transition-colors"
      >
        <span className="w-5 h-5 rounded-full bg-verde text-white flex items-center justify-center text-[10px] font-700 flex-shrink-0">
          ⤵
        </span>
        <span>Iniciar Sesión / Registro</span>
        <svg className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gris-200 shadow-lg z-50 p-4">
          <AuthForm onSuccess={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}
