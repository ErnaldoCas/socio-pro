'use client'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Config() {
  const router = useRouter()
  const [negocio, setNegocio] = useState<any>(null)
  const [nombreDueno, setNombreDueno] = useState('')
  const [nombreNegocio, setNombreNegocio] = useState('')
  const [guardandoDueno, setGuardandoDueno] = useState(false)
  const [guardandoNegocio, setGuardandoNegocio] = useState(false)
  const [mensajeDueno, setMensajeDueno] = useState('')
  const [mensajeNegocio, setMensajeNegocio] = useState('')

  useEffect(() => {
    cargarNegocio()
  }, [])

  async function cargarNegocio() {
    const res = await fetch('/api/negocio')
    const data = await res.json()
    setNegocio(data.negocio)
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
    <>
      <AuthGuard>
        <main className="min-h-screen bg-gray-100 p-4 pt-16 pb-24">
          <div className="max-w-2xl mx-auto">

            <div className="mb-6 pt-2">
              <h1 className="text-2xl font-semibold text-gray-800">Configuración</h1>
              <p className="text-gray-500 text-sm">Ajustes de tu cuenta y negocio</p>
            </div>

            {/* Mi perfil */}
            <div className="bg-white rounded-xl border border-gray-100 mb-4">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-sm font-medium text-gray-700">Mi perfil</p>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">¿Cómo te llaman?</p>
                  <div className="flex gap-2">
                    <input
                      value={nombreDueno}
                      onChange={e => setNombreDueno(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && guardarNombreDueno()}
                      placeholder="Tu nombre o apodo"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-400"
                    />
                    <button
                      onClick={guardarNombreDueno}
                      disabled={guardandoDueno}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-all"
                    >
                      {mensajeDueno || (guardandoDueno ? '...' : 'Guardar')}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Así te saluda Socio Pro cada vez que abres la app</p>
                </div>
              </div>
            </div>

            {/* Mi negocio */}
            <div className="bg-white rounded-xl border border-gray-100 mb-4">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-sm font-medium text-gray-700">Mi negocio</p>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Nombre del negocio</p>
                  <div className="flex gap-2">
                    <input
                      value={nombreNegocio}
                      onChange={e => setNombreNegocio(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && guardarNombreNegocio()}
                      placeholder="Nombre de tu negocio"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-400"
                    />
                    <button
                      onClick={guardarNombreNegocio}
                      disabled={guardandoNegocio}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-all"
                    >
                      {mensajeNegocio || (guardandoNegocio ? '...' : 'Guardar')}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Tu Socio Experto usará este nombre al analizar tus datos</p>
                </div>
              </div>
            </div>

            {/* Opciones */}
            <div className="bg-white rounded-xl border border-gray-100 mb-4">
              <Link
                href="/equipo"
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-all border-b border-gray-50"
              >
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Mi equipo</p>
                  <p className="text-xs text-gray-400">Gestiona colaboradores y permisos</p>
                </div>
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              
                href="/terminos.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-all"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Términos y condiciones</p>
                  <p className="text-xs text-gray-400">Condiciones de uso de Socio Pro</p>
                </div>
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Versión */}
            <div className="text-center mb-4">
              <p className="text-xs text-gray-300">Socio Pro v1.0 — Hecho con ❤️ para emprendedores chilenos</p>
            </div>

            {/* Cerrar sesión */}
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
    </>
  )
}