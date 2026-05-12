import type { Metadata } from 'next'
import NotaPositivaForm from '@/components/NotaPositivaForm'

export const metadata: Metadata = {
  title: 'Nota Positiva — Colombia Positiva',
  description: '¿Tienes una buena noticia? Compártela con Colombia Positiva y la llevaremos a todo el país.',
}

export default function NotaPositivaPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-10">
          <span className="font-sans text-xs font-700 uppercase tracking-widest text-verde">
            ✦ Sección especial
          </span>
          <h1 className="font-heading font-900 text-4xl md:text-5xl text-tinta mt-2 mb-4 leading-tight">
            Nota Positiva
          </h1>
          <div className="w-16 h-0.5 bg-verde mx-auto mb-5" />
          <p className="font-heading italic text-gris-600 text-lg md:text-xl leading-relaxed">
            ¿Tienes una historia que inspire, una buena noticia o un acto de bondad
            que merece ser conocido? Cuéntanosla.
          </p>
          <p className="font-sans text-sm text-gris-600 mt-4 leading-relaxed">
            Colombia está llena de personas extraordinarias haciendo cosas increíbles.
            Ayúdanos a encontrarlas y compartirlas con todo el país.
          </p>
        </div>

        {/* Separador ornamental */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 border-t border-gris-200" />
          <span className="font-sans text-xs text-gris-300 tracking-widest">◆</span>
          <div className="flex-1 border-t border-gris-200" />
        </div>

        {/* Formulario */}
        <div className="bg-white border border-gris-200 p-6 md:p-8">
          <NotaPositivaForm />
        </div>

        {/* Nota al pie */}
        <div className="mt-8 bg-papel border border-gris-200 p-5 flex gap-4">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="font-sans font-700 text-xs uppercase tracking-wider text-tinta mb-1">
              Tu privacidad nos importa
            </p>
            <p className="font-sans text-xs text-gris-600 leading-relaxed">
              Tu información personal solo será usada para contactarte si publicamos tu historia.
              Nunca la compartiremos con terceros ni será visible públicamente en el sitio.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
