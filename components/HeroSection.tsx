import Link from 'next/link'
import Image from 'next/image'
import { Article, categories, formatDate } from '@/lib/data'

type Props = {
  articles: Article[]
}

export default function HeroSection({ articles }: Props) {
  const [main, second, third, fourth] = articles

  if (!main) return null

  const mainCat = categories.find((c) => c.slug === main.category)
  const secondCat = second ? categories.find((c) => c.slug === second.category) : null
  const thirdCat = third ? categories.find((c) => c.slug === third.category) : null
  const fourthCat = fourth ? categories.find((c) => c.slug === fourth.category) : null

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      {/* Section label */}
      <div className="ornament text-xs tracking-widest uppercase mb-5 font-sans">
        <span>Noticias Principales</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-gris-200">
        {/* LEFT: artículos secundarios apilados */}
        <div className="hidden lg:flex lg:col-span-3 flex-col border-r border-gris-200">
          {second && (
            <article className="group flex-1 p-4 border-b border-gris-200 flex flex-col">
              <div className="relative overflow-hidden mb-3" style={{ height: 140 }}>
                <Image
                  src={second.imageUrl}
                  alt={second.title}
                  fill
                  sizes="300px"
                  className="object-cover group-hover:opacity-90 transition-opacity"
                />
              </div>
              {secondCat && (
                <span className="text-xs font-sans font-700 uppercase tracking-widest mb-1" style={{ color: secondCat.color }}>
                  {secondCat.name}
                </span>
              )}
              <Link href={`/articulo/${second.slug}`}>
                <h3 className="font-heading font-700 text-tinta text-sm leading-snug line-clamp-4 group-hover:text-verde transition-colors">
                  {second.title}
                </h3>
              </Link>
              <p className="text-xs text-gris-400 font-sans mt-auto pt-2">{second.author}</p>
            </article>
          )}
          {third && (
            <article className="group flex-1 p-4 flex flex-col">
              <div className="relative overflow-hidden mb-3" style={{ height: 140 }}>
                <Image
                  src={third.imageUrl}
                  alt={third.title}
                  fill
                  sizes="300px"
                  className="object-cover group-hover:opacity-90 transition-opacity"
                />
              </div>
              {thirdCat && (
                <span className="text-xs font-sans font-700 uppercase tracking-widest mb-1" style={{ color: thirdCat.color }}>
                  {thirdCat.name}
                </span>
              )}
              <Link href={`/articulo/${third.slug}`}>
                <h3 className="font-heading font-700 text-tinta text-sm leading-snug line-clamp-4 group-hover:text-verde transition-colors">
                  {third.title}
                </h3>
              </Link>
              <p className="text-xs text-gris-400 font-sans mt-auto pt-2">{third.author}</p>
            </article>
          )}
        </div>

        {/* CENTER: artículo principal */}
        <article className="lg:col-span-6 border-b lg:border-b-0 lg:border-r border-gris-200 flex flex-col">
          <Link href={`/articulo/${main.slug}`} className="group relative overflow-hidden block" style={{ height: 340 }}>
            <Image
              src={main.imageUrl}
              alt={main.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover group-hover:opacity-90 transition-opacity"
              priority
            />
          </Link>
          <div className="p-5 flex-1 flex flex-col">
            {mainCat && (
              <span className="text-xs font-sans font-700 uppercase tracking-widest mb-2" style={{ color: mainCat.color }}>
                {mainCat.name}
              </span>
            )}
            <Link href={`/articulo/${main.slug}`} className="group flex-1">
              <h2 className="font-heading font-900 text-tinta text-2xl md:text-3xl leading-tight mb-3 group-hover:text-verde transition-colors line-clamp-3">
                {main.title}
              </h2>
            </Link>
            <p className="font-sans text-gris-600 text-sm leading-relaxed line-clamp-2 mb-4">
              {main.excerpt}
            </p>
            <div className="border-t border-gris-200 pt-3 flex items-center justify-between">
              <span className="font-sans text-xs text-gris-600 font-600">{main.author}</span>
              <span className="font-sans text-xs text-gris-400">{formatDate(main.publishedAt)}</span>
            </div>
          </div>
        </article>

        {/* RIGHT: cuarto artículo + suscripción */}
        <div className="hidden lg:flex lg:col-span-3 flex-col">
          {fourth && (
            <article className="group flex-1 p-4 border-b border-gris-200 flex flex-col">
              <div className="relative overflow-hidden mb-3" style={{ height: 140 }}>
                <Image
                  src={fourth.imageUrl}
                  alt={fourth.title}
                  fill
                  sizes="300px"
                  className="object-cover group-hover:opacity-90 transition-opacity"
                />
              </div>
              {fourthCat && (
                <span className="text-xs font-sans font-700 uppercase tracking-widest mb-1" style={{ color: fourthCat.color }}>
                  {fourthCat.name}
                </span>
              )}
              <Link href={`/articulo/${fourth.slug}`}>
                <h3 className="font-heading font-700 text-tinta text-sm leading-snug line-clamp-4 group-hover:text-verde transition-colors">
                  {fourth.title}
                </h3>
              </Link>
              <p className="text-xs text-gris-400 font-sans mt-auto pt-2">{fourth.author}</p>
            </article>
          )}
          {/* Widget suscripción */}
          <div className="p-4 bg-gris-100 flex-1 flex flex-col justify-center">
            <p className="font-heading italic text-tinta text-sm leading-relaxed mb-3">
              "Porque Colombia tiene mucho de qué estar orgullosa."
            </p>
            <div className="border-t border-gris-300 pt-3">
              <p className="font-sans text-xs text-gris-600 mb-2">
                Recibe lo mejor cada mañana en tu correo.
              </p>
              <input
                type="email"
                placeholder="tu@correo.com"
                className="w-full border border-gris-300 bg-white px-3 py-1.5 text-xs font-sans mb-2 focus:outline-none focus:border-verde"
              />
              <button className="w-full bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs py-2 tracking-wider uppercase transition-colors">
                Suscribirse
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
