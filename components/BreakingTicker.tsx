'use client'

import Link from 'next/link'

export type TickerItem = {
  title: string
  slug: string | null
}

type Props = {
  items: TickerItem[]
}

export default function BreakingTicker({ items }: Props) {
  const doubled = [...items, ...items]

  return (
    <div className="bg-verde border-b border-verde-oscuro overflow-hidden">
      <div className="flex items-stretch">
        <div className="bg-verde-oscuro flex-shrink-0 flex items-center px-4 py-2">
          <span className="text-white font-sans font-700 text-xs tracking-widest uppercase whitespace-nowrap">
            Destacado
          </span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="ticker-track py-2">
            {doubled.map((item, idx) =>
              item.slug ? (
                <Link
                  key={idx}
                  href={`/articulo/${item.slug}`}
                  className="text-white font-sans text-xs px-8 whitespace-nowrap hover:text-[rgb(239,191,4)] transition-colors"
                >
                  {item.title}
                  <span className="ml-8 text-white/40">◆</span>
                </Link>
              ) : (
                <span key={idx} className="text-white font-sans text-xs px-8 whitespace-nowrap">
                  {item.title}
                  <span className="ml-8 text-white/40">◆</span>
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
