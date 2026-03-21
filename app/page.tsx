'use client'
import SocioChat from '@/components/SocioChat'
import VoiceInput from '@/components/VoiceInput'
import Graficos from '@/components/Graficos'
import HealthScore from '@/components/HealthScore'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { parsearMovimiento } from '@/lib/nlpParser'

export default function Home() {
  const [input, setInput] = useState('')
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [mensajeError, setMensajeError] = useState(false)
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
      .limit(20)
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
    setMensajeError(false)

    const { concepto, monto, tipo, categoria } = parsearMovimiento(input)

    const res = await fetch('/api/movimientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concepto, monto, tipo, categoria })
    })

    if (res.ok) {
      setMensaje(`${tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} de $${monto.toLocaleString()} registrado en ${categoria}`)
      setMensajeError(false)
      setInput('')
      setTipoDetectado('')
      cargarMovimientos()
    } else {
      setMensaje('Hubo un error al registrar. Intenta de nuevo.')
      setMensajeError(true)
    }
    setLoading(false)
  }

  const ingresos = movimientos
    .filter(m => m.tipo === 'ingreso')
    .reduce((sum, m) => sum + m.monto, 0)

  const egresos = movimientos
    .filter(m => m.tipo === 'egreso')
    .reduce((sum, m) => sum + m.monto, 0)

  const balance = ingresos - egresos

  return (
    <main className="min-h-screen bg-gray-100 p-4 pb-24">
      <div className="max-w-2xl mx-auto">

        <div className="mb-6 pt-2">
          <h1 className="text-2xl font-semibold text-gray-800">Socio Pro</h1>
          <p className="text-gray-500 text-sm">Tu socio digital de negocios</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 mb-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-gray-700">Registrar movimiento</p>
            {tipoDetectado && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                tipoDetectado === 'ingreso'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-600'
              }`}>
                {tipoDetectado === 'ingreso' ? '+ Ingreso' : '- Egreso'}
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
            className="w-full bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
          {mensaje && (
            <p className={`text-xs mt-2 text-center ${mensajeError ? 'text-red-500' : 'text-green-600'}`}>
              {mensaje}
            </p>
          )}
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
            <p className={`text-lg font-semibold ${balance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
              ${balance.toLocaleString()}
            </p>
          </div>
        </div>

        <HealthScore movimientos={movimientos} />

        <Graficos movimientos={movimientos} />

        <div className="bg-white rounded-xl p-5 border border-gray-100 mb-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-gray-700">Últimos movimientos</p>
            <span className="text-xs text-gray-400">{movimientos.length} registros</span>
          </div>
          {movimientos.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">
              Aún no hay movimientos — registra el primero arriba
            </p>
          ) : (
            <div className="space-y-1">
              {movimientos.map(m => (
                <div key={m.id} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm text-gray-700 truncate">{m.concepto}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {m.categoria && (
                        <span className="text-xs text-gray-400">{m.categoria}</span>
                      )}
                      <span className="text-xs text-gray-300">
                        {new Date(m.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                  <span className={`text-sm font-medium flex-shrink-0 ${m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-500'}`}>
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