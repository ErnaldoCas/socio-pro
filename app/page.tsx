'use client'
import SocioChat from '@/components/SocioChat'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import VoiceInput from '@/components/VoiceInput'
import Graficos from '@/components/Graficos'
import HealthScore from '@/components/HealthScore'
import { useState, useEffect, useRef } from 'react'
import { parsearMovimiento } from '@/lib/nlpParser'
import { useRol } from '@/hooks/useRol'

export default function Home() {
  const [input, setInput] = useState('')
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [filtroColaborador, setFiltroColaborador] = useState('todos')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [mensajeError, setMensajeError] = useState(false)
  const [tipoDetectado, setTipoDetectado] = useState('')

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  // ✅ Ref del input para pasarle a VoiceInput y forzar foco en móvil
  const inputRef = useRef<HTMLInputElement>(null)

  const { rol, permisos } = useRol()
  const esDueno = rol === 'dueño'
  const puedeRegistrar = !rol || esDueno || permisos?.registrar_movimientos === true

  useEffect(() => {
    cargarMovimientos()
    if (esDueno) cargarColaboradores()
  }, [filtroColaborador, rol])

  async function cargarColaboradores() {
    const res = await fetch('/api/negocio')
    const data = await res.json()
    setColaboradores(data.colaboradores?.filter((c: any) => c.estado === 'activo') || [])
  }

  async function cargarMovimientos() {
    let url = '/api/movimientos'
    if (esDueno && filtroColaborador !== 'todos') {
      url += `?colaborador_id=${filtroColaborador}`
    }
    const res = await fetch(url)
    const data = await res.json()
    setMovimientos(Array.isArray(data) ? data.slice(0, 20) : [])
  }

  function handleInput(texto: string) {
    setInput(texto)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (texto.length > 3) {
      debounceRef.current = setTimeout(() => {
        const { tipo } = parsearMovimiento(texto)
        setTipoDetectado(tipo)
      }, 200)
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
    <AuthGuard>
      <main className="min-h-screen bg-gray-100 p-4 pt-16 pb-24">
        <div className="max-w-2xl mx-auto">

          {/* Filtro por colaborador — solo dueño */}
          {esDueno && colaboradores.length > 0 && (
            <div className="mb-4 mt-2">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setFiltroColaborador('todos')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    filtroColaborador === 'todos'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-500 border border-gray-200'
                  }`}
                >
                  Todo el negocio
                </button>
                {colaboradores.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => setFiltroColaborador(c.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                      filtroColaborador === c.id
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-500 border border-gray-200'
                    }`}
                  >
                    {c.nombre || c.email}
                  </button>
                ))}
              </div>
              {filtroColaborador !== 'todos' && (
                <p className="text-xs text-gray-400 mt-1.5 ml-1">
                  Viendo movimientos de {colaboradores.find(c => c.id === filtroColaborador)?.nombre || 'colaborador'}
                </p>
              )}
            </div>
          )}

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-3 mb-4 mt-2">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Ingresos</p>
              <p className="text-base font-semibold text-green-600">${ingresos.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Egresos</p>
              <p className="text-base font-semibold text-red-500">${egresos.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Balance</p>
              <p className={`text-base font-semibold ${balance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                ${balance.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Smart Entry */}
          {puedeRegistrar && (
            <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
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
                {/* ✅ ref agregado al input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => handleInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && registrar()}
                  placeholder='Ej: "vendí completos 5000"'
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-green-400 text-gray-800 placeholder-gray-400 bg-white"
                />
                {/* ✅ inputRef pasado a VoiceInput */}
                <VoiceInput
                  onResult={(texto: string) => handleInput(texto)}
                  inputRef={inputRef}
                />
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
          )}

          {/* Health Score */}
          <HealthScore movimientos={movimientos} />

          {/* Gráficos */}
          <Graficos movimientos={movimientos} />

          {/* Últimos movimientos */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium text-gray-700">Últimos movimientos</p>
              <span className="text-xs text-gray-400">{movimientos.length} registros</span>
            </div>
            {movimientos.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">
                Aún no hay movimientos
              </p>
            ) : (
              <div className="space-y-1">
                {movimientos.slice(0, 5).map(m => (
                  <div key={m.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
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
                {movimientos.length > 5 && (
                  <p className="text-xs text-center text-gray-400 pt-2">
                    Ver todos en Movimientos
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Socio Chat */}
          <SocioChat />

        </div>
      </main>
      <NavBar />
    </AuthGuard>
  )
}