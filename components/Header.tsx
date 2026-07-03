import Link from 'next/link'
import Image from 'next/image'
import logoHeader from '@/public/logo-header.png'
import { categories } from '@/lib/data'
import MobileMenu from './MobileMenu'
import UserMenu from './UserMenu'
import AuthMenu from './AuthMenu'
import { createClient } from '@/lib/supabase/server'

export default async function Header() {
  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Consultar sesión activa
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userDisplay: { name: string; role: string } | null = null

  if (user) {
    // Intentar obtener nombre y rol del perfil via RPC
    let name = user.email?.split('@')[0] ?? 'Usuario'
    let role = (user.app_metadata as Record<string, string> | null)?.role ?? 'lector'

    try {
      const { data: rpcData } = await supabase.rpc('get_my_profile')
      if (Array.isArray(rpcData) && rpcData.length > 0) {
        const profile = rpcData[0] as { role: string; full_name: string }
        if (profile.full_name) name = profile.full_name
        if (profile.role) role = profile.role
      }
    } catch {
      // Usar app_metadata como fallback
    }

    userDisplay = { name, role }
  }

  return (
    <header className="bg-papel border-b border-gris-300">
      {/* Barra utilitaria superior */}
      <div className="border-b border-gris-200 bg-gris-100">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-xs text-gris-600 font-sans">
          <span className="capitalize">{today}</span>
          <div className="hidden sm:flex items-center gap-4">
            {userDisplay ? (
              <UserMenu name={userDisplay.name} role={userDisplay.role} />
            ) : (
              <AuthMenu />
            )}
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col items-center text-center relative">
        {/* Línea ornamental superior */}
        <div className="w-full flex items-center gap-3 mb-4">
          <div className="flex-1 border-t-2 border-tinta" />
          <span className="text-gris-400 text-xs tracking-[0.3em] uppercase font-sans">Est. 2026</span>
          <div className="flex-1 border-t-2 border-tinta" />
        </div>

        <Link href="/" className="block" aria-label="Colombia Positiva — Inicio">
          <Image
            src={logoHeader}
            alt="Colombia Positiva"
            priority
            className="h-16 md:h-24 w-auto mx-auto"
          />
        </Link>

        {/* Línea ornamental inferior */}
        <div className="w-full flex items-center gap-3 mt-4">
          <div className="flex-1 border-t border-gris-300" />
          <span className="text-verde text-xs tracking-[0.2em] uppercase font-sans font-600">
            ✦ Solo noticias positivas ✦
          </span>
          <div className="flex-1 border-t border-gris-300" />
        </div>

        {/* Búsqueda en desktop */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-2">
          <form action="/buscar" method="GET">
            <div className="relative">
              <input
                type="search"
                name="q"
                placeholder="Buscar..."
                className="border border-gris-300 bg-white py-1.5 pl-3 pr-8 text-xs font-sans focus:outline-none focus:border-verde w-40"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">
                <svg className="w-3.5 h-3.5 text-gris-400 hover:text-verde transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        <MobileMenu />
      </div>

      {/* Navegación de categorías */}
      <nav className="border-t-2 border-b border-tinta bg-tinta">
        <div className="max-w-[1600px] mx-auto px-4">
          <ul className="hidden md:flex flex-wrap items-center justify-center gap-y-1">
            <li>
              <Link href="/" className="block px-3 lg:px-4 xl:px-6 py-2.5 text-xs font-sans font-600 tracking-wide uppercase text-white/70 hover:text-white hover:bg-verde transition-all whitespace-nowrap">
                Inicio
              </Link>
            </li>
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link href={`/categoria/${cat.slug}`} className="block px-3 lg:px-4 xl:px-6 py-2.5 text-xs font-sans font-600 tracking-wide uppercase text-white/70 hover:text-white hover:bg-verde transition-all whitespace-nowrap">
                  {cat.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/nota-positiva" className="nota-positiva-btn block px-3 lg:px-4 xl:px-6 py-2.5 text-xs font-sans font-700 tracking-wide uppercase bg-[rgb(239,190,5)] text-[rgb(1,50,98)] whitespace-nowrap">
                ✦ Nota Positiva
              </Link>
            </li>
            <li>
              <Link href="/pauta" className="nota-positiva-btn block px-3 lg:px-4 xl:px-6 py-2.5 text-xs font-sans font-700 tracking-wide uppercase bg-[rgb(239,190,5)] text-[rgb(1,50,98)] whitespace-nowrap">
                ✦ Pauta Positiva
              </Link>
            </li>
            <li>
              <Link href="/suscripcion" className="nota-positiva-btn block px-3 lg:px-4 xl:px-6 py-2.5 text-xs font-sans font-700 tracking-wide uppercase bg-[rgb(239,190,5)] text-[rgb(1,50,98)] whitespace-nowrap">
                ✦ Suscríbete
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}
