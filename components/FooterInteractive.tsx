'use client'

import { useRef } from 'react'

export default function FooterInteractive({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null)

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  return (
    <footer
      ref={ref}
      onMouseMove={handleMove}
      className="footer-interactive relative overflow-hidden bg-tinta text-white mt-10"
    >
      <div className="footer-glow" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </footer>
  )
}
