'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Article, categories, formatDate } from '@/lib/data'

type Props = {
  articles: Article[]
}

const ROTATE_MS = 10_000

function SideArticle({ article, withBorder }: { article: Article; withBorder: boolean }) {
  const cat = categories.find((c) => c.slug === article.category)
  return (
    <article className={`group flex-1 p-4 flex flex-col ${withBorder ? 'border-b border-gris-200' : ''}`}>
      <div className="relative overflow-hidden mb-3" style={{ height: 140 }}>
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          sizes="300px"
          className="object-cover group-hover:opacity-90 transition-opacity"
        />
      </div>
      {cat && (
        <span className="text-xs font-sans font-700 uppercase tracking-widest mb-1" style={{ color: cat.color }}>
          {cat.name}
        </span>
      )}
      <Link href={`/articulo/${article.slug}`}>
        <h3 className="font-heading font-700 text-tinta text-sm leading-snug line-clamp-4 group-hover:text-verde transition-colors">
          {article.title}
        </h3>
      </Link>
      <p className="text-xs text-gris-400 font-sans mt-auto pt-2">{article.author}</p>
    </article>
  )
}

function MainArticle({ article, isFirst }: { article: Article; isFirst: boolean }) {
  const cat = categories.find((c) => c.slug === article.category)
  return (
    <>
      <Link href={`/articulo/${article.slug}`} className="group relative overflow-hidden block" style={{ height: 340 }}>
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover group-hover:opacity-90 transition-opacity"
          priority={isFirst}
        />
      </Link>
      <div className="p-5 flex-1 flex flex-col">
        {cat && (
          <span className="text-xs font-sans font-700 uppercase tracking-widest mb-2" style={{ color: cat.color }}>
            {cat.name}
          </span>
        )}
        <Link href={`/articulo/${article.slug}`} className="group flex-1">
          <h2 className="font-heading font-900 text-tinta text-2xl md:text-3xl leading-tight mb-3 group-hover:text-verde transition-colors line-clamp-3">
            {article.title}
          </h2>
        </Link>
        <p className="font-sans text-gris-600 text-sm leading-relaxed line-clamp-2 mb-4">
          {article.excerpt}
        </p>
        <div className="border-t border-gris-200 pt-3 flex items-center justify-between">
          <span className="font-sans text-xs text-gris-600 font-600">{article.author}</span>
          <span className="font-sans text-xs text-gris-400">{formatDate(article.publishedAt)}</span>
        </div>
      </div>
    </>
  )
}

export default function HeroSection({ articles }: Props) {
  // Centro: el carrusel rota entre las últimas 10 noticias
  const centerArticles = articles.slice(0, 10)
  const centerTotal = centerArticles.length

  // Lados: estáticos, fijos con las últimas 4 noticias. NO forman parte del carrusel.
  const sideArticles = articles.slice(0, 4)
  const sideLeft1 = sideArticles[0]
  const sideLeft2 = sideArticles[1]
  const sideRight1 = sideArticles[2]
  const sideRight2 = sideArticles[3]

  const [mainIndex, setMainIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const inViewRef = useRef(true)

  // Pausar la rotación cuando la sección no está en pantalla o la pestaña está oculta
  useEffect(() => {
    const el = sectionRef.current
    if (!el || centerTotal < 2) return

    const observer = new IntersectionObserver(
      ([entry]) => { inViewRef.current = entry.isIntersecting },
      { threshold: 0.1 }
    )
    observer.observe(el)

    const onVisibility = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [centerTotal])

  // Rotación automática cada 10 s — solo afecta al artículo central
  useEffect(() => {
    if (centerTotal < 2 || paused) return
    const t = setTimeout(() => {
      if (inViewRef.current && !document.hidden) {
        setMainIndex((i) => (i + 1) % centerTotal)
      }
    }, ROTATE_MS)
    return () => clearTimeout(t)
  }, [mainIndex, centerTotal, paused])

  if (centerArticles.length === 0) return null

  const main = centerArticles[mainIndex]

  const prev = () => setMainIndex((i) => (i - 1 + centerTotal) % centerTotal)
  const next = () => setMainIndex((i) => (i + 1) % centerTotal)

  return (
    <section ref={sectionRef} className="max-w-7xl mx-auto px-4 py-6">
      {/* Section label */}
      <div className="ornament text-xs tracking-widest uppercase mb-5 font-sans">
        <span>Noticias Principales</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-gris-200 bg-papel">
        {/* LADO IZQUIERDO: estático, fuera del carrusel */}
        <div className="hidden lg:flex lg:col-span-3 flex-col border-r border-gris-200">
          {sideLeft1 && <SideArticle article={sideLeft1} withBorder={!!sideLeft2} />}
          {sideLeft2 && <SideArticle article={sideLeft2} withBorder={false} />}
        </div>

        {/* CENTRO: el ÚNICO carrusel — rota cada 10 s entre las 10 últimas notas */}
        <article className="lg:col-span-6 border-b lg:border-b-0 lg:border-r border-gris-200 flex flex-col relative">
          <div key={mainIndex} className="hero-fade-in flex flex-col flex-1">
            <MainArticle article={main} isFirst={mainIndex === 0} />
          </div>

          {/* Flechas de navegación — solo controlan el carrusel central */}
          {centerTotal > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Noticia anterior"
                className="absolute left-2 top-[160px] -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gris-200 shadow-md flex items-center justify-center hover:bg-verde hover:text-white hover:border-verde transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={next}
                aria-label="Siguiente noticia"
                className="absolute right-2 top-[160px] -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gris-200 shadow-md flex items-center justify-center hover:bg-verde hover:text-white hover:border-verde transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </article>

        {/* LADO DERECHO: estático, fuera del carrusel */}
        <div className="hidden lg:flex lg:col-span-3 flex-col">
          {sideRight1 && <SideArticle article={sideRight1} withBorder={!!sideRight2} />}
          {sideRight2 && <SideArticle article={sideRight2} withBorder={false} />}
        </div>
      </div>

      {/* Indicadores (dots) — solo para la nota central */}
      {centerTotal > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {centerArticles.map((_, i) => (
            <button
              key={i}
              onClick={() => setMainIndex(i)}
              aria-label={`Ir a la noticia ${i + 1}`}
              className={`transition-all rounded-full ${
                i === mainIndex ? 'w-6 h-2 bg-verde' : 'w-2 h-2 bg-gris-300 hover:bg-gris-400'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
