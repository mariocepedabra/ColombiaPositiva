'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/admin/actions'

type Props = {
  profile: { role: string; full_name: string }
  userEmail: string
}

export default function AdminMobileNav({ profile, userEmail }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || (href !== '/admin' && pathname.startsWith(href))

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Barra superior móvil */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#013262] text-white flex items-center justify-between px-4 py-3 border-b border-white/10">
        <Link href="/" className="font-heading font-700 text-base text-white">
          Colombia <span className="text-[#31c303]">Positiva</span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="p-1.5 hover:bg-white/10 transition-colors rounded"
          aria-label="Abrir menú"
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Panel deslizante */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60" onClick={() => setOpen(false)}>
          <div
            className="absolute top-0 left-0 h-full w-72 bg-[#013262] text-white flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10">
              <p className="font-heading font-700 text-lg text-white leading-tight">Colombia <span className="text-[#31c303]">Positiva</span></p>
              <p className="font-sans text-xs text-white/50 mt-0.5">Panel de administración</p>
            </div>

            <div className="px-6 py-4 border-b border-white/10">
              <p className="font-sans text-sm font-600 text-white truncate">{profile.full_name || userEmail}</p>
              <span className={`inline-block font-sans text-xs px-2 py-0.5 mt-1 ${
                profile.role === 'admin' ? 'bg-[#31c303] text-[#013262] font-600' : 'bg-white/15 text-white/80'
              }`}>
                {profile.role === 'admin' ? 'Administrador' : 'Columnista'}
              </span>
            </div>

            <nav className="flex-1 py-4 overflow-y-auto">
              <MobileNavItem href="/admin" label="Dashboard" icon="🏠" active={pathname === '/admin'} />
              <MobileNavItem href="/admin/nuevo" label="Nueva nota" icon="✍️" active={isActive('/admin/nuevo')} />
              <MobileNavItem href="/admin/articulos" label="Artículos" icon="📰" active={isActive('/admin/articulos')} />
              <MobileNavItem href="/admin/videos" label="Videos" icon="🎬" active={isActive('/admin/videos')} />
              {profile.role === 'admin' && (
                <>
                  <div className="px-6 py-2 mt-2">
                    <p className="font-sans text-xs uppercase tracking-widest text-white/30">Admin</p>
                  </div>
                  <MobileNavItem href="/admin/usuarios" label="Usuarios" icon="👥" active={isActive('/admin/usuarios')} />
                  <MobileNavItem href="/admin/estadisticas" label="Estadísticas" icon="📊" active={isActive('/admin/estadisticas')} />
                  <MobileNavItem href="/admin/metricas" label="Métricas de redes" icon="📈" active={isActive('/admin/metricas')} />
                  <MobileNavItem href="/admin/notas-positivas" label="Notas del público" icon="📬" active={isActive('/admin/notas-positivas')} />
                  <MobileNavItem href="/admin/pautas" label="Pautas" icon="📢" active={isActive('/admin/pautas')} />
                  <MobileNavItem href="/admin/suscriptores" label="Suscriptores" icon="⭐" active={isActive('/admin/suscriptores')} />
                  <MobileNavItem href="/admin/configuracion" label="Configuración" icon="⚙️" active={isActive('/admin/configuracion')} />
                </>
              )}
            </nav>

            <div className="p-4 border-t border-white/10">
              <Link href="/" className="block font-sans text-xs text-white/50 hover:text-white mb-3 transition-colors">
                ← Ver el periódico
              </Link>
              <form action={signOut}>
                <button type="submit" className="w-full font-sans text-xs text-white/70 hover:text-white border border-white/20 py-2 transition-colors">
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function MobileNavItem({ href, label, icon, active }: { href: string; label: string; icon: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-6 py-3 font-sans text-sm transition-colors border-l-[3px] ${
        active ? 'bg-[#011f3d] text-white border-[#31c303] font-600' : 'text-white/75 border-transparent hover:text-white hover:bg-white/10'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  )
}
