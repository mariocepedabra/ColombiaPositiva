import { revalidatePath, revalidateTag } from 'next/cache'
import sharp from 'sharp'

import type { DbArticle } from '@/lib/articles'
import { categories } from '@/lib/data'
import type { ImagenSubida, MiNotaEditable, MiNotaResumen, PaginaMisNotas, PeticionGuardarNota, SlugSeccion } from './contratos'
import { TAG_NOTAS } from './nota'
import { aNotaResumen, type FilaResumen } from './notas'
import { TAG_PORTADA } from './portada'
import { clienteConToken, type SesionApp } from './sesion'

// Publicar notas desde la app. Mismas reglas que el panel web:
//  · Solo roles 'columnista' y 'admin'.
//  · Se escribe con el token del propio usuario, así que Supabase aplica las
//    políticas RLS: un columnista solo puede crear y editar SUS notas
//    (author_id = su uid); un administrador, cualquiera.
//  · El cuerpo se guarda en texto plano (párrafos separados por una línea en
//    blanco), exactamente como lo hace el formulario del panel; la web y la
//    app ya saben mostrarlo.

export const POR_PAGINA_MIS_NOTAS = 20
const MAX_TITULO = 180
const MAX_BAJADA = 400
const MAX_CUERPO = 60_000
const PALABRAS_POR_MINUTO = 200
const BUCKET = 'article-images'
const CARPETA = 'app'
const ANCHO_MAX_FOTO = 1600
const MAX_BYTES_FOTO = 12 * 1024 * 1024

export type ResultadoPublicar<T> = { ok: true; datos: T } | { ok: false; error: string; estado: number }

export function puedePublicar(sesion: SesionApp | null): sesion is SesionApp {
  return !!sesion && (sesion.rol === 'admin' || sesion.rol === 'columnista')
}

// Misma regla que generateSlug en app/admin/actions.ts.
function generarSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

function minutosDeLectura(cuerpo: string): number {
  const palabras = cuerpo.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(palabras / PALABRAS_POR_MINUTO))
}

