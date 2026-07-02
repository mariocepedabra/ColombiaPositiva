import type { Metadata } from 'next'
import PautaForm from '@/components/PautaForm'
import { getPublicSettings } from '@/lib/settings'
import { getPricing } from '@/lib/pricing'

export const metadata: Metadata = {
  title: 'Pauta con nosotros — Colombia Positiva',
  description: 'Anúnciate en Colombia Positiva. Completa el formulario y tu anuncio aparecerá en el periódico de las buenas noticias.',
}

export const dynamic = 'force-dynamic'

export default async function PautaPage() {
  const [settings, pricing] = await Promise.all([getPublicSettings(), getPricing()])

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-10">
          <span className="font-sans text-xs font-700 uppercase tracking-widest text-verde">
            ✦ Publicidad
          </span>
          <h1 className="font-heading font-900 text-4xl md:text-5xl text-tinta mt-2 mb-4 leading-tight">
            Pauta con nosotros
          </h1>
          <div className="w-16 h-0.5 bg-verde mx-auto mb-5" />
          <p className="font-sans text-base text-gris-600 leading-relaxed">
            Completa el formulario y tu anuncio aparecerá en <strong>Colombia Positiva</strong>.
            Sin contratos ni mensualidades.
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white border border-gris-200 p-6 md:p-8">
          <PautaForm
            maxImageMb={settings.adMaxImageMb}
            maxVideoMb={settings.adMaxVideoMb}
            gatewayConfigured={settings.gatewayConfigured}
            pricePerDay={pricing.adPerDay}
          />
        </div>
      </div>
    </div>
  )
}
