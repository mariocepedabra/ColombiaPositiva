"use client";

import { breakingNews } from "@/lib/data";

export default function BreakingTicker() {
  const items = [...breakingNews, ...breakingNews];

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
            {items.map((item, idx) => (
              <span key={idx} className="text-white font-sans text-xs px-8 whitespace-nowrap">
                {item}
                <span className="ml-8 text-white/40">◆</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
