import { ImageResponse } from 'next/og'
import { getArticleBySlug } from '@/lib/articles'
import { getCategoryBySlug } from '@/lib/data'

// Genera una imagen-tarjeta (1200×630) con los componentes de la nota:
// imagen, categoría, titular, resumen y marca. Se usa como vista previa
// enriquecida (Open Graph) y como imagen para compartir en un estado.

export const contentType = 'image/png'
const WIDTH = 1200
const HEIGHT = 630
const VERDE = '#013262'
const ORO = '#efbe05'

function truncate(text: string, max: number): string {
  const t = (text ?? '').trim()
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t
}

// El User-Agent de WhatsApp contiene "WhatsApp" tanto en móvil como en Web.
// Se evita cachear en CDN para que cada cliente reciba su variante correcta.
const NO_CDN_CACHE = {
  'Cache-Control': 'public, max-age=0, must-revalidate',
  Vary: 'User-Agent',
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  // WhatsApp descarga esta imagen al generar la vista previa del enlace.
  // Para WhatsApp se entrega la imagen original de la nota (sin tarjeta);
  // el resto de plataformas sigue recibiendo la imagen-tarjeta.
  // Se redirige a la versión optimizada (/_next/image) porque WhatsApp
  // descarta vistas previas con imágenes de más de ~600 KB.
  const userAgent = req.headers.get('user-agent') ?? ''
  if (article?.imageUrl && /whatsapp/i.test(userAgent)) {
    const origin = new URL(req.url).origin
    const optimized = `${origin}/_next/image?url=${encodeURIComponent(article.imageUrl)}&w=640&q=75`
    return new Response(null, {
      status: 302,
      headers: { Location: optimized, ...NO_CDN_CACHE },
    })
  }

  if (!article) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', background: VERDE, color: '#fff', fontSize: 64 }}>
          Colombia Positiva
        </div>
      ),
      { width: WIDTH, height: HEIGHT, headers: NO_CDN_CACHE }
    )
  }

  const category = getCategoryBySlug(article.category)
  const title = truncate(article.title, 95)
  const excerpt = truncate(article.excerpt, 150)

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#ffffff' }}>
        {/* Imagen de la nota */}
        <div style={{ display: 'flex', width: 500, height: HEIGHT }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.imageUrl} width={500} height={HEIGHT} style={{ objectFit: 'cover', width: 500, height: HEIGHT }} alt="" />
        </div>

        {/* Panel de texto */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: HEIGHT, padding: 56, justifyContent: 'space-between' }}>
          {/* Marca */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', width: 22, height: 22, background: ORO, marginRight: 14 }} />
            <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, color: VERDE, letterSpacing: 2 }}>
              COLOMBIA POSITIVA
            </div>
          </div>

          {/* Categoría + titular + resumen */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 22, fontWeight: 700, color: VERDE, letterSpacing: 2, marginBottom: 16 }}>
              {(category?.name ?? 'Noticias').toUpperCase()}
            </div>
            <div style={{ display: 'flex', fontSize: 46, fontWeight: 800, color: '#1c1c1c', lineHeight: 1.15 }}>
              {title}
            </div>
            <div style={{ display: 'flex', fontSize: 25, color: '#555555', lineHeight: 1.35, marginTop: 20 }}>
              {excerpt}
            </div>
          </div>

          {/* Pie */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '2px solid #e8e8e4', paddingTop: 18 }}>
            <div style={{ display: 'flex', fontSize: 20, color: VERDE, fontWeight: 700 }}>colombiapositiva.com</div>
            <div style={{ display: 'flex', fontSize: 20, color: '#9a9a90' }}>{truncate(article.author, 32)}</div>
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT, headers: NO_CDN_CACHE }
  )
}
