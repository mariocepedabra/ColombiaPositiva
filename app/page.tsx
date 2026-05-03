import { Metadata } from "next";
import BreakingTicker from "@/components/BreakingTicker";
import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import { categories, getArticlesByCategory } from "@/lib/data";

export const metadata: Metadata = {
  title: "Colombia Positiva — El periódico de las buenas noticias",
};

export default function HomePage() {
  return (
    <>
      <BreakingTicker />
      <HeroSection />

      {/* Ornamental divider */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 border-t border-gris-200" />
          <span className="text-gris-300 text-xs tracking-widest uppercase font-sans">◆ ◆ ◆</span>
          <div className="flex-1 border-t border-gris-200" />
        </div>
      </div>

      {categories.map((category, idx) => {
        const articles = getArticlesByCategory(category.slug);
        return (
          <div key={category.slug}>
            <CategorySection category={category} articles={articles} />
            {idx < categories.length - 1 && (
              <div className="max-w-7xl mx-auto px-4">
                <div className="border-t border-gris-200" />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
