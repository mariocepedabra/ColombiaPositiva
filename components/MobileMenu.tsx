"use client";

import { useState } from "react";
import Link from "next/link";
import { categories } from "@/lib/data";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden absolute right-4 top-1/2 -translate-y-1/2">
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        className="p-2 hover:bg-gris-100 transition-colors"
      >
        {open ? (
          <svg className="w-5 h-5 text-tinta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-tinta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)}>
          <nav
            className="absolute top-0 left-0 h-full w-72 bg-papel border-r border-gris-200 flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b-2 border-tinta flex items-center justify-between">
              <span className="font-heading font-700 text-xl text-tinta">Secciones</span>
              <button onClick={() => setOpen(false)} className="p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto">
              <li className="border-b border-gris-200">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="block px-5 py-3.5 text-sm font-sans font-600 tracking-wider uppercase text-tinta hover:bg-gris-100"
                >
                  Portada
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.slug} className="border-b border-gris-200">
                  <Link
                    href={`/categoria/${cat.slug}`}
                    onClick={() => setOpen(false)}
                    className="block px-5 py-3.5 text-sm font-sans font-600 tracking-wider uppercase hover:bg-gris-100"
                    style={{ color: cat.color }}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
