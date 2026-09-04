import { NextRequest, NextResponse } from 'next/server'
import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Ingesta de notas publicadas en Página 10.
 *
 * El plugin «P10 Multipublicación» de pagina10.com manda aquí un JSON pequeño
 * (texto y URLs, nunca archivos) firmado con HMAC-SHA256. Esta ruta descarga
 * las imágenes de Página 10, las sube al bucket propio y guarda la nota en
 * `articles`, enlazándola por `p10_post_id` para que las ediciones posteriores
 * actualicen la misma fila en lugar de duplicarla.
 *
 * Requiere en Vercel:
 *   - P10_INGESTA_SECRET      (el mismo secreto que en el panel de WordPress)
 *   - SUPABASE_SECRET_KEY     (ya existente, la usa createAdminClient)
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BUCKET_IMAGENES = 'article-images'
const BUCKET_VIDEOS = 'videos'
const CARPETA = 'pagina10'

// Margen de tolerancia de la marca de tiempo, para que una petición capturada
// no pueda reenviarse más tarde.
const VENTANA_FIRMA_S = 300

// Presupuesto de tiempo para copiar archivos. Si se agota, la nota se publica
// igual: los medios que falten se quedan apuntando a Página 10 y el plugin
// vuelve a llamar para terminar el trabajo.
const PRESUPUESTO_MS = 8000

const MAX_IMAGEN_MB = 15
const MAX_VIDEO_MB_POR_DEFECTO = 25

const CATEGORIAS_VALIDAS = [
  'economia',
  'medio-ambiente',
  'cultura',
  'deporte',
  'ciencia',
  'regiones',
  'personajes',
  'educacion',
]

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const TIPOS_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime']

type Medio = {
  url: string
  tipo: 'imagen' | 'video'
  alt?: string
}

type Paquete = {
  version?: number
  origen?: string
  accion?: 'publicar' | 'despublicar'
  post_id?: number
  url_original?: string
  titulo?: string
  slug?: string
  extracto?: string
  contenido_html?: string
  autor?: string
  fecha?: string
  publicado?: boolean
  minutos_lectura?: number
  categoria?: string
  portada_url?: string
  medios?: Medio[]
  avisos?: string[]
  max_video_mb?: number
}

function error(mensaje: string, estado = 400) {
  return NextResponse.json({ ok: false, error: mensaje }, { status: estado })
}

/** Comprueba la firma HMAC del cuerpo tal y como llegó, sin reserializar. */
function firmaValida(cuerpo: string, cabeceraFirma: string | null, cabeceraFecha: string | null): boolean {
  const secreto = process.env.P10_INGESTA_SECRET
  if (!secreto || !cabeceraFirma || !cabeceraFecha) return false

  const marca = Number(cabeceraFecha)
  if (!Number.isFinite(marca)) return false
  if (Math.abs(Date.now() / 1000 - marca) > VENTANA_FIRMA_S) return false

  const esperada = createHmac('sha256', secreto).update(`${cabeceraFecha}.${cuerpo}`).digest('hex')
  const recibida = cabeceraFirma.replace(/^sha256=/, '')

  const a = Buffer.from(esperada, 'utf8')
  const b = Buffer.from(recibida, 'utf8')
  if (a.length !== b.length) return false

  return timingSafeEqual(a, b)
}

/** Nombre estable del archivo en el bucket: mismo origen, mismo destino. */
function rutaDestino(url: string, contentType: string): string {
  const huella = createHash('sha1').update(url).digest('hex')
  const extensionUrl = (url.split('?')[0].split('.').pop() || '').toLowerCase()
  const extension = /^[a-z0-9]{2,4}$/.test(extensionUrl)
    ? extensionUrl
    : (contentType.split('/')[1] || 'jpg').replace('quicktime', 'mov')

  return `${CARPETA}/${huella}.${extension}`
}

