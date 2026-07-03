'use client'

import { useMemo, useSyncExternalStore } from 'react'
import Link from 'next/link'
import {
  subscribeVisitedNotes,
  getVisitedNotesRaw,
  parseVisitedNotes,
  clearVisitedNotes,
} from '@/lib/visited-notes'

// Centinela para el render del servidor/hidratación: distingue "aún no leído el
// localStorage" de "leído y vacío", evitando un parpadeo del estado vacío.
const SSR_SENTINEL = '__ssr__'

export default function VisitedNotes() {
  const raw = useSyncExternalStore(
    subscribeVisitedNotes,
    getVisitedNotesRaw,
    () => SSR_SENTINEL,
  )

  const loading = raw === SSR_SENTINEL
  const notes = useMemo(() => (loading ? [] : parseVisitedNotes(raw)), [raw, loading])

  function handleClear() {
    if (!confirm('¿Borrar tu historial de notas visitadas en este dispositivo?')) return
    clearVisitedNotes()
  }

  if (loading) {
    return <p className="font-sans text-sm text-gris-400">Cargando tu historial…</p>
  }

  if (notes.length === 0) {
    return (
      <p className="font-sans text-sm text-gris-600">
        Aún no has visitado ninguna nota desde este dispositivo. Cuando leas notas en
        Colombia Positiva aparecerán aquí.
      </p>
    )
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <p className="font-sans text-sm text-gris-600">
          Has visitado <strong className="text-tinta">{notes.length}</strong>{' '}
          {notes.length === 1 ? 'nota' : 'notas'}
        </p>
        <button
          type="button"
          onClick={handleClear}
          className="font-sans text-xs text-gris-400 hover:text-red-600 transition-colors"
        >
          Limpiar historial
        </button>
      </div>

      <ul className="divide-y divide-gris-100 max-h-80 overflow-y-auto">
        {notes.map((n) => (
          <li key={n.slug}>
            <Link
              href={`/articulo/${n.slug}`}
              className="flex items-start justify-between gap-3 py-2.5 group"
            >
              <span className="font-heading text-sm text-titulo group-hover:text-verde transition-colors leading-snug">
                {n.title}
              </span>
              <span className="font-sans text-[11px] text-gris-400 whitespace-nowrap mt-0.5">
                {new Date(n.at).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
