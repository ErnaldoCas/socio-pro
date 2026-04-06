'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const ADMIN_EMAIL = 'ercastros@gmail.com'

export default function Admin() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    verificarAcceso()
  }, [])

  async function verificarAcceso() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== ADMIN_EMAIL) {
      router.push('/')
      return
    }

    cargarUsuarios()
  }

  async function cargarUsuarios() {
    const res = await fetch('/api/admin')
    if (!res.ok) {
      setError('No autorizado o error al cargar datos.')
      setLoading(false)
      return
    }
    const data = await res.json()
    setUsuarios(data || [])
    setLoading(false)
  }

  const totalPro = usuarios.filter(u => u.plan === 'pro').length
  const totalBeta = usuarios.filter(u => u.plan === 'beta').length
  const totalGratis = usuarios.filter(u => u.plan === 'gratis').length

  if (loading) return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </main>
  )

  if (error) return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-red-500 text-sm">{error}</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Panel Admin</h1>
          <p className="text-gray-500 text-sm">Mi Socio Pro — solo visible para ti</p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-gray-800">{usuarios.length}</p>
            <p className="text-xs text-gray-400 mt-1">Total usuarios</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-green-600">{totalPro}</p>
            <p className="text-xs text-gray-400 mt-1">Plan Pro</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-amber-500">{totalBeta}</p>
            <p className="text-xs text-gray-400 mt-1">Plan Beta</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-gray-400">{totalGratis}</p>
            <p className="text-xs text-gray-400 mt-1">Plan Gratis</p>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-sm font-medium text-gray-700">Usuarios registrados</p>
            <p className="text-xs text-gray-400">{usuarios.length} negocios activos</p>
          </div>

          {usuarios.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No hay usuarios registrados</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {usuarios.map((u, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {u.nombre_dueno || u.nombre || 'Sin nombre'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      {u.nombre && u.nombre_dueno && (
                        <span className="text-xs text-gray-300">· {u.nombre}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-xs text-gray-300">
                      {new Date(u.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      u.plan === 'pro'
                        ? 'bg-green-100 text-green-700'
                        : u.plan === 'beta'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {u.plan === 'pro' ? '⭐ Pro' : u.plan === 'beta' ? '🧪 Beta' : 'Gratis'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}