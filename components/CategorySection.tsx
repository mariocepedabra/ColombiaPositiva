import Link from "next/link";
import { Category, Article } from "@/lib/data";
import NewsCard from "./NewsCard";

type Props = {
  category: Category;
  articles: Article[];
};

export default function CategorySection({ category, articles }: Props) {
  if (articles.length === 0) return null;

  const [lead, ...rest] = articles;

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-1">
        <h2
          className="font-sans font-700 text-xs uppercase tracking-widest"
          style={{ color: category.color }}
        >
          {category.name}
        </h2>
        <Link
          href={`/categoria/${category.slug}`}
          className="font-sans text-xs text-gris-400 hover:text-verde transition-colors uppercase tracking-wider"
        >
          Ver todo →
        </Link>
      </div>

      {/* Strong rule */}
      <div className="h-0.5 w-full mb-4" style={{ backgroundColor: category.color }} />

      {/* Layout: lead left + 3 horizontals right */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Lead article */}
        <div className="lg:col-span-1">
          <NewsCard article={lead} variant="vertical" />
        </div>

        {/* Rest as horizontal list */}
        <div className="md:col-span-1 lg:col-span-2 border-l border-gris-200 pl-6">
          {rest.slice(0, 3).map((article) => (
            <NewsCard key={article.id} article={article} variant="horizontal" />
          ))}
        </div>
      </div>
    </section>
  );
}
