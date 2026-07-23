import sharp from 'sharp'
import { anchoMasCercano, calidadValida, hostPermitido } from '@/lib/imagenes'

// Optimizador de imágenes propio. Descarga la foto original (Página 10 o
// Supabase), la redimensiona y la entrega en WebP. Si algo falla, redirige a la
// imagen original en vez de devolver un error: en un periódico la foto siempre
// tiene que verse, aunque sea sin optimizar.

export const runtime = 'nodejs'

// Un mes de caché en el CDN; la URL ya identifica ancho y calidad, así que el
// resultado nunca cambia para la misma combinación.
const CACHE_OK = 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400'
// Los fallos se cachean poco, para reintentar pronto si el origen se recupera.
const CACHE_FALLBACK = 'public, max-age=300, s-maxage=300'

// Corto antes del límite de ejecución de la función: si el origen tarda más,
// preferimos redirigir a la foto original a que se caiga la petición.
const TIMEOUT_MS = 8_000
// Hay fotos importadas de más de 25 MB (27 megapíxeles) y sharp las procesa
// sin problema; el tope solo protege contra archivos disparatados.
const MAX_BYTES = 45 * 1024 * 1024

// Formatos que sharp no debe tocar: el SVG por seguridad y el GIF para no
// perder la animación. Se sirven desde su origen.
const SIN_PROCESAR = ['image/svg+xml', 'image/gif']

function redirigirAlOriginal(url: string) {
  return new Response(null, {
    status: 307,
    headers: { Location: url, 'Cache-Control': CACHE_FALLBACK },
  })
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const url = params.get('url')
  if (!url) return new Response('Falta el parámetro url', { status: 400 })

  let origen: URL
  try {
    origen = new URL(url)
  } catch {
    return new Response('URL inválida', { status: 400 })
  }
  if (origen.protocol !== 'https:' && origen.protocol !== 'http:') {
    return new Response('Protocolo no permitido', { status: 400 })
  }
  if (!hostPermitido(origen.hostname)) {
    return new Response('Dominio no permitido', { status: 400 })
  }

  const ancho = anchoMasCercano(Number(params.get('w')))
  const calidad = calidadValida(Number(params.get('q')))
  // WhatsApp no muestra la vista previa si la imagen es WebP.
  const formato = params.get('f') === 'jpeg' ? 'jpeg' : 'webp'

  try {
    const respuesta = await fetch(origen.href, {
      headers: { Accept: 'image/*', 'User-Agent': 'ColombiaPositiva/1.0 (+https://colombiapositiva.com)' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })
    if (!respuesta.ok) return redirigirAlOriginal(origen.href)

    const tipo = (respuesta.headers.get('content-type') ?? '').split(';')[0].trim()
    if (SIN_PROCESAR.includes(tipo)) return redirigirAlOriginal(origen.href)

    const declarado = Number(respuesta.headers.get('content-length'))
    if (Number.isFinite(declarado) && declarado > MAX_BYTES) {
      return redirigirAlOriginal(origen.href)
    }

    const entrada = Buffer.from(await respuesta.arrayBuffer())
    if (entrada.byteLength === 0 || entrada.byteLength > MAX_BYTES) {
      return redirigirAlOriginal(origen.href)
    }

    const pipeline = sharp(entrada, { failOn: 'none' })
      .rotate() // respeta la orientación EXIF de las fotos de celular
      .resize({ width: ancho, withoutEnlargement: true })

    const salida =
      formato === 'jpeg'
        ? await pipeline.jpeg({ quality: calidad, mozjpeg: true }).toBuffer()
        : await pipeline.webp({ quality: calidad }).toBuffer()

    return new Response(new Uint8Array(salida), {
      headers: {
        'Content-Type': `image/${formato}`,
        'Content-Length': String(salida.byteLength),
        'Cache-Control': CACHE_OK,
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (e) {
    console.error('[api/imagen] no se pudo optimizar', origen.href, e)
    return redirigirAlOriginal(origen.href)
  }
}
