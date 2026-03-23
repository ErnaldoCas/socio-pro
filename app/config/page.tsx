'use client'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Config() {
  const router = useRouter()

  async function cerrarSesion() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const opciones = [
    {
      titulo: 'Mi Equipo',
      descripcion: 'Gestiona colaboradores y permisos',
      href: '/equipo',
      icono: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'
    },
    {
      titulo: 'Mi Negocio',
      descripcion: 'Nombre y datos de tu negocio',
      href: '/equipo',
      icono: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
    },
  ]

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-100 p-4 pt-16 pb-24">
        <div className="max-w-2xl mx-auto">

          <div className="mb-4 pt-2">
            <h1 className="text-2xl font-semibold text-gray-800">Configuración</h1>
            <p className="text-gray-500 text-sm">Ajustes de tu cuenta y negocio</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 mb-4">
            {opciones.map((op, i) => (
              <Link
                key={i}
                href={op.href}
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-all ${
                  i < opciones.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={op.icono} />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{op.titulo}</p>
                  <p className="text-xs text-gray-400">{op.descripcion}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100">
            <button
              onClick={cerrarSesion}
              className="w-full flex items-center gap-4 p-4 hover:bg-red-50 transition-all rounded-xl"
            >
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-red-600">Cerrar sesión</p>
                <p className="text-xs text-gray-400">Salir de tu cuenta</p>
              </div>
            </button>
          </div>

        </div>
      </main>
      <NavBar />
    </AuthGuard>
  )
}