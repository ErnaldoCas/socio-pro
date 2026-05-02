'use client'
import { useState } from 'react'
import { usePlan } from '@/hooks/usePlan'
import Link from 'next/link'

export default function AnalisisProfundo() {
  const [analisis, setAnalisis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { esPro, cargando } = usePlan()

  async function generarAnalisis() {
    setLoading(true)
    setError('')
    setAnalisis(null)
    const res = await fetch('/api/analisis')
    const data = await res.json()
    if (data.error) {
      setError('No se pudo generar el análisis. Intenta de nuevo.')
    } else {
      setAnalisis(data.analisis)
    }
    setLoading(false)
  }

  const iconoAlerta = (tipo) => {
    if (tipo === 'riesgo') return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-500', icono: '!' }
    if (tipo === 'oportunidad') return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-500', icono: '↑' }
    return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-500', icono: '→' }
  }

  // Plan gratis — bloqueo atractivo
  if (!cargando && !esPro) {
    return (
      <div className="rounded-2xl overflow-hidden border border-amber-200 shadow-sm">
        {/* Banner superior */}
        <div className="px-5 py-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}>
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900">Análisis Profundo ⭐</p>
            <p className="text-xs text-amber-700">Diagnóstico completo de tu negocio con IA</p>
          </div>
        </div>

        {/* Features bloqueadas */}
        <div className="bg-white px-5 py-4">
          <div className="space-y-2 mb-4">
            {[
              { icon: '🔍', texto: 'Diagnóstico financiero completo' },
              { icon: '⚠️', texto: 'Alertas de riesgo detectadas' },
              { icon: '🚀', texto: 'Oportunidades de crecimiento' },
              { icon: '🎯', texto: 'Una acción concreta para hoy' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 opacity-60">
                <span className="text-sm">{f.icon}</span>
                <p className="text-xs text-gray-600">{f.texto}</p>
                <span className="ml-auto text-xs text-gray-300">🔒</span>
              </div>
            ))}
          </div>
          <Link
            href="/precios"
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-semibold py-3 rounded-xl hover:bg-green-700 transition-all shadow-sm active:scale-95"
          >
            <span>Activar Análisis Profundo</span>
            <span>⭐</span>
          </Link>
          <p className="text-xs text-center text-gray-400 mt-2">Plan Pro · $7.990/mes · Cancela cuando quieras</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white">

      {/* Header con gradiente */}
      <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center"
        style={{ background: 'linear-gradient(90deg, #f0fdf4, #ffffff)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Análisis Profundo</p>
            <p className="text-xs text-gray-400">IA analiza todos tus datos</p>
          </div>
        </div>
        <button
          onClick={generarAnalisis}
          disabled={loading || cargando}
          className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm active:scale-95 flex-shrink-0"
        >
          {loading ? '⏳ Analizando...' : '✨ Analizar'}
        </button>
      </div>

      {/* Estado cargando */}
      {loading && (
        <div className="p-8 text-center">
          <div className="flex justify-center gap-1.5 mb-3">
            <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Analizando tu negocio...</p>
          <p className="text-xs text-gray-400 mt-1">Revisando ingresos, egresos, inventario y tendencias</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-5">
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
            <p className="text-xs text-red-500">{error}</p>
          </div>
        </div>
      )}

      {/* Sin análisis aún */}
      {!loading && !error && !analisis && (
        <div className="p-6 text-center">
          <p className="text-sm text-gray-400">Toca "✨ Analizar" para obtener un diagnóstico completo</p>
          <p className="text-xs text-gray-300 mt-1">Incluye alertas, oportunidades y una acción para hoy</p>
        </div>
      )}

      {/* Resultado */}
      {analisis && (
        <div className="p-5 space-y-4">

          {/* Resumen */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📊 Resumen</p>
            <p className="text-sm text-gray-800 leading-relaxed">{analisis.resumen}</p>
          </div>

          {/* En palabras simples */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-700 mb-2">🤝 En palabras simples</p>
            <p className="text-sm text-amber-900 leading-relaxed">{analisis.explicacion_simple}</p>
          </div>

          {/* Alertas y oportunidades */}
          {analisis.alertas && analisis.alertas.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">⚡ Alertas y oportunidades</p>
              <div className="space-y-2">
                {analisis.alertas.map((a, i) => {
                  const estilo = iconoAlerta(a.tipo)
                  return (
                    <div key={i} className={`${estilo.bg} border ${estilo.border} rounded-xl p-3 flex gap-3`}>
                      <div className={`w-5 h-5 rounded-full ${estilo.badge} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm`}>
                        {estilo.icono}
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${estilo.text} mb-0.5`}>{a.titulo}</p>
                        <p className={`text-xs ${estilo.text} opacity-80`}>{a.descripcion}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Acción para hoy — destacada */}
          {analisis.accion_principal && (
            <div className="rounded-xl overflow-hidden shadow-sm">
              <div className="bg-green-600 px-4 py-2">
                <p className="text-xs font-semibold text-green-100">🎯 Acción para hoy</p>
              </div>
              <div className="bg-green-700 px-4 py-3">
                <p className="text-sm text-white font-medium leading-relaxed">{analisis.accion_principal}</p>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}