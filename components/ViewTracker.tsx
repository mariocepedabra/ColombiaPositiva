'use client'

import { useEffect } from 'react'

export default function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/articles/${slug}/view`, { method: 'POST' }).catch(() => {})
  }, [slug])

  return null
}
