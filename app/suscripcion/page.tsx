import type { Metadata } from 'next'
import PlanesSuscripcion from '@/components/PlanesSuscripcion'
import { createClient } from '@/lib/supabase/server'
import { getPublicSettings } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Suscríbete — Colombia Positiva',
  description: 'Suscríbete a Colombia Positiva y copia el texto de nuestras notas. Planes desde $10.000 COP.',
}

export const dynamic = 'force-dynamic'

export default async function SuscripcionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName = ''
  let alreadySubscribed = false
  if (user) {
    userName = user.email?.split('@')[0] ?? 'Usuario'
    try {
      const { data: rpcData } = await supabase.rpc('get_my_profile')
      if (Array.isArray(rpcData) && rpcData.length > 0) {
        const profile = rpcData[0] as { role: string; full_name: string }
        if (profile.full_name) userName = profile.full_name
        // admin/Mario ya pueden copiar
        if (profile.role === 'admin' || profile.full_name?.toLowerCase().includes('mario')) {
          alreadySubscribed = true
        }
      }
      const { data: hasSub } = await supabase.rpc('has_active_subscription')
      if (hasSub === true) alreadySubscribed = true
    } catch { /* noop */ }
  }

  const settings = await getPublicSettings()

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <span className="font-sans text-xs font-700 uppercase tracking-widest text-verde">✦ Suscripción</span>
          <h1 className="font-heading font-900 text-4xl md:text-5xl text-tinta mt-2 mb-4 leading-tight">
            Suscríbete y copia nuestras notas
          </h1>
          <div className="w-16 h-0.5 bg-verde mx-auto mb-5" />
          <p className="font-sans text-base text-gris-600 leading-relaxed max-w-xl mx-auto">
            Apoya el periodismo de las buenas noticias. Con tu suscripción podrás
            <strong> copiar el texto</strong> de todas las notas de Colombia Positiva.
          </p>
        </div>

        <PlanesSuscripcion
          loggedIn={!!user}
          userName={userName}
          alreadySubscribed={alreadySubscribed}
          gatewayConfigured={settings.gatewayConfigured}
        />

        <div className="mt-10 bg-papel border border-gris-200 p-5 flex gap-4 max-w-xl mx-auto">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="font-sans font-700 text-xs uppercase tracking-wider text-tinta mb-1">Pago seguro</p>
            <p className="font-sans text-xs text-gris-600 leading-relaxed">
              El pago se procesa a través de una pasarela segura. Tu suscripción se activa
              automáticamente al confirmarse el pago.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
