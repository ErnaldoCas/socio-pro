'use client'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import { useState, useEffect } from 'react'

export default function Movimientos() {
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    cargarMovimientos()
  }, [])

  async function cargarMovimientos() {
    const res = await fetch('/api/movimientos')
    const data = await res.json()
    setMovimientos(data || [])
  }

  async function eliminar(id: string) {
    await fetch(`/api/movimientos?id=${id}`, { method: 'DELETE' })
    cargarMovimientos()
  }

  const filtrados = movimientos.filter(m => {
    if (filtro === 'todos') return true
    return m.tipo === filtro
  })

  const ingresos = movimientos
    .filter(m => m.tipo === 'ingreso')
    .reduce((sum, m) => sum + m.monto, 0)

  const egresos = movimientos
    .filter(m => m.tipo === 'egreso')
    .reduce((sum, m) => sum + m.monto, 0)

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-100 p-4 pt-20 pb-24">
        <div className="max-w-2xl mx-auto">

          <div className="mb-6 pt-2">
            <h1 className="text-2xl font-semibold text-gray-800">Movimientos</h1>
            <p className="text-gray-500 text-sm">Historial completo</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Ingresos</p>
              <p className="text-lg font-semibold text-green-600">${ingresos.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Egresos</p>
              <p className="text-lg font-semibold text-red-500">${egresos.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Balance</p>
              <p className={`text-lg font-semibold ${ingresos - egresos >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                ${(ingresos - egresos).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            {['todos', 'ingreso', 'egreso'].map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filtro === f
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-500 border border-gray-200'
                }`}
              >
                {f === 'todos' ? 'Todos' : f === 'ingreso' ? 'Ingresos' : 'Egresos'}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100">
            {filtrados.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No hay movimientos</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtrados.map(m => (
                  <div key={m.id} className="p-4 flex justify-between items-center">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm text-gray-800 truncate">{m.concepto}</p>
                      <div className="flex gap-2 mt-0.5">
                        {m.categoria && (
                          <span className="text-xs text-gray-400">{m.categoria}</span>
                        )}
                        <span className="text-xs text-gray-300">
                          {new Date(m.created_at).toLocaleDateString('es-CL', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-500'}`}>
                        {m.tipo === 'ingreso' ? '+' : '-'}${m.monto.toLocaleString()}
                      </span>
                      <button
                        onClick={() => eliminar(m.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
      <NavBar />
    </AuthGuard>
  )
}