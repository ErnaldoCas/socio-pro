'use client'
import SocioChat from '@/components/SocioChat'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import VoiceInput from '@/components/VoiceInput'
import Graficos from '@/components/Graficos'
import HealthScore from '@/components/HealthScore'
import WelcomeModal from '@/components/WelcomeModal'
import OnboardingDrawer from '@/components/OnboardingDrawer'
import { useState, useEffect, useRef } from 'react'
import { parsearMovimiento } from '@/lib/nlpParser'
import { useRol } from '@/hooks/useRol'
import { usePlan } from '@/hooks/usePlan'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

interface Insight {
  tipo: 'positivo' | 'alerta' | 'neutro'
  texto: string
}

export default function Home() {
  const [input, setInput] = useState('')
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [filtroColaborador, setFiltroColaborador] = useState('todos')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [mensajeError, setMensajeError] = useState(false)
  const [tipoDetectado, setTipoDetectado] = useState('')
  const [nombreDueno, setNombreDueno] = useState<string | null>(null)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [negocioCargado, setNegocioCargado] = useState(false)
  const [limitAlcanzado, setLimitAlcanzado] = useState(false)
  const [insights, setInsights] = useState<Insight[]>([])
  const [insightsCargando, setInsightsCargando] = useState(true)
  const [insightsExpandido, setInsightsExpandido] = useState(false)

  const [mostrarOnboarding, setMostrarOnboarding] = useState(false)
  const [negocioId, setNegocioId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const { rol, permisos } = useRol()
  const { esPro } = usePlan()
  const esDueno = rol === 'dueño'
  const puedeRegistrar = !rol || esDueno || permisos?.registrar_movimientos === true

  useEffect(() => {
    cargarMovimientos()
    cargarNegocio()
    cargarInsights()
  }, [])

  useEffect(() => {
    if (esDueno) cargarColaboradores()
  }, [esDueno])

  async function cargarInsights() {
    try {
      const res = await fetch('/api/resumen-diario')
      const data = await res.json()
      setInsights(data.insights || [])
    } catch {
      setInsights([])
    }
    setInsightsCargando(false)
  }

  async function cargarNegocio() {
    const res = await fetch('/api/negocio')
    const data = await res.json()
    const nombre = data.negocio?.nombre_dueno || null
    setNombreDueno(nombre)
    setNegocioCargado(true)
    if (data.rol === 'dueño' && !nombre) setMostrarModal(true)
    if (data.rol === 'dueño' && data.negocio?.id) {
      setNegocioId(data.negocio.id)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: negocio } = await supabase
          .from('negocios').select('onboarding_completado')
          .eq('id', data.negocio.id).single()
        if (negocio && !negocio.onboarding_completado) {
          setTimeout(() => setMostrarOnboarding(true), 300)
        }
      }
    }
  }

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
    setLimitAlcanzado(false)

    const textoOriginal = input.trim()
    const { concepto, monto, tipo, categoria } = parsearMovimiento(textoOriginal)

    const res = await fetch('/api/movimientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concepto, monto, tipo, categoria, textoOriginal })
    })

    if (res.ok) {
      setMensaje(`${tipo === 'ingreso' ? '✅ Ingreso' : '📤 Egreso'} de $${monto.toLocaleString()} guardado`)
      setMensajeError(false)
      setInput('')
      setTipoDetectado('')
      cargarMovimientos()
    } else {
      const err = await res.json()
      if (err.codigo === 'LIMITE_GRATIS') {
        setLimitAlcanzado(true)
        setMensaje('Alcanzaste los 40 movimientos de este mes. Pasa a Pro para continuar.')
      } else {
        setMensaje('Algo salió mal. Intenta de nuevo.')
      }
      setMensajeError(true)
    }
    setLoading(false)
  }

  function getSaludo() {
    const hora = new Date().getHours()
    if (hora >= 6 && hora < 12) return 'Buenos días'
    if (hora >= 12 && hora < 20) return 'Buenas tardes'
    return 'Buenas noches'
  }

  function getInsightPrincipal(): Insight | null {
    if (!insights.length) return null
    return insights.find(i => i.tipo === 'alerta') || insights[0]
  }

  const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0)
  const egresos = movimientos.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0)
  const balance = ingresos - egresos
  const insightPrincipal = getInsightPrincipal()
  const insightsSecundarios = insights.filter(i => i !== insightPrincipal)

  return (
    <AuthGuard>
      {mostrarModal && (
        <WelcomeModal onGuardar={(nombre) => { setNombreDueno(nombre); setMostrarModal(false) }} />
      )}
      {mostrarOnboarding && negocioId && userId && (
        <OnboardingDrawer
          userId={userId}
          negocioId={negocioId}
          onCompletado={() => {
            setMostrarOnboarding(false)
            cargarNegocio()
            cargarMovimientos()
          }}
        />
      )}

      <main className="min-h-screen bg-gray-100 p-4 pt-16 pb-24">
        <div className="max-w-2xl mx-auto">

          {/* Saludo */}
          {negocioCargado && nombreDueno && (
            <div className="mb-4 mt-2">
              <p className="text-lg font-semibold text-gray-800">{getSaludo()}, {nombreDueno} 👋</p>
              <p className="text-xs text-gray-400">¿Cómo va el negocio hoy?</p>
            </div>
          )}

          {/* ✅ RESUMEN INTELIGENTE — colapsable */}
          <div className="bg-white rounded-xl border border-gray-100 mb-4 overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🤖</span>
                <p className="text-sm font-semibold text-gray-800">Resumen inteligente del día</p>
              </div>
              <Link href="/socio" className="text-xs text-green-600 font-medium hover:underline">
                Ver análisis →
              </Link>
            </div>

            {insightsCargando ? (
              <div className="px-4 pb-3 flex gap-2 items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <p className="text-xs text-gray-400 ml-1">Analizando tu negocio...</p>
              </div>
            ) : !insightPrincipal ? (
              <div className="px-4 pb-3">
                <p className="text-sm text-gray-400">Registra tus primeros movimientos para ver el análisis 🚀</p>
              </div>
            ) : (
              <>
                {/* Insight principal siempre visible */}
                <div className="px-4 pb-3 flex items-start gap-3">
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {insightPrincipal.tipo === 'positivo' ? '👍' : insightPrincipal.tipo === 'alerta' ? '⚠️' : '💡'}
                  </span>
                  <p className="text-sm text-gray-700 leading-snug flex-1">{insightPrincipal.texto}</p>
                </div>

                {/* Insights secundarios — colapsables */}
                {insightsSecundarios.length > 0 && (
                  <>
                    {insightsExpandido && (
                      <div className="border-t border-gray-50">
                        {insightsSecundarios.map((insight, i) => (
                          <div key={i} className="px-4 py-2.5 flex items-start gap-3 border-b border-gray-50 last:border-0">
                            <span className="text-base flex-shrink-0 mt-0.5">
                              {insight.tipo === 'positivo' ? '👍' : insight.tipo === 'alerta' ? '⚠️' : '💡'}
                            </span>
                            <p className="text-sm text-gray-600 leading-snug">{insight.texto}</p>
                          </div>
                        ))}
                        {!esPro && (
                          <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between">
                            <p className="text-xs text-gray-400">Tu Socio IA detectó más cosas 🔒</p>
                            <Link href="/precios" className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 transition-all">
                              Ver Pro ⭐
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => setInsightsExpandido(!insightsExpandido)}
                      className="w-full px-4 py-2 border-t border-gray-50 text-xs text-green-600 font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-1"
                    >
                      {insightsExpandido ? 'Ver menos ▲' : `Ver más (${insightsSecundarios.length} insights más) ▼`}
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Filtro por colaborador */}
          {esDueno && colaboradores.length > 0 && (
            <div className="mb-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setFiltroColaborador('todos')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    filtroColaborador === 'todos' ? 'bg-green-600 text-white' : 'bg-white text-gray-500 border border-gray-200'
                  }`}
                >
                  Todo el negocio
                </button>
                {colaboradores.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => setFiltroColaborador(c.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                      filtroColaborador === c.id ? 'bg-green-600 text-white' : 'bg-white text-gray-500 border border-gray-200'
                    }`}
                  >
                    {c.nombre || c.email}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Métricas con mensajes humanos */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Entraron</p>
              <p className="text-base font-semibold text-green-600">${ingresos.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Salieron</p>
              <p className="text-base font-semibold text-red-500">${egresos.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">{balance >= 0 ? 'Vas ganando 👍' : 'Ojo, pérdida ⚠️'}</p>
              <p className={`text-base font-semibold ${balance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                ${balance.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Smart Entry */}
          {puedeRegistrar && (
            <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-medium text-gray-700">¿Qué pasó hoy?</p>
                {tipoDetectado && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    tipoDetectado === 'ingreso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {tipoDetectado === 'ingreso' ? '+ Entró plata' : '- Salió plata'}
                  </span>
                )}
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={input}
                  onChange={e => handleInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && registrar()}
                  placeholder='Ej: "vendí completos 5000" o "pagué bencina 30000"'
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-green-400 text-gray-800 placeholder-gray-400 bg-white"
                />
                <VoiceInput onResult={handleInput} />
              </div>
              <button
                onClick={registrar}
                disabled={loading}
                className="w-full bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Registrar'}
              </button>
              {mensaje && !limitAlcanzado && (
                <p className={`text-xs mt-2 text-center ${mensajeError ? 'text-red-500' : 'text-green-600'}`}>
                  {mensaje}
                </p>
              )}
              {limitAlcanzado && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-700 font-medium mb-1">
                    Llegaste al límite de 40 movimientos este mes 🔒
                  </p>
                  <p className="text-xs text-amber-600 mb-2">Pasa a Pro y registra sin límites</p>
                  <Link
                    href="/precios"
                    className="inline-block bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-all"
                  >
                    Ver plan Pro ⭐
                  </Link>
                </div>
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
              <p className="text-sm font-medium text-gray-700">Lo último registrado</p>
              <span className="text-xs text-gray-400">{movimientos.length} registros</span>
            </div>
            {movimientos.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm">Aún no hay nada registrado</p>
                <p className="text-gray-300 text-xs mt-1">Escribe arriba lo que pasó hoy 👆</p>
              </div>
            ) : (
              <div className="space-y-1">
                {movimientos.slice(0, 5).map(m => (
                  <div key={m.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm text-gray-700 truncate">{m.concepto}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {m.categoria && <span className="text-xs text-gray-400">{m.categoria}</span>}
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
                  <p className="text-xs text-center text-gray-400 pt-2">Ver todos en Movimientos</p>
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