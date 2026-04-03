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
    if (tipo === 'riesgo') return { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', badge: 'bg-red-100 text-red-700', icono: '!' }
    if (tipo === 'oportunidad') return { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700', badge: 'bg-green-100 text-green-700', icono: '+' }
    return { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', icono: '→' }
  }

  // Plan gratis — mostrar bloqueo
  if (!cargando && !esPro) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 mb-4 p-6 text-center">
        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-800 mb-1">Análisis profundo</p>
        <p className="text-xs text-gray-400 mb-4">Disponible en el plan Pro — diagnóstico completo de tu negocio con IA</p>
        <Link href="/precios" className="inline-block bg-green-600 text-white text-xs font-medium px-5 py-2 rounded-lg hover:bg-green-700 transition-all">
          Ver planes ⭐
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 mb-4">
      <div className="p-5 border-b border-gray-50">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-700">Análisis profundo</p>
            <p className="text-xs text-gray-400 mt-0.5">IA analiza todos tus datos y te da un diagnóstico completo</p>
          </div>
          <button
            onClick={generarAnalisis}
            disabled={loading || cargando}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-all flex-shrink-0 ml-3"
          >
            {loading ? 'Analizando...' : 'Analizar'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-6 text-center">
          <div className="flex justify-center gap-1 mb-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-xs text-gray-400">Analizando tu negocio en profundidad...</p>
        </div>
      )}

      {error && (
        <div className="p-5">
          <p className="text-xs text-red-500 text-center">{error}</p>
        </div>
      )}

      {analisis && (
        <div className="p-5 space-y-5">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Resumen</p>
            <p className="text-sm text-gray-800 leading-relaxed">{analisis.resumen}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs font-medium text-amber-700 mb-2">En palabras simples</p>
            <p className="text-sm text-amber-800 leading-relaxed">{analisis.explicacion_simple}</p>
          </div>
          {analisis.alertas && analisis.alertas.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Alertas y oportunidades</p>
              <div className="space-y-2">
                {analisis.alertas.map((a, i) => {
                  const estilo = iconoAlerta(a.tipo)
                  return (
                    <div key={i} className={`${estilo.bg} border ${estilo.border} rounded-xl p-3 flex gap-3`}>
                      <div className={`w-5 h-5 rounded-full ${estilo.badge} flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5`}>
                        {estilo.icono}
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${estilo.text} mb-0.5`}>{a.titulo}</p>
                        <p className={`text-xs ${estilo.text} opacity-80`}>{a.descripcion}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {analisis.accion_principal && (
            <div className="bg-green-600 rounded-xl p-4">
              <p className="text-xs font-medium text-green-100 mb-1">Acción para hoy</p>
              <p className="text-sm text-white font-medium">{analisis.accion_principal}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}