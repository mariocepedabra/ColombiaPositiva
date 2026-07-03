'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { categories } from '@/lib/data'

export default function MobileMenu() {
  const [open, setOpen] = useState(false)

  // Bloquear scroll del body cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Botón hamburguesa — absoluto dentro del header */}
      <div className="md:hidden absolute right-4 top-1/2 -translate-y-1/2">
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          className="p-2 hover:bg-gris-100 transition-colors"
        >
          {open ? (
            <svg className="w-5 h-5 text-tinta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-tinta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Overlay — FUERA del div con transform para que fixed funcione correctamente */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-[#013262]/60"
          onClick={() => setOpen(false)}
        >
          <nav
            className="absolute top-0 left-0 h-full w-72 bg-papel border-r border-gris-200 flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del panel */}
            <div className="p-5 border-b-2 border-tinta flex items-center justify-between">
              <span className="font-heading font-700 text-xl text-tinta">Secciones</span>
              <button onClick={() => setOpen(false)} className="p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Buscador */}
            <div className="px-4 py-3 border-b border-gris-200">
              <form action="/buscar" method="GET" className="flex gap-2">
                <input
                  type="search"
                  name="q"
                  placeholder="Buscar noticias..."
                  className="flex-1 border border-gris-300 bg-white px-3 py-2 text-xs font-sans focus:outline-none focus:border-verde"
                />
                <button type="submit" className="bg-verde text-white px-3 py-2 flex items-center">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Ítems de navegación */}
            <ul className="flex-1 overflow-y-auto">
              <li className="border-b border-gris-200">
                <Link href="/" onClick={() => setOpen(false)} className="block px-5 py-3.5 text-sm font-sans font-600 tracking-wider uppercase text-tinta hover:bg-gris-100">
                  Inicio
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.slug} className="border-b border-gris-200">
                  <Link
                    href={`/categoria/${cat.slug}`}
                    onClick={() => setOpen(false)}
                    className="block px-5 py-3.5 text-sm font-sans font-600 tracking-wider uppercase hover:bg-gris-100"
                    style={{ color: cat.color }}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/nota-positiva"
                  onClick={() => setOpen(false)}
                  className="block px-5 py-3.5 text-sm font-sans font-700 tracking-wider uppercase bg-[rgb(239,190,5)] text-[rgb(1,50,98)] hover:bg-[rgb(1,50,98)] hover:text-[rgb(239,190,5)] transition-colors"
                >
                  ✦ Nota Positiva
                </Link>
              </li>
              <li>
                <Link
                  href="/pauta"
                  onClick={() => setOpen(false)}
                  className="block px-5 py-3.5 text-sm font-sans font-700 tracking-wider uppercase bg-[rgb(239,190,5)] text-[rgb(1,50,98)] hover:bg-[rgb(1,50,98)] hover:text-[rgb(239,190,5)] transition-colors"
                >
                  ✦ Pauta Positiva
                </Link>
              </li>
              <li>
                <Link
                  href="/suscripcion"
                  onClick={() => setOpen(false)}
                  className="block px-5 py-3.5 text-sm font-sans font-700 tracking-wider uppercase bg-[rgb(239,190,5)] text-[rgb(1,50,98)] hover:bg-[rgb(1,50,98)] hover:text-[rgb(239,190,5)] transition-colors"
                >
                  ✦ Suscríbete
                </Link>
              </li>
              <li className="border-t border-gris-200">
                <Link
                  href="/ingresar"
                  onClick={() => setOpen(false)}
                  className="block px-5 py-3.5 text-sm font-sans font-600 tracking-wider uppercase text-verde hover:bg-gris-100 transition-colors"
                >
                  Iniciar sesión / Registro
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  )
}
