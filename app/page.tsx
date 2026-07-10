import { Metadata } from 'next'
import BreakingTicker from '@/components/BreakingTicker'
import VideoSection from '@/components/VideoSection'
import HeroSection from '@/components/HeroSection'
import CategorySection from '@/components/CategorySection'
import MostReadSection from '@/components/MostReadSection'
import AdZone from '@/components/AdZone'
import { categories, breakingNewsFallback } from '@/lib/data'
import { getRecentArticles, getArticlesByCategory } from '@/lib/articles'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Solo Noticias Positivas',
}

export default async function HomePage() {
  // Las últimas 10 notas rotan en el centro; las últimas 4 se fijan en los lados
  const [recentArticles, ...categoryArticles] = await Promise.all([
    getRecentArticles(10),
    ...categories.map((cat) => getArticlesByCategory(cat.slug, 4)),
  ])

  const tickerItems =
    recentArticles.length > 0
      ? recentArticles.slice(0, 5).map((a) => ({ title: a.title, slug: a.slug }))
      : breakingNewsFallback.map((title) => ({ title, slug: null }))

  return (
    <>
      <BreakingTicker items={tickerItems} />

      {/* Zona de anuncios: arriba de Noticias Principales */}
      <AdZone slot="noticias-top" />

      <HeroSection articles={recentArticles} />

      {/* Zona de anuncios: abajo de Noticias Principales */}
      <AdZone slot="noticias-bottom" />

      {/* Zona de anuncios: arriba de Las 10 más leídas */}
      <AdZone slot="masleidas-top" />

      {/* Las 10 historias más leídas */}
      <MostReadSection />

      {/* Zona de anuncios: abajo de Las 10 más leídas */}
      <AdZone slot="masleidas-bottom" />

      {/* Divisor ornamental */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 border-t border-gris-200" />
          <span className="text-gris-300 text-xs tracking-widest uppercase font-sans">◆ ◆ ◆</span>
          <div className="flex-1 border-t border-gris-200" />
        </div>
      </div>

      {/* Zona de anuncios: arriba de todas las secciones por categoría */}
      <AdZone slot="categorias-top" />

      {categories.map((category, idx) => {
        const articles = categoryArticles[idx] ?? []
        if (articles.length === 0) return null
        return (
          <div key={category.slug}>
            {/* Zona de anuncios: arriba de esta categoría */}
            <AdZone slot={`cat-${category.slug}-top`} />

            <CategorySection category={category} articles={articles} />

            {/* Zona de anuncios: abajo de esta categoría */}
            <AdZone slot={`cat-${category.slug}-bottom`} />

            {idx < categories.length - 1 && (
              <div className="max-w-7xl mx-auto px-4">
                <div className="border-t border-gris-200" />
              </div>
            )}
          </div>
        )
      })}

      {/* Zona de anuncios: abajo de todas las secciones por categoría */}
      <AdZone slot="categorias-bottom" />

      {/* Zona de anuncios: arriba de Historias de Colombia Positiva */}
      <AdZone slot="historias-top" />

      {/* Sección de videos — "Historias de Colombia Positiva" (ubicada de última, antes del footer) */}
      <VideoSection />

      {/* Zona de anuncios: abajo de Historias de Colombia Positiva */}
      <AdZone slot="historias-bottom" />

      {/* Zona de anuncios: pie de página (antes del footer global) */}
      <AdZone slot="footer" />
    </>
  )
}
