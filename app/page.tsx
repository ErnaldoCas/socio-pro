'use client'
import SocioChat from '@/components/SocioChat'
import VoiceInput from '@/components/VoiceInput'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { parsearMovimiento } from '@/lib/nlpParser'
import Graficos from '@/components/Graficos'

export default function Home() {
  const [input, setInput] = useState('')
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [tipoDetectado, setTipoDetectado] = useState('')

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

  function handleInput(texto: string) {
    setInput(texto)
    if (texto.length > 3) {
      const { tipo } = parsearMovimiento(texto)
      setTipoDetectado(tipo)
    } else {
      setTipoDetectado('')
    }
  }

  async function registrar() {
    if (!input.trim()) return
    setLoading(true)
    setMensaje('')

    const { concepto, monto, tipo, categoria } = parsearMovimiento(input)

    const res = await fetch('/api/movimientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concepto, monto, tipo, categoria })
    })

    if (res.ok) {
      setMensaje(`Registrado como ${tipo} · $${monto.toLocaleString()} · ${categoria}`)
      setInput('')
      setTipoDetectado('')
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
        <Graficos movimientos={movimientos} />

        <div className="bg-white rounded-xl p-5 border border-gray-100 mb-6">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-gray-700">Registrar movimiento</p>
            {tipoDetectado && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                tipoDetectado === 'ingreso'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-600'
              }`}>
                {tipoDetectado === 'ingreso' ? 'Ingreso detectado' : 'Egreso detectado'}
              </span>
            )}
          </div>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={input}
              onChange={e => handleInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && registrar()}
              placeholder='Ej: "vendí completos 5000" o "compré harina 3000"'
              className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-green-400 text-gray-800 placeholder-gray-400 bg-white"
            />
            <VoiceInput onResult={(texto: string) => handleInput(texto)} />
          </div>

          <button
            onClick={registrar}
            disabled={loading}
            className="w-full bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
          {mensaje && (
            <p className="text-green-600 text-xs mt-2 text-center">{mensaje}</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-3">Últimos movimientos</p>
          {movimientos.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Aún no hay movimientos registrados</p>
          ) : (
            <div className="space-y-2">
              {movimientos.map(m => (
                <div key={m.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="text-sm text-gray-700">{m.concepto}</span>
                    {m.categoria && (
                      <span className="ml-2 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        {m.categoria}
                      </span>
                    )}
                  </div>
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