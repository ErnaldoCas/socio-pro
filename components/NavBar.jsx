'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRol } from '@/hooks/useRol'

export default function NavBar() {
  const pathname = usePathname()
  const { rol, permisos, loading } = useRol()

  const todosLosLinks = [
    { href: '/', label: 'Inicio', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', permiso: null, soloDueno: false },
    { href: '/inventario', label: 'Inventario', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', permiso: 'ver_inventario', soloDueno: false },
    { href: '/movimientos', label: 'Movimientos', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', permiso: null, soloDueno: false },
    { href: '/reportes', label: 'Reportes', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', permiso: 'ver_reportes', soloDueno: false },
    { href: '/socio', label: 'Socio', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', permiso: 'socio_experto', soloDueno: false },
    { href: '/precios', label: 'Pro', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', permiso: null, soloDueno: true },
    { href: '/config', label: 'Config', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', permiso: null, soloDueno: false },
  ]

  const links = todosLosLinks.filter(link => {
    if (loading) return link.permiso === null && !link.soloDueno
    if (rol === 'dueño') return true
    if (link.soloDueno) return false
    if (!link.permiso) return true
    return permisos?.[link.permiso] === true
  })

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-50">
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <img
              src="/logo.png"
              alt="Mi Socio Pro"
              className="w-14 h-14 rounded-2xl object-contain shadow-sm border border-gray-100"
            />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 leading-tight tracking-tight">Mi Socio Pro</p>
            <p className="text-xs text-gray-400 leading-tight">
              {rol === 'colaborador' ? 'Colaborador' : 'Contabilidad & finanzas simples'}
            </p>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="max-w-2xl mx-auto flex justify-around items-center py-1">
          {links.map(link => {
            const active = pathname === link.href || (link.href === '/config' && pathname === '/equipo')
            const esPro = link.href === '/precios'
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                  active
                    ? esPro ? 'text-amber-500' : 'text-green-600'
                    : esPro ? 'text-amber-400' : 'text-gray-400'
                }`}
              >
                <svg className="w-5 h-5" fill={esPro ? 'currentColor' : 'none'} stroke={esPro ? 'none' : 'currentColor'} strokeWidth={active ? 2.5 : 1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                </svg>
                <span className={`text-xs ${active ? 'font-medium' : ''}`}>{link.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}