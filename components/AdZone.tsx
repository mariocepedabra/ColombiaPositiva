import { type AdZoneSlug } from '@/lib/ads'
import { getActiveAdsByZone } from '@/lib/ads-server'
import AdCarousel from './AdCarousel'

// Renderiza los anuncios activos de una zona. Si no hay, no renderiza nada
// (sin huecos en el layout). Varios anuncios → carrusel cada 10s con flechas.
export default async function AdZone({ slot }: { slot: AdZoneSlug }) {
  const ads = await getActiveAdsByZone(slot)
  if (ads.length === 0) return null
  return <AdCarousel ads={ads} />
}
