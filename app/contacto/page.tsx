import type { Metadata } from 'next'
import Link from 'next/link'
import { CONTACT_EMAIL } from '@/lib/site'

// Página de contacto. Las tiendas exigen una URL pública de contacto para la
// app. El correo se muestra solo si está configurado en Vercel (CONTACT_EMAIL).

export const metadata: Metadata = {
  title: 'Contacto — Colombia Positiva',
  description: 'Escríbenos: envía tu Nota Positiva, pauta con nosotros o síguenos en redes.',
}

const REDES = [
  { nombre: 'Facebook', href: 'https://www.facebook.com/profile.php?id=100066399406261' },
  { nombre: 'Instagram', href: 'https://www.instagram.com/colombiapositiva10/' },
  { nombre: 'TikTok', href: 'https://www.tiktok.com/@colombia.positiva' },
]

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gris-200 p-6">
      <h2 className="font-heading font-700 text-xl text-tinta mb-2">{titulo}</h2>
      <div className="font-sans text-sm text-gris-600 leading-relaxed">{children}</div>
    </div>
  )
}

export default function ContactoPage() {
  const correo = CONTACT_EMAIL

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <span className="font-sans text-xs font-700 uppercase tracking-widest text-verde">✦ Contacto</span>
          <h1 className="font-heading font-900 text-4xl md:text-5xl text-tinta mt-2 mb-4 leading-tight">
            Hablemos
          </h1>
          <div className="w-16 h-0.5 bg-verde mx-auto mb-5" />
          <p className="font-sans text-base text-gris-600 leading-relaxed">
            Colombia Positiva es el periódico de las buenas noticias de Colombia. Estas son las
            formas de llegar a nosotros.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {correo && (
            <Tarjeta titulo="Correo electrónico">
              <p>
                Para preguntas, correcciones, derechos sobre tus datos o eliminar tu cuenta:
                <br />
                <a href={`mailto:${correo}`} className="font-700 text-verde underline">{correo}</a>
              </p>
            </Tarjeta>
          )}

          <Tarjeta titulo="Envía tu Nota Positiva">
            <p className="mb-3">¿Conoces una historia que merece contarse? Cuéntanosla con foto o video.</p>
            <Link href="/nota-positiva" className="inline-block font-sans text-xs font-700 uppercase tracking-wider bg-verde text-white px-4 py-2 hover:bg-verde-oscuro transition-colors">
              Enviar una Nota Positiva →
            </Link>
          </Tarjeta>

          <Tarjeta titulo="Pauta con nosotros">
            <p className="mb-3">Anuncia tu marca o tu causa en el periódico de las buenas noticias.</p>
            <Link href="/pauta" className="inline-block font-sans text-xs font-700 uppercase tracking-wider bg-verde text-white px-4 py-2 hover:bg-verde-oscuro transition-colors">
              Pauta Positiva →
            </Link>
          </Tarjeta>

          <Tarjeta titulo="Redes sociales">
            <ul className="space-y-1.5">
              {REDES.map((r) => (
                <li key={r.nombre}>
                  <a href={r.href} target="_blank" rel="noopener noreferrer" className="text-verde underline">
                    {r.nombre}
                  </a>
                </li>
              ))}
            </ul>
          </Tarjeta>

          <Tarjeta titulo="Tu cuenta y tus datos">
            <p>
              Puedes eliminar tu cuenta desde la app (Mi cuenta → Eliminar mi cuenta) o pidiéndolo por
              cualquiera de estos canales. Lee nuestra{' '}
              <Link href="/privacidad" className="text-verde underline">política de privacidad</Link>.
            </p>
          </Tarjeta>
        </div>
      </div>
    </div>
  )
}
