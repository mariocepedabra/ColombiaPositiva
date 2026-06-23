'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteNotaSubmission } from '@/app/admin/notas-actions'

type Props = {
  id: string
  title: string
}

export default function DeleteNotaButton({ id, title }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    if (!confirm(`¿Eliminar la nota "${title}"? Esta acción no se puede deshacer.`)) return
    setError(null)
    startTransition(async () => {
      const result = await deleteNotaSubmission(id)
      if (result?.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="font-sans text-xs border border-red-300 text-red-600 px-4 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? 'Eliminando…' : '🗑 Eliminar'}
      </button>
      {error && <span className="font-sans text-xs text-red-600">{error}</span>}
    </div>
  )
}
