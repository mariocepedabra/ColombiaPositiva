'use client'

import { useEffect } from 'react'
import { recordVisitedNote } from '@/lib/visited-notes'

export default function ViewTracker({ slug, title }: { slug: string; title?: string }) {
  useEffect(() => {
    fetch(`/api/articles/${slug}/view`, { method: 'POST' }).catch(() => {})
    if (title) recordVisitedNote(slug, title)
  }, [slug, title])

  return null
}
