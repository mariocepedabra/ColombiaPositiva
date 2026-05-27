import { Metadata } from 'next'
import BreakingTicker from '@/components/BreakingTicker'
import HeroSection from '@/components/HeroSection'
import CategorySection from '@/components/CategorySection'
import { categories, breakingNewsFallback } from '@/lib/data'
import { getRecentArticles, getArticlesByCategory } from '@/lib/articles'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Solo Noticias Positivas',
}

export default async function HomePage() {
  const [recentArticles, ...categoryArticles] = await Promise.all([
    getRecentArticles(5),
    ...categories.map((cat) => getArticlesByCategory(cat.slug, 4)),
  ])

  const tickerItems =
    recentArticles.length > 0
      ? recentArticles.map((a) => ({ title: a.title, slug: a.slug }))
      : breakingNewsFallback.map((title) => ({ title, slug: null }))

  return (
    <>
      <BreakingTicker items={tickerItems} />
      <HeroSection articles={recentArticles} />

      {/* Divisor ornamental */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 border-t border-gris-200" />
          <span className="text-gris-300 text-xs tracking-widest uppercase font-sans">◆ ◆ ◆</span>
          <div className="flex-1 border-t border-gris-200" />
        </div>
      </div>

      {categories.map((category, idx) => {
        const articles = categoryArticles[idx] ?? []
        return (
          <div key={category.slug}>
            <CategorySection category={category} articles={articles} />
            {idx < categories.length - 1 && (
              <div className="max-w-7xl mx-auto px-4">
                <div className="border-t border-gris-200" />
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