/** ¿El archivo ya está en el bucket? Los buckets son públicos: basta un HEAD. */
async function yaExiste(urlPublica: string): Promise<boolean> {
  try {
    const respuesta = await fetch(urlPublica, { method: 'HEAD', cache: 'no-store' })
    return respuesta.ok
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const crudo = await request.text()

  if (!process.env.P10_INGESTA_SECRET) {
    return error('La ingesta no está configurada en el servidor.', 503)
  }

  if (!firmaValida(crudo, request.headers.get('x-p10-firma'), request.headers.get('x-p10-fecha'))) {
    return error('Firma no válida.', 401)
  }

  let paquete: Paquete
  try {
    paquete = JSON.parse(crudo)
  } catch {
    return error('El cuerpo no es JSON válido.')
  }

  const postId = Number(paquete.post_id)
  if (!Number.isInteger(postId) || postId <= 0) {
    return error('Falta el identificador de la nota de origen.')
  }

  const supabase = createAdminClient()

  // ---------------------------------------------------------------------
  //  Retirar: la nota dejó de estar publicada en Página 10, o se desmarcó
  //  el destino. Nunca se borra la fila, solo se oculta.
  // ---------------------------------------------------------------------
  if (paquete.accion === 'despublicar') {
    const { data, error: fallo } = await supabase
      .from('articles')
      .update({ is_published: false })
      .eq('p10_post_id', postId)
      .select('id, slug')
      .maybeSingle()

    if (fallo) {
      console.error('[ingesta-p10] Error al despublicar:', fallo)
      return error('No se pudo retirar la nota.', 500)
    }

    if (data) {
      revalidar(data.slug)
    }

    return NextResponse.json({ ok: true, id: data?.id ?? '', url: '', medios_copiados: 0, medios_pendientes: 0, avisos: [] })
  }

  // ---------------------------------------------------------------------
  //  Publicar o actualizar
  // ---------------------------------------------------------------------
  const titulo = (paquete.titulo || '').trim()
  if (!titulo) {
    return error('La nota no tiene título.')
  }

  const categoria = (paquete.categoria || '').trim()
  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    return error('Elige una categoría de Colombia Positiva antes de enviar la nota.')
  }

  const avisos: string[] = Array.isArray(paquete.avisos) ? [...paquete.avisos] : []
  const medios = Array.isArray(paquete.medios) ? paquete.medios : []
  const maxVideoMb = Number(paquete.max_video_mb) > 0 ? Number(paquete.max_video_mb) : MAX_VIDEO_MB_POR_DEFECTO

  let contenido = paquete.contenido_html || ''
  let portada = paquete.portada_url || ''
  let copiados = 0
  let pendientes = 0
  const inicio = Date.now()

  for (const medio of medios) {
    const origen = (medio?.url || '').trim()
    if (!origen || !/^https?:\/\//i.test(origen)) continue

    if (Date.now() - inicio > PRESUPUESTO_MS) {
      // Se acabó el tiempo. Lo que queda sigue apuntando a Página 10 (que es
      // exactamente lo que se hacía hasta ahora a mano) y el plugin volverá
      // a llamar para copiarlo.
      pendientes++
      continue
    }

    const resultado = await copiar(supabase, origen, medio.tipo === 'video', maxVideoMb)

    if (resultado.aviso) {
      avisos.push(resultado.aviso)
    }

    if (!resultado.url) {
      pendientes++
      continue
    }

    if (!resultado.reutilizado) {
      copiados++
    }

    // Se sustituye la URL en el cuerpo y, si es la portada, también ahí.
    contenido = contenido.split(origen).join(resultado.url)
    if (portada === origen) {
      portada = resultado.url
    }
  }

  // Slug: se respeta el de Página 10 salvo que ya lo ocupe otra nota.
  const { data: existente } = await supabase
    .from('articles')
    .select('id, slug')
    .eq('p10_post_id', postId)
    .maybeSingle()

  const slug = existente?.slug ?? (await slugLibre(supabase, paquete.slug || '', titulo, postId))

  const fila = {
    title: titulo,
    slug,
    excerpt: paquete.extracto || '',
    content: contenido,
    category_slug: categoria,
    image_url: portada || null,
    author_name: (paquete.autor || '').trim() || 'Página 10',
    is_published: paquete.publicado !== false,
    published_at: paquete.fecha || new Date().toISOString(),
    read_time: Number(paquete.minutos_lectura) > 0 ? Number(paquete.minutos_lectura) : 5,
    p10_post_id: postId,
    p10_url: paquete.url_original || null,
  }

  const { data: guardada, error: falloGuardar } = existente
    ? await supabase.from('articles').update(fila).eq('id', existente.id).select('id, slug').single()
    : await supabase.from('articles').insert(fila).select('id, slug').single()

  if (falloGuardar || !guardada) {
    console.error('[ingesta-p10] Error al guardar:', falloGuardar)
    return error('No se pudo guardar la nota en Colombia Positiva.', 500)
  }

  revalidar(guardada.slug)

  return NextResponse.json({
    ok: true,
    id: guardada.id,
    url: `https://colombiapositiva.com/articulo/${guardada.slug}`,
    medios_copiados: copiados,
    medios_pendientes: pendientes,
    avisos,
  })
}

/** Descarga un archivo de Página 10 y lo sube al bucket propio. */
async function copiar(
  supabase: ReturnType<typeof createAdminClient>,
  origen: string,
  esVideo: boolean,
  maxVideoMb: number
): Promise<{ url: string; reutilizado: boolean; aviso?: string }> {
  const bucket = esVideo ? BUCKET_VIDEOS : BUCKET_IMAGENES
  const maxBytes = (esVideo ? maxVideoMb : MAX_IMAGEN_MB) * 1024 * 1024

  try {
    // Si ya se copió en un envío anterior, se reutiliza sin descargar nada.
    const rutaProbable = rutaDestino(origen, esVideo ? 'video/mp4' : 'image/jpeg')
    const { data: publica } = supabase.storage.from(bucket).getPublicUrl(rutaProbable)
    if (publica?.publicUrl && (await yaExiste(publica.publicUrl))) {
      return { url: publica.publicUrl, reutilizado: true }
    }

    const respuesta = await fetch(origen, { cache: 'no-store' })
    if (!respuesta.ok) {
      return { url: '', reutilizado: false, aviso: `No se pudo descargar ${origen}` }
    }

    const contentType = (respuesta.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
    const permitidos = esVideo ? TIPOS_VIDEO : TIPOS_IMAGEN
    if (!permitidos.includes(contentType)) {
      return { url: '', reutilizado: false, aviso: `Formato no admitido (${contentType || 'desconocido'}) en ${origen}` }
    }

    const datos = Buffer.from(await respuesta.arrayBuffer())
    if (datos.byteLength > maxBytes) {
      const mb = Math.round(datos.byteLength / (1024 * 1024))
      return {
        url: '',
        reutilizado: false,
        aviso: `Archivo de ${mb} MB por encima del límite: se dejó enlazado a Página 10.`,
      }
    }

    const ruta = rutaDestino(origen, contentType)
    const { error: falloSubida } = await supabase.storage
      .from(bucket)
      .upload(ruta, datos, { contentType, upsert: true, cacheControl: '31536000' })

    if (falloSubida) {
      console.error('[ingesta-p10] Error al subir', ruta, falloSubida)
      return { url: '', reutilizado: false, aviso: `No se pudo guardar ${origen}` }
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(ruta)

    return { url: data?.publicUrl || '', reutilizado: false }
  } catch (e) {
    console.error('[ingesta-p10] Fallo copiando', origen, e)
    return { url: '', reutilizado: false, aviso: `No se pudo copiar ${origen}` }
  }
}

/** Busca un slug libre, respetando el de Página 10 siempre que se pueda. */
async function slugLibre(
  supabase: ReturnType<typeof createAdminClient>,
  propuesto: string,
  titulo: string,
  postId: number
): Promise<string> {
  const base =
    (propuesto || titulo)
      .toLowerCase()
      // NFD separa la letra de su tilde; al quitar todo lo que no es ASCII
      // quedan solo las letras base («canción» → «cancion»).
      .normalize('NFD')
      .replace(/[^\x00-\x7F]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90) || `nota-p10-${postId}`

  for (let intento = 0; intento < 20; intento++) {
    const candidato = intento === 0 ? base : `${base}-${intento + 1}`
    const { data } = await supabase.from('articles').select('id').eq('slug', candidato).maybeSingle()
    if (!data) return candidato
  }

  return `${base}-p10-${postId}`
}

/** Refresca la caché de las páginas afectadas. */
function revalidar(slug: string) {
  try {
    revalidatePath(`/articulo/${slug}`)
    revalidatePath('/')
  } catch {
    // La revalidación es una mejora, no un requisito: la página usa ISR de
    // 60 segundos y se actualizaría igualmente.
  }
}
