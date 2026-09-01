'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Importación manual de enlaces de TikTok.
//
// TikTok solo entrega los 10 videos más recientes de un perfil a quien no tiene
// sesión iniciada, así que el histórico no se puede enumerar automáticamente.
// Aquí se pegan los enlaces y el sistema hace la comparación: descarta los que
// ya están publicados e importa solo los que faltan.

type Resultado = {
  detectados: number
  yaEstaban: number
  importados: number
  noEncontrados: string[]
}

export default function ImportadorTikTok() {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [error, setError] = useState('')

  async function importar() {
    setCargando(true)
    setError('')
    setResultado(null)
    try {
      const res = await fetch('/api/videos/importar-tiktok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo importar')
      setResultado(json)
      setTexto('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo importar')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="bg-white border border-gris-200 mb-6">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gris-100/50 transition-colors"
      >
        <div>
          <p className="font-heading font-700 text-base text-tinta">
            Importar videos antiguos de TikTok
          </p>
          <p className="font-sans text-xs text-gris-400 mt-0.5">
            Para recuperar los que se publicaron antes y nunca se subieron a la web
          </p>
        </div>
        <span className="font-sans text-xl text-gris-400 shrink-0">{abierto ? '−' : '+'}</span>
      </button>

      {abierto && (
        <div className="p-5 pt-0 border-t border-gris-200">
          <p className="font-sans text-sm text-gris-600 leading-relaxed mt-4 mb-3">
            La revisión automática diaria detecta los <strong>10 videos más recientes</strong>: es
            el máximo que TikTok entrega sin sesión iniciada, así que los más antiguos hay que
            traerlos una sola vez desde aquí.
          </p>

          <div className="bg-gris-100 border border-gris-200 p-4 mb-4">
            <p className="font-sans text-xs font-700 text-tinta mb-2">Cómo sacar la lista:</p>
            <ol className="font-sans text-xs text-gris-600 space-y-1 list-decimal list-inside leading-relaxed">
              <li>
                Abre{' '}
                <a
                  href="https://www.tiktok.com/@colombia.positiva"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-verde underline"
                >
                  tiktok.com/@colombia.positiva
                </a>{' '}
                en tu navegador, con tu sesión iniciada.
              </li>
              <li>Baja hasta el final para que carguen todos los videos.</li>
              <li>
                Abre la consola del navegador (tecla <strong>F12</strong> → pestaña{' '}
                <em>Console</em>) y pega esta línea:
              </li>
            </ol>
            <pre className="mt-2 bg-white border border-gris-200 p-2.5 overflow-x-auto font-mono text-[11px] text-tinta">
              {`copy([...document.querySelectorAll('a[href*="/video/"]')].map(a=>a.href).join('\\n'))`}
            </pre>
            <p className="font-sans text-xs text-gris-600 mt-2">
              Eso copia todos los enlaces al portapapeles. Pégalos abajo y listo.
            </p>
          </div>

          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={6}
            placeholder={
              'https://www.tiktok.com/@colombia.positiva/video/7668315914282093840\nhttps://www.tiktok.com/@colombia.positiva/video/7667728637684141329\n…'
            }
            className="w-full font-mono text-xs border border-gris-200 p-3 focus:outline-none focus:border-verde"
          />

          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={importar}
              disabled={cargando || !texto.trim()}
              className="font-sans text-xs uppercase tracking-widest bg-verde text-white px-5 py-2.5 hover:bg-verde-oscuro transition-colors disabled:opacity-50"
            >
              {cargando ? 'Comparando e importando…' : 'Comparar e importar'}
            </button>
            <span className="font-sans text-xs text-gris-400">
              Los repetidos se ignoran automáticamente.
            </span>
          </div>

          {error && (
            <p className="font-sans text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-2.5 mt-3">
              {error}
            </p>
          )}

          {resultado && (
            <div className="font-sans text-sm bg-green-50 border border-green-200 px-4 py-3 mt-3">
              <p className="text-green-800">
                <strong>{resultado.importados}</strong> video
                {resultado.importados === 1 ? '' : 's'} nuevo
                {resultado.importados === 1 ? '' : 's'} publicado
                {resultado.importados === 1 ? '' : 's'} en la portada.
              </p>
              <p className="text-gris-600 text-xs mt-1">
                Se leyeron {resultado.detectados} enlaces · {resultado.yaEstaban} ya estaban en la web
                {resultado.noEncontrados.length > 0 &&
                  ` · ${resultado.noEncontrados.length} sin datos en TikTok (borrados o privados)`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
