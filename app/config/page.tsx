'use client'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import ThemeToggle from '@/components/ThemeToggle'
import PushSubscriber from '@/components/PushSubscriber'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import TutorialDrawer from '@/components/TutorialDrawer'

export default function Config() {
  const router = useRouter()
  const [nombreDueno, setNombreDueno] = useState('')
  const [nombreNegocio, setNombreNegocio] = useState('')
  const [guardandoDueno, setGuardandoDueno] = useState(false)
  const [guardandoNegocio, setGuardandoNegocio] = useState(false)
  const [mensajeDueno, setMensajeDueno] = useState('')
  const [mensajeNegocio, setMensajeNegocio] = useState('')
  const [mostrarTutorial, setMostrarTutorial] = useState(false)

  useEffect(() => {
    cargarNegocio()
  }, [])

  async function cargarNegocio() {
    const res = await fetch('/api/negocio')
    const data = await res.json()
    setNombreNegocio(data.negocio?.nombre || '')
    setNombreDueno(data.negocio?.nombre_dueno || '')
  }

  async function guardarNombreDueno() {
    if (!nombreDueno.trim()) return
    setGuardandoDueno(true)
    await fetch('/api/negocio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'guardar_nombre_dueno', nombre: nombreDueno.trim() })
    })
    setGuardandoDueno(false)
    setMensajeDueno('Guardado ✓')
    setTimeout(() => setMensajeDueno(''), 2000)
  }

  async function guardarNombreNegocio() {
    if (!nombreNegocio.trim()) return
    setGuardandoNegocio(true)
    await fetch('/api/negocio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'actualizar_nombre', nombre: nombreNegocio.trim() })
    })
    setGuardandoNegocio(false)
    setMensajeNegocio('Guardado ✓')
    setTimeout(() => setMensajeNegocio(''), 2000)
  }

  async function cerrarSesion() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <AuthGuard>
      {mostrarTutorial && (
        <TutorialDrawer onCerrar={() => setMostrarTutorial(false)} />
      )}
      <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
        <main className="p-4 pt-16 pb-24">
          <div className="max-w-2xl mx-auto">

            <div className="mb-6 pt-2">
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-slate-100">Configuración</h1>
              <p className="text-gray-500 dark:text-slate-400 text-sm">Ajustes de tu cuenta y negocio</p>
            </div>

            {/* Mi perfil */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 mb-4">
              <div className="px-4 py-3 border-b border-gray-50 dark:border-slate-700">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-200">Mi perfil</p>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-400 mb-1">¿Cómo te llaman?</p>
                  <div className="flex gap-2">
                    <input
                      value={nombreDueno}
                      onChange={e => setNombreDueno(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && guardarNombreDueno()}
                      placeholder="Tu nombre o apodo"
                      className="flex-1 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-400"
                    />
                    <button
                      onClick={guardarNombreDueno}
                      disabled={guardandoDueno}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-all"
                    >
                      {mensajeDueno || (guardandoDueno ? '...' : 'Guardar')}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Así te saluda Socio Pro cada vez que abres la app</p>
                </div>
              </div>
            </div>

            {/* Mi negocio */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 mb-4">
              <div className="px-4 py-3 border-b border-gray-50 dark:border-slate-700">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-200">Mi negocio</p>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-400 mb-1">Nombre del negocio</p>
                  <div className="flex gap-2">
                    <input
                      value={nombreNegocio}
                      onChange={e => setNombreNegocio(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && guardarNombreNegocio()}
                      placeholder="Nombre de tu negocio"
                      className="flex-1 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-400"
                    />
                    <button
                      onClick={guardarNombreNegocio}
                      disabled={guardandoNegocio}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-all"
                    >
                      {mensajeNegocio || (guardandoNegocio ? '...' : 'Guardar')}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Tu Socio Experto usará este nombre al analizar tus datos</p>
                </div>
              </div>
            </div>

            {/* Apariencia y notificaciones */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 mb-4">
              <div className="px-4 py-3 border-b border-gray-50 dark:border-slate-700">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-200">Apariencia y notificaciones</p>
              </div>
              <div className="p-4 space-y-3">
                <ThemeToggle />
                <PushSubscriber />
              </div>
            </div>

            {/* Opciones */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 mb-4">
              <button
                onClick={() => setMostrarTutorial(true)}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all border-b border-gray-50 dark:border-slate-700"
              >
                <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-100">Tutorial de uso</p>
                  <p className="text-xs text-gray-400 dark:text-slate-400">Aprende a sacarle el máximo provecho a Socio Pro</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <Link
                href="/equipo"
                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all border-b border-gray-50 dark:border-slate-700"
              >
                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-100">Mi equipo</p>
                  <p className="text-xs text-gray-400 dark:text-slate-400">Gestiona colaboradores y permisos</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/terminos"
                target="_blank"
                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
              >
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-100">Términos y condiciones</p>
                  <p className="text-xs text-gray-400 dark:text-slate-400">Condiciones de uso de Socio Pro</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Versión */}
            <div className="text-center mb-4">
              <p className="text-xs text-gray-300 dark:text-slate-600">Socio Pro v1.0 — Hecho con ❤️ para emprendedores chilenos</p>
            </div>

            {/* Cerrar sesión */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
              <button
                onClick={cerrarSesion}
                className="w-full flex items-center gap-4 p-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all rounded-xl"
              >
                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-red-600">Cerrar sesión</p>
                  <p className="text-xs text-gray-400 dark:text-slate-400">Salir de tu cuenta</p>
                </div>
              </button>
            </div>

          </div>
        </main>
        <NavBar />
      </div>
    </AuthGuard>
  )
}