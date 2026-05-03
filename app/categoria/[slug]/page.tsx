import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categories, getCategoryBySlug, getArticlesByCategory } from "@/lib/data";
import NewsCard from "@/components/NewsCard";

export async function generateStaticParams() {
  return categories.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata(props: PageProps<"/categoria/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: `Noticias positivas de ${category.name} en Colombia`,
  };
}

export default async function CategoryPage(props: PageProps<"/categoria/[slug]">) {
  const { slug } = await props.params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const articles = getArticlesByCategory(slug);
  const [lead, ...rest] = articles;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <span
          className="font-sans font-700 text-xs uppercase tracking-widest"
          style={{ color: category.color }}
        >
          Sección
        </span>
        <h1 className="font-heading font-900 text-4xl md:text-5xl text-tinta mt-1 mb-3">
          {category.name}
        </h1>
        <div className="h-0.5 w-full" style={{ backgroundColor: category.color }} />
      </div>

      {articles.length === 0 ? (
        <p className="text-gris-400 font-sans py-20 text-center">
          Próximamente más noticias en esta sección.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lead article */}
          {lead && (
            <div className="lg:col-span-1">
              <NewsCard article={lead} variant="vertical" />
            </div>
          )}
          {/* Rest as horizontal */}
          <div className="lg:col-span-2 border-l border-gris-200 pl-8">
            {rest.map((article) => (
              <NewsCard key={article.id} article={article} variant="horizontal" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
