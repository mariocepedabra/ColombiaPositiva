import type { Metadata } from 'next'
import Link from 'next/link'
import { CONTACT_EMAIL } from '@/lib/site'

// Política de privacidad y términos de uso de la web y de la app móvil.
// Las tiendas (Apple y Google) exigen esta URL pública. El texto lo revisa
// Mario; lo que describe es exactamente lo que hacen la web y la app hoy.

export const metadata: Metadata = {
  title: 'Política de privacidad — Colombia Positiva',
  description: 'Qué datos tratan la web y la app de Colombia Positiva, para qué, y cómo ejercer tus derechos.',
}

const ACTUALIZADA = '21 de septiembre de 2026'

function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-heading font-700 text-2xl text-tinta mt-10 mb-3 scroll-mt-24">
      {children}
    </h2>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="font-sans text-base text-gris-600 leading-relaxed mb-4">{children}</p>
}

export default function PrivacidadPage() {
  const correo = CONTACT_EMAIL

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <article className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <span className="font-sans text-xs font-700 uppercase tracking-widest text-verde">✦ Legal</span>
          <h1 className="font-heading font-900 text-4xl md:text-5xl text-tinta mt-2 mb-4 leading-tight">
            Política de privacidad
          </h1>
          <div className="w-16 h-0.5 bg-verde mx-auto mb-5" />
          <p className="font-sans text-sm text-gris-400">Última actualización: {ACTUALIZADA}</p>
        </div>

        <P>
          Colombia Positiva es un periódico digital de noticias positivas de Colombia. Esta política
          explica qué información tratan nuestro sitio web (colombiapositiva.com) y nuestra aplicación
          móvil para iOS y Android, con qué fin y cómo puedes ejercer tus derechos. Es deliberadamente
          breve: tratamos muy pocos datos.
        </P>

        <H2>1. Leer no requiere cuenta</H2>
        <P>
          Puedes leer todas las notas, ver los videos y usar el buscador sin registrarte. En ese caso no
          recogemos ningún dato que te identifique.
        </P>

        <H2>2. Cuenta de usuario</H2>
        <P>
          Si creas una cuenta (en la web), guardamos tu correo electrónico, una contraseña cifrada y,
          si lo indicas, tu nombre. Los usamos solo para reconocerte cuando inicias sesión y para
          asociar tu suscripción o tus solicitudes de pauta. La cuenta se aloja en Supabase, nuestro
          proveedor de base de datos, en servidores de Estados Unidos.
        </P>
        <P>
          <strong>Eliminar tu cuenta:</strong> en la app, en <em>Mi cuenta → Eliminar mi cuenta</em>;
          o escribiéndonos (ver contacto). La eliminación borra tu usuario, tu perfil y tus
          suscripciones. Las solicitudes de pauta se conservan como registro comercial, sin vincularlas
          a una cuenta.
        </P>

        <H2>3. Suscripción y pagos</H2>
        <P>
          La suscripción se contrata únicamente en la web. Los pagos los procesa una pasarela externa
          (Wompi); nunca vemos ni almacenamos los datos de tu tarjeta. La app móvil no vende nada ni
          contiene compras dentro de la aplicación.
        </P>

        <H2>4. Estadística anónima de lectura</H2>
        <P>
          Para saber qué secciones se leen más y en qué ciudades —información que usamos para
          vender publicidad por alcance—, la web y la app registran eventos de lectura que
          <strong> no identifican a nadie</strong>: qué nota o sección se abrió, la plataforma (web,
          iOS o Android), la hora, y un código de sesión aleatorio que se renueva cada día. No se
          envía tu usuario aunque hayas iniciado sesión, ni identificadores de tu teléfono, ni nada de
          lo que escribes. El servidor recorta la dirección IP y solo deduce la ciudad aproximada.
          Estos datos no se venden ni se comparten con terceros; los anunciantes solo ven cifras
          agregadas (por ejemplo, «lectores de Deporte en Pasto esta semana»).
        </P>

        <H2>5. Datos que se quedan en tu teléfono</H2>
        <P>
          La app guarda en tu dispositivo, y solo ahí, tus preferencias (tema claro u oscuro, tamaño
          de letra), las notas que marcas para leer después, tus búsquedas recientes y una caché de
          imágenes. Puedes borrarlos desde <em>Ajustes → Datos guardados en el teléfono</em> o
          desinstalando la app.
        </P>

        <H2>6. Notificaciones</H2>
        <P>
          Si aceptas recibir notificaciones, el sistema nos entrega un identificador técnico del
          dispositivo (token) que usamos únicamente para avisarte de nuevas notas. Puedes desactivarlas
          en cualquier momento desde los ajustes de tu teléfono.
        </P>

        <H2>7. Publicidad</H2>
        <P>
          La publicidad que ves está contratada directamente por los anunciantes con Colombia
          Positiva y se identifica con la etiqueta «Publicidad». No usamos redes publicitarias
          externas ni perfiles de comportamiento. Contamos impresiones y clics de forma agregada, sin
          identificar a las personas.
        </P>

        <H2>8. Contenido incrustado</H2>
        <P>
          Algunos videos provienen de Instagram, Facebook y TikTok y se muestran mediante los
          reproductores de esas plataformas, que pueden aplicar sus propias políticas de privacidad
          cuando los reproduces.
        </P>

        <H2>9. Menores de edad</H2>
        <P>
          Nuestro contenido es apto para todo público. No pedimos datos a menores de 14 años; si
          un menor creó una cuenta, escríbenos y la eliminaremos.
        </P>

        <H2>10. Tus derechos</H2>
        <P>
          Conforme a la Ley 1581 de 2012 de Colombia y normas afines, puedes conocer, actualizar,
          rectificar y suprimir tus datos, y revocar la autorización para su tratamiento. Basta con
          escribirnos por los canales de la <Link href="/contacto" className="text-verde underline">página de contacto</Link>
          {correo ? <> o al correo <a href={`mailto:${correo}`} className="text-verde underline">{correo}</a></> : null}.
        </P>

        <H2>11. Cambios en esta política</H2>
        <P>
          Si cambia algo relevante, actualizaremos la fecha de esta página y lo avisaremos en la web
          y en la app.
        </P>

        <H2 id="terminos">Términos de uso</H2>
        <P>
          Los textos, fotografías y videos publicados en Colombia Positiva son propiedad del medio o
          de sus autores y se publican para su lectura personal. Puedes compartir los enlaces
          libremente. La reproducción del contenido requiere autorización; las notas sindicadas desde
          Página 10 conservan el crédito y el enlace a su fuente. Las cuentas de suscriptor son
          personales e intransferibles. Nos reservamos el derecho de retirar contenido o cerrar
          cuentas que hagan un uso abusivo del servicio.
        </P>
      </article>
    </div>
  )
}
