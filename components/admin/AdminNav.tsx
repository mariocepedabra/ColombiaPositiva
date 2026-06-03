'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/admin/actions'

type Props = {
  profile: { role: string; full_name: string }
  userEmail: string
}

export default function AdminNav({ profile, userEmail }: Props) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || (href !== '/admin' && pathname.startsWith(href))

  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 h-full w-64 bg-tinta text-white z-30">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="block">
          <p className="font-heading font-700 text-lg text-verde leading-tight">Colombia Positiva</p>
          <p className="font-sans text-xs text-white/50 mt-0.5">Panel de administración</p>
        </Link>
      </div>

      {/* Usuario */}
      <div className="px-6 py-4 border-b border-white/10">
        <p className="font-sans text-sm font-600 text-white truncate">{profile.full_name || userEmail}</p>
        <span className={`inline-block font-sans text-xs px-2 py-0.5 mt-1 ${
          profile.role === 'admin' ? 'bg-verde text-white' : 'bg-white/10 text-white/70'
        }`}>
          {profile.role === 'admin' ? 'Administrador' : 'Columnista'}
        </span>
      </div>

      {/* Navegación */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <NavItem href="/admin" label="Dashboard" icon="🏠" active={pathname === '/admin'} />
        <NavItem href="/admin/nuevo" label="Nueva nota" icon="✍️" active={isActive('/admin/nuevo')} />
        <NavItem href="/admin/articulos" label="Artículos" icon="📰" active={isActive('/admin/articulos')} />
        <NavItem href="/admin/videos" label="Videos" icon="🎬" active={isActive('/admin/videos')} />

        {profile.role === 'admin' && (
          <>
            <div className="px-6 py-2 mt-2">
              <p className="font-sans text-xs uppercase tracking-widest text-white/30">Admin</p>
            </div>
            <NavItem href="/admin/estadisticas" label="Estadísticas" icon="📊" active={isActive('/admin/estadisticas')} />
            <NavItem href="/admin/usuarios" label="Usuarios" icon="👥" active={isActive('/admin/usuarios')} />
            <NavItem href="/admin/notas-positivas" label="Notas del público" icon="📬" active={isActive('/admin/notas-positivas')} />
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <Link href="/" className="block font-sans text-xs text-white/50 hover:text-white mb-3 transition-colors">
          ← Ver el periódico
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full font-sans text-xs text-white/70 hover:text-white border border-white/20 hover:border-white/50 py-2 transition-colors"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}

function NavItem({ href, label, icon, active }: { href: string; label: string; icon: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-6 py-3 font-sans text-sm transition-colors ${
        active ? 'bg-verde text-white' : 'text-white/70 hover:text-white hover:bg-white/5'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  )
}
