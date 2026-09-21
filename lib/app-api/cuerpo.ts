// Normaliza el cuerpo de una nota para la app.
//
// En la base hay dos clases de cuerpos: HTML de WordPress (Página 10, con
// estilos en línea, srcset, clases…) y texto plano (notas antiguas o escritas
// a mano en el panel). La app recibe siempre HTML limpio y predecible, con las
// imágenes ya apuntando al optimizador propio (/api/imagen): pagina10.com
// bloquea el hotlinking y las fotos del bucket pueden pesar hasta 25 MB.

import { anchoMasCercano, hostPermitido } from '@/lib/imagenes'
import { SITE_URL } from '@/lib/site'

// Ancho para las fotos dentro del cuerpo: cubre un iPhone a 3× (≈ 358 pt).
const ANCHO_FOTO_CUERPO = anchoMasCercano(1080)
const CALIDAD = 72

// Misma heurística que app/articulo/[slug]/page.tsx (isHtmlContent).
export function esHtml(contenido: string): boolean {
  return /<(p|div|strong|em|h[1-6]|ul|ol|li|br|a|figure|img)\b/i.test(contenido)
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Texto plano → HTML, con las mismas reglas que renderContent() de la web:
// bloques separados por línea en blanco; viñetas (•, -, *); una línea corta sin
// puntuación final es un subtítulo; el resto, párrafos con <br> internos.
export function textoPlanoAHtml(contenido: string): string {
  const normalizado = contenido.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const bloques = normalizado.split(/\n{2,}/).filter((b) => b.trim() !== '')

  return bloques
    .map((bloque, indice) => {
      const lineas = bloque.split('\n').filter((l) => l.trim() !== '')
      if (lineas.length === 0) return ''

      const esLista = lineas.every((l) => /^[•\-*]\s*/.test(l.trim()))
      if (esLista) {
        const items = lineas.map((l) => `<li>${escapar(l.trim().replace(/^[•\-*]\s*/, ''))}</li>`).join('')
        return `<ul>${items}</ul>`
      }

      if (lineas.length === 1 && indice > 0) {
        const linea = lineas[0].trim()
        if (linea.length < 100 && !/[.,;]$/.test(linea)) return `<h3>${escapar(linea)}</h3>`
      }

      return `<p>${lineas.map((l) => escapar(l.trim())).join('<br>')}</p>`
    })
    .join('\n')
}

function urlOptimizada(src: string): string | null {
  let url: URL
  try {
    url = new URL(src, SITE_URL)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (!hostPermitido(url.hostname)) return url.href // se deja tal cual (dominio ajeno)
  return `${SITE_URL}/api/imagen?url=${encodeURIComponent(url.href)}&w=${ANCHO_FOTO_CUERPO}&q=${CALIDAD}`
}

// HTML de WordPress → HTML limpio para el WebView de la app.
export function limpiarHtml(html: string): string {
  let h = html

  // Fuera todo lo ejecutable o incrustado que no controlamos.
  h = h.replace(/<(script|style|iframe|object|embed|form|input|button|noscript)\b[\s\S]*?<\/\1>/gi, '')
  h = h.replace(/<(script|style|iframe|object|embed|form|input|button|noscript)\b[^>]*\/?>/gi, '')
  h = h.replace(/<!--[\s\S]*?-->/g, '')

  // Imágenes: src al optimizador; sin srcset/sizes/width/height/estilos.
  h = h.replace(/<img\b([^>]*)\/?>/gi, (_, attrs: string) => {
    const src = /\ssrc=["']([^"']+)["']/i.exec(attrs)?.[1]
    const alt = /\salt=["']([^"']*)["']/i.exec(attrs)?.[1] ?? ''
    const optimizada = src ? urlOptimizada(src) : null
    if (!optimizada) return ''
    return `<img src="${optimizada}" alt="${escapar(alt)}" loading="lazy">`
  })

  // Enlaces: solo href (absoluto) y que abran fuera.
  h = h.replace(/<a\b([^>]*)>/gi, (_, attrs: string) => {
    const href = /\shref=["']([^"']+)["']/i.exec(attrs)?.[1]
    if (!href) return '<a>'
    let absoluta: string
    try {
      absoluta = new URL(href, SITE_URL).href
    } catch {
      return '<a>'
    }
    return `<a href="${escapar(absoluta)}">`
  })

  // Atributos de presentación y de eventos, en cualquier etiqueta.
  h = h.replace(/\s(style|class|id|width|height|align|srcset|sizes|fetchpriority|decoding|data-[\w-]+|on\w+)=("[^"]*"|'[^']*'|[^\s>]+)/gi, '')

  // Hay notas pegadas desde Facebook que solo traen <div> anidados (sin <p>).
  // Cada div pasa a ser un párrafo; los anidamientos y vacíos se colapsan.
  h = h.replace(/<div\b[^>]*>/gi, '<p>').replace(/<\/div>/gi, '</p>')
  h = h.replace(/(<p>\s*){2,}/gi, '<p>').replace(/(<\/p>\s*){2,}/gi, '</p>\n')

  // Párrafos vacíos y &nbsp; de relleno típicos de WordPress.
  h = h.replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')

  return h.trim()
}

export function normalizarCuerpo(contenido: string): string {
  const c = contenido ?? ''
  return esHtml(c) ? limpiarHtml(c) : textoPlanoAHtml(c)
}

// HTML → texto plano legible en voz alta: párrafos y títulos separados por
// pausas (punto y aparte), sin etiquetas ni entidades.
export function htmlATextoPlano(html: string): string {
  return html
    .replace(/<\/(p|h[1-6]|li|blockquote|figcaption)>/gi, '.\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\.\s*\.\n/g, '.\n') // "final de frase." + ".\n" → un solo punto
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
}
