import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  articles,
  getArticleBySlug,
  getCategoryBySlug,
  getArticlesByCategory,
  formatDate,
} from "@/lib/data";
import NewsCard from "@/components/NewsCard";

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata(props: PageProps<"/articulo/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return { title: article.title, description: article.excerpt };
}

export default async function ArticlePage(props: PageProps<"/articulo/[slug]">) {
  const { slug } = await props.params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const category = getCategoryBySlug(article.category);
  const related = getArticlesByCategory(article.category)
    .filter((a) => a.slug !== slug)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Article */}
        <article className="lg:col-span-2">
          {/* Breadcrumb */}
          <nav className="text-xs font-sans text-gris-400 mb-4 flex items-center gap-2">
            <Link href="/" className="hover:text-verde transition-colors">Portada</Link>
            <span>/</span>
            {category && (
              <>
                <Link href={`/categoria/${category.slug}`} className="hover:text-verde transition-colors" style={{ color: category.color }}>
                  {category.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="line-clamp-1">{article.title}</span>
          </nav>

          {/* Category label */}
          {category && (
            <Link href={`/categoria/${category.slug}`}>
              <span className="font-sans font-700 text-xs uppercase tracking-widest" style={{ color: category.color }}>
                {category.name}
              </span>
            </Link>
          )}

          {/* Title */}
          <h1 className="font-heading font-900 text-3xl md:text-5xl text-tinta leading-tight mt-2 mb-4">
            {article.title}
          </h1>

          {/* Subtitle */}
          <p className="font-heading italic text-gris-600 text-lg md:text-xl leading-relaxed mb-5 border-l-4 pl-4" style={{ borderColor: category?.color ?? "#006039" }}>
            {article.excerpt}
          </p>

          {/* Rule */}
          <div className="border-t-2 border-tinta mb-4" />

          {/* Byline */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-gris-600 mb-5 pb-4 border-b border-gris-200">
            <span className="font-700 text-tinta">{article.author}</span>
            <span className="text-gris-300">·</span>
            <span>{formatDate(article.publishedAt)}</span>
            <span className="text-gris-300">·</span>
            <span>{article.readTime} minutos de lectura</span>
          </div>

          {/* Hero image */}
          <div className="relative mb-6 overflow-hidden" style={{ height: 380 }}>
            <Image
              src={`https://picsum.photos/seed/${article.imageId}/1100/700`}
              alt={article.title}
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
              priority
            />
          </div>

          {/* Body */}
          <div className="body-text">
            {article.content.split("\n\n").map((para, idx) => (
              <p key={idx} className="mb-5">
                {para}
              </p>
            ))}
          </div>

          {/* Tags / share */}
          <div className="mt-8 pt-5 border-t border-gris-200 flex flex-wrap items-center gap-3">
            <span className="font-sans text-xs font-700 uppercase tracking-wider text-gris-600">Compartir:</span>
            {[
              { label: "Facebook", bg: "#1877F2" },
              { label: "X / Twitter", bg: "#000" },
              { label: "WhatsApp", bg: "#25D366" },
            ].map((s) => (
              <button
                key={s.label}
                className="font-sans text-xs font-700 text-white px-4 py-1.5 uppercase tracking-wider hover:opacity-80 transition-opacity"
                style={{ backgroundColor: s.bg }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-6">
            {/* More in category */}
            <div className="mb-6">
              <span
                className="font-sans font-700 text-xs uppercase tracking-widest"
                style={{ color: category?.color }}
              >
                Más en {category?.name}
              </span>
              <div className="h-0.5 w-full mt-1 mb-3" style={{ backgroundColor: category?.color }} />
              {related.map((rel) => (
                <NewsCard key={rel.id} article={rel} variant="minimal" />
              ))}
            </div>

            {/* Newsletter */}
            <div className="bg-tinta p-5 text-white">
              <h3 className="font-heading font-700 text-lg text-white mb-1">
                Boletín matutino
              </h3>
              <div className="w-8 border-t border-verde mb-3" />
              <p className="font-sans text-white/60 text-sm leading-relaxed mb-3">
                Las mejores noticias positivas de Colombia cada mañana en tu correo.
              </p>
              <input
                type="email"
                placeholder="tu@correo.com"
                className="w-full bg-white/5 border border-white/20 px-3 py-2 text-sm text-white placeholder-white/30 mb-2 focus:outline-none focus:border-verde font-sans"
              />
              <button className="w-full bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs py-2.5 tracking-widest uppercase transition-colors">
                Suscribirse
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