function validar(p: Partial<PeticionGuardarNota>): { ok: true; datos: PeticionGuardarNota } | { ok: false; error: string } {
  const titulo = String(p.titulo ?? '').trim()
  const bajada = String(p.bajada ?? '').trim()
  const cuerpo = String(p.cuerpo ?? '').replace(/\r\n/g, '\n').trim()
  const seccion = String(p.seccion ?? '')
  const imagen = typeof p.imagen === 'string' && p.imagen.trim() ? p.imagen.trim() : null
  if (titulo.length < 5) return { ok: false, error: 'El titular debe tener al menos 5 caracteres.' }
  if (titulo.length > MAX_TITULO) return { ok: false, error: `El titular no puede pasar de ${MAX_TITULO} caracteres.` }
  if (bajada.length > MAX_BAJADA) return { ok: false, error: `La bajada no puede pasar de ${MAX_BAJADA} caracteres.` }
  if (cuerpo.length > MAX_CUERPO) return { ok: false, error: 'El cuerpo es demasiado largo.' }
  if (!categories.some((c) => c.slug === seccion)) return { ok: false, error: 'Elige una sección válida.' }
  if (p.publicar && cuerpo.length < 50) return { ok: false, error: 'Para publicar, el cuerpo debe tener al menos 50 caracteres.' }
  if (imagen && !/^https:\/\//i.test(imagen)) return { ok: false, error: 'La foto debe ser una URL https.' }
  return {
    ok: true,
    datos: {
      titulo,
      bajada,
      cuerpo,
      seccion: seccion as SlugSeccion,
      imagen,
      publicar: !!p.publicar,
      autor: typeof p.autor === 'string' ? p.autor.trim() : undefined,
    },
  }
}

function aMiNotaResumen(fila: FilaResumen & Pick<DbArticle, 'is_published' | 'updated_at'>): MiNotaResumen {
  return { ...aNotaResumen(fila), publicada: fila.is_published, actualizadaEn: fila.updated_at }
}

function refrescarCaches(seccion: string, slug: string) {
  try {
    revalidatePath('/')
    revalidatePath(`/categoria/${seccion}`)
    revalidatePath(`/articulo/${slug}`)
    revalidateTag(TAG_PORTADA, 'max')
    revalidateTag(TAG_NOTAS, 'max')
  } catch {
    /* la caché caduca sola en un minuto */
  }
}

// ---- Listar y leer ----

export async function listarMisNotas(sesion: SesionApp, token: string, pagina: number): Promise<PaginaMisNotas> {
  const supabase = clienteConToken(token)
  const desde = (pagina - 1) * POR_PAGINA_MIS_NOTAS
  const campos = 'id,slug,title,excerpt,category_slug,author_name,published_at,read_time,image_url,is_published,updated_at'
  const [{ data }, { count }] = await Promise.all([
    supabase
      .from('articles')
      .select(campos)
      .eq('author_id', sesion.userId)
      .order('updated_at', { ascending: false })
      .range(desde, desde + POR_PAGINA_MIS_NOTAS - 1),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('author_id', sesion.userId),
  ])
  const total = count ?? 0
  return {
    total,
    pagina,
    porPagina: POR_PAGINA_MIS_NOTAS,
    haySiguiente: desde + POR_PAGINA_MIS_NOTAS < total,
    notas: ((data ?? []) as (FilaResumen & Pick<DbArticle, 'is_published' | 'updated_at'>)[]).map(aMiNotaResumen),
  }
}

export async function leerMiNota(sesion: SesionApp, token: string, id: string): Promise<MiNotaEditable | null> {
  const { data } = await clienteConToken(token).from('articles').select('*').eq('id', id).maybeSingle()
  if (!data) return null
  const fila = data as DbArticle
  // Un columnista solo edita lo suyo (RLS ya lo impide; esto evita filtrar datos).
  if (sesion.rol !== 'admin' && fila.author_id !== sesion.userId) return null
  return {
    id: fila.id,
    slug: fila.slug,
    titulo: fila.title,
    bajada: fila.excerpt ?? '',
    cuerpo: fila.content ?? '',
    seccion: fila.category_slug as SlugSeccion,
    imagen: fila.image_url?.trim() || null,
    autor: fila.author_name,
    publicada: fila.is_published,
    publicadoEn: fila.published_at,
    minutosLectura: fila.read_time ?? 5,
  }
}

// ---- Crear y actualizar ----

export async function crearNota(sesion: SesionApp, token: string, cuerpoPeticion: unknown): Promise<ResultadoPublicar<MiNotaEditable>> {
  const v = validar((cuerpoPeticion ?? {}) as Partial<PeticionGuardarNota>)
  if (!v.ok) return { ok: false, error: v.error, estado: 400 }
  const p = v.datos
  const supabase = clienteConToken(token)
  const autor = sesion.rol === 'admin' && p.autor ? p.autor : sesion.nombre
  const base = generarSlug(p.titulo) || `nota-${Date.now()}`

  // Si el slug ya existe se añade un sufijo corto (23505 = clave duplicada).
  for (let intento = 0; intento < 3; intento++) {
    const slug = intento === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`
    const { data, error } = await supabase
      .from('articles')
      .insert({
        title: p.titulo,
        slug,
        excerpt: p.bajada,
        content: p.cuerpo,
        category_slug: p.seccion,
        image_url: p.imagen,
        author_name: autor,
        author_id: sesion.userId,
        read_time: minutosDeLectura(p.cuerpo),
        is_published: p.publicar,
        published_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    if (!error && data) {
      if (p.publicar) refrescarCaches(p.seccion, slug)
      const nota = await leerMiNota(sesion, token, (data as { id: string }).id)
      return nota ? { ok: true, datos: nota } : { ok: false, error: 'La nota se guardó pero no se pudo leer.', estado: 500 }
    }
    if (error?.code !== '23505') {
      console.error('[publicar] crear', error?.message)
      return { ok: false, error: error?.code === '42501' ? 'Tu cuenta no tiene permiso para publicar.' : 'No se pudo guardar la nota.', estado: error?.code === '42501' ? 403 : 500 }
    }
  }
  return { ok: false, error: 'No se pudo generar una dirección única para la nota.', estado: 500 }
}

export async function actualizarNota(sesion: SesionApp, token: string, id: string, cuerpoPeticion: unknown): Promise<ResultadoPublicar<MiNotaEditable>> {
  const actual = await leerMiNota(sesion, token, id)
  if (!actual) return { ok: false, error: 'Nota no encontrada.', estado: 404 }
  const v = validar((cuerpoPeticion ?? {}) as Partial<PeticionGuardarNota>)
  if (!v.ok) return { ok: false, error: v.error, estado: 400 }
  const p = v.datos
  const supabase = clienteConToken(token)

  const cambios: Record<string, unknown> = {
    title: p.titulo,
    excerpt: p.bajada,
    content: p.cuerpo,
    category_slug: p.seccion,
    image_url: p.imagen,
    read_time: minutosDeLectura(p.cuerpo),
    is_published: p.publicar,
  }
  if (sesion.rol === 'admin' && p.autor) cambios.author_name = p.autor
  // Al publicar por primera vez, la fecha pasa a ser la de publicación real.
  if (p.publicar && !actual.publicada) cambios.published_at = new Date().toISOString()

  const { error } = await supabase.from('articles').update(cambios).eq('id', id)
  if (error) {
    console.error('[publicar] actualizar', error.message)
    return { ok: false, error: 'No se pudo guardar la nota.', estado: 500 }
  }
  refrescarCaches(p.seccion, actual.slug)
  if (actual.seccion !== p.seccion) refrescarCaches(actual.seccion, actual.slug)
  const nota = await leerMiNota(sesion, token, id)
  return nota ? { ok: true, datos: nota } : { ok: false, error: 'La nota se guardó pero no se pudo leer.', estado: 500 }
}

export async function eliminarNota(sesion: SesionApp, token: string, id: string): Promise<ResultadoPublicar<null>> {
  const actual = await leerMiNota(sesion, token, id)
  if (!actual) return { ok: false, error: 'Nota no encontrada.', estado: 404 }
  const { error } = await clienteConToken(token).from('articles').delete().eq('id', id)
  if (error) {
    console.error('[publicar] eliminar', error.message)
    return { ok: false, error: 'No se pudo eliminar la nota.', estado: 500 }
  }
  refrescarCaches(actual.seccion, actual.slug)
  return { ok: true, datos: null }
}

// ---- Foto ----

// Se reduce en el servidor (máx. 1600 px, JPEG) antes de subirla: las fotos
// de celular pesan 3–8 MB y la web luego las sirve por /api/imagen.
export async function subirFoto(token: string, archivo: File): Promise<ResultadoPublicar<ImagenSubida>> {
  if (!archivo || archivo.size === 0) return { ok: false, error: 'No llegó ninguna foto.', estado: 400 }
  if (archivo.size > MAX_BYTES_FOTO) return { ok: false, error: 'La foto pesa más de 12 MB.', estado: 413 }
  try {
    const entrada = Buffer.from(await archivo.arrayBuffer())
    const { data: salida, info } = await sharp(entrada, { failOn: 'none' })
      .rotate()
      .resize({ width: ANCHO_MAX_FOTO, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer({ resolveWithObject: true })

    const ruta = `${CARPETA}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
    const supabase = clienteConToken(token)
    const { error } = await supabase.storage.from(BUCKET).upload(ruta, salida, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false })
    if (error) {
      console.error('[publicar] foto', error.message)
      return { ok: false, error: 'No se pudo subir la foto.', estado: 500 }
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(ruta)
    return { ok: true, datos: { url: data.publicUrl, ancho: info.width, alto: info.height } }
  } catch (e) {
    console.error('[publicar] foto', e)
    return { ok: false, error: 'La foto no se pudo procesar.', estado: 400 }
  }
}
