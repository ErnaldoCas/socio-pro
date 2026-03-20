'use client'
import SocioChat from '@/components/SocioChat'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function Home() {
  const [input, setInput] = useState('')
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const supabase = createClient()

  useEffect(() => {
    cargarMovimientos()
  }, [])

  async function cargarMovimientos() {
    const { data } = await supabase
      .from('movimientos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    setMovimientos(data || [])
  }

  async function registrar() {
    if (!input.trim()) return
    setLoading(true)
    setMensaje('')

    const esIngreso = /vendí|cobré|ingresé|gané|recibí/i.test(input)
    const montoMatch = input.match(/\d+/)
    const monto = montoMatch ? parseInt(montoMatch[0]) : 0
    const tipo = esIngreso ? 'ingreso' : 'egreso'

    const res = await fetch('/api/movimientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concepto: input, monto, tipo })
    })

    if (res.ok) {
      setMensaje('Registrado correctamente')
      setInput('')
      cargarMovimientos()
    }
    setLoading(false)
  }

  const ingresos = movimientos
    .filter(m => m.tipo === 'ingreso')
    .reduce((sum, m) => sum + m.monto, 0)

  const egresos = movimientos
    .filter(m => m.tipo === 'egreso')
    .reduce((sum, m) => sum + m.monto, 0)

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-800">Socio Pro</h1>
          <p className="text-gray-600 text-sm">Tu socio digital de negocios</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Ingresos</p>
            <p className="text-xl font-semibold text-green-600">${ingresos.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Egresos</p>
            <p className="text-xl font-semibold text-red-500">${egresos.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Balance</p>
            <p className="text-xl font-semibold text-blue-600">${(ingresos - egresos).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Registrar movimiento</p>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && registrar()}
            placeholder='Ej: "vendí completos 5000" o "compré harina 3000"'
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-green-400 mb-3 text-gray-800 placeholder-gray-400 bg-white"
          />
          <button
            onClick={registrar}
            disabled={loading}
            className="w-full bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
          {mensaje && <p className="text-green-600 text-xs mt-2 text-center">{mensaje}</p>}
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-3">Últimos movimientos</p>
          {movimientos.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Aún no hay movimientos registrados</p>
          ) : (
            <div className="space-y-2">
              {movimientos.map(m => (
                <div key={m.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{m.concepto}</span>
                  <span className={`text-sm font-medium ${m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-500'}`}>
                    {m.tipo === 'ingreso' ? '+' : '-'}${m.monto.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

          <SocioChat />

      </div>
    </main>
  )
}