'use client'

import { useState } from 'react'

type Props = {
  url: string
  title: string
  imageUrl: string
}

export default function ShareButtons({ url, title, imageUrl }: Props) {
  const [copied, setCopied] = useState(false)
  const [busyImg, setBusyImg] = useState(false)

  const text = title
  const enc = encodeURIComponent

  const networks = [
    { label: 'Facebook', bg: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { label: 'X', bg: '#111111', href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(text)}` },
    { label: 'WhatsApp', bg: '#25D366', href: `https://wa.me/?text=${enc(text + '\n' + url)}` },
    { label: 'Telegram', bg: '#229ED9', href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}` },
  ]

  function openShare(href: string) {
    window.open(href, '_blank', 'noopener,noreferrer,width=600,height=600')
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: seleccionar por prompt
      window.prompt('Copia el enlace:', url)
    }
  }

  // Compartir nativo: abre el menú del sistema con todas las apps instaladas.
  async function nativeShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url })
      } catch {
        /* el usuario canceló */
      }
    } else {
      copyLink()
    }
  }

  // Compartir/descargar la imagen-tarjeta (ideal para un estado de WhatsApp).
  async function shareImage() {
    setBusyImg(true)
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const file = new File([blob], 'colombia-positiva.png', { type: blob.type || 'image/png' })

      const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean }
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title, text })
      } else {
        // Escritorio o sin soporte: descargar la imagen para subirla manualmente.
        const objUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objUrl
        a.download = 'colombia-positiva.png'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(objUrl)
      }
    } catch {
      /* ignorar: el usuario puede usar los otros botones */
    } finally {
      setBusyImg(false)
    }
  }

  const btnBase =
    'font-sans text-xs font-700 px-4 py-1.5 uppercase tracking-wider transition-opacity hover:opacity-80'

  return (
    <div className="mt-8 pt-5 border-t border-gris-200">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="font-sans text-xs font-700 uppercase tracking-wider text-gris-600 mr-1">
          Compartir:
        </span>

        {networks.map((n) => (
          <button key={n.label} onClick={() => openShare(n.href)} className={`${btnBase} text-white`} style={{ backgroundColor: n.bg }}>
            {n.label}
          </button>
        ))}

        <button onClick={copyLink} className={`${btnBase} border border-gris-300 text-gris-600 hover:border-verde hover:text-verde`}>
          {copied ? '✓ Copiado' : '🔗 Copiar enlace'}
        </button>

        <button onClick={nativeShare} className={`${btnBase} text-white`} style={{ backgroundColor: '#006039' }}>
          ↗ Compartir
        </button>

        <button onClick={shareImage} disabled={busyImg} className={`${btnBase} text-tinta disabled:opacity-60`} style={{ backgroundColor: '#efbe05' }}>
          {busyImg ? 'Preparando…' : '🖼️ Imagen para estado'}
        </button>
      </div>
      <p className="font-sans text-xs text-gris-400 mt-2.5">
        &ldquo;Compartir&rdquo; abre las apps de tu teléfono (WhatsApp, Instagram y más). &ldquo;Imagen para estado&rdquo; genera una tarjeta de la nota lista para subir como estado.
      </p>
    </div>
  )
}
