'use client'

import { useEffect, useRef, useState } from 'react'

// "Escuchar esta nota": texto a voz con la voz del navegador (Web Speech API).
// No usa ningún servicio externo. Si el navegador no lo soporta, el botón no
// aparece. Se lee por trozos porque algunos navegadores cortan textos largos.

const MAX_TROZO = 1500

function partirEnTrozos(texto: string): string[] {
  const trozos: string[] = []
  let actual = ''
  for (const parrafo of texto.split(/\n+/)) {
    if (!parrafo.trim()) continue
    if ((actual + '\n' + parrafo).length > MAX_TROZO && actual) {
      trozos.push(actual)
      actual = parrafo
    } else {
      actual = actual ? `${actual}\n${parrafo}` : parrafo
    }
  }
  if (actual) trozos.push(actual)
  return trozos
}

function elegirVoz(): SpeechSynthesisVoice | null {
  const voces = window.speechSynthesis.getVoices()
  return (
    voces.find((v) => v.lang.toLowerCase() === 'es-co') ??
    voces.find((v) => v.lang.toLowerCase().startsWith('es-')) ??
    voces.find((v) => v.lang.toLowerCase().startsWith('es')) ??
    null
  )
}

type Estado = 'inactivo' | 'hablando' | 'pausado'

export default function EscucharNota({ texto }: { texto: string }) {
  // Solo en el cliente y solo si el navegador tiene voz.
  const [soportado, setSoportado] = useState<boolean | null>(null)
  const [estado, setEstado] = useState<Estado>('inactivo')
  const cola = useRef<string[]>([])
  const cancelado = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => setSoportado('speechSynthesis' in window && texto.trim().length > 0), 0)
    return () => {
      clearTimeout(t)
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [texto])

  function leerSiguiente() {
    const trozo = cola.current.shift()
    if (!trozo || cancelado.current) {
      setEstado('inactivo')
      return
    }
    const u = new SpeechSynthesisUtterance(trozo)
    const voz = elegirVoz()
    if (voz) u.voice = voz
    u.lang = voz?.lang ?? 'es-CO'
    u.rate = 0.95
    u.onend = () => leerSiguiente()
    u.onerror = () => setEstado('inactivo')
    window.speechSynthesis.speak(u)
  }

  function empezar() {
    cancelado.current = false
    window.speechSynthesis.cancel()
    cola.current = partirEnTrozos(texto)
    setEstado('hablando')
    // Algunos navegadores cargan las voces de forma asíncrona.
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null
        leerSiguiente()
      }
      setTimeout(() => {
        if (estado !== 'hablando' && cola.current.length > 0) leerSiguiente()
      }, 400)
      return
    }
    leerSiguiente()
  }

  function detener() {
    cancelado.current = true
    cola.current = []
    window.speechSynthesis.cancel()
    setEstado('inactivo')
  }

  function pausarOSeguir() {
    if (estado === 'hablando') {
      window.speechSynthesis.pause()
      setEstado('pausado')
    } else if (estado === 'pausado') {
      window.speechSynthesis.resume()
      setEstado('hablando')
    }
  }

  if (!soportado) return null

  const btn = 'font-sans text-xs font-700 px-4 py-1.5 uppercase tracking-wider transition-opacity hover:opacity-80'

  return (
    <div className="flex flex-wrap items-center gap-2.5 mb-5" aria-live="polite">
      {estado === 'inactivo' ? (
        <button onClick={empezar} className={`${btn} text-white`} style={{ backgroundColor: '#013262' }} aria-label="Escuchar esta nota">
          🎧 Escuchar esta nota
        </button>
      ) : (
        <>
          <button onClick={pausarOSeguir} className={`${btn} text-tinta`} style={{ backgroundColor: '#efbe05' }}>
            {estado === 'hablando' ? '⏸ Pausar' : '▶ Seguir'}
          </button>
          <button onClick={detener} className={`${btn} border border-gris-300 text-gris-600 hover:border-verde hover:text-verde`}>
            ■ Detener
          </button>
          <span className="font-sans text-xs text-gris-400">
            {estado === 'hablando' ? 'Leyendo la nota en voz alta…' : 'En pausa'}
          </span>
        </>
      )}
    </div>
  )
}
