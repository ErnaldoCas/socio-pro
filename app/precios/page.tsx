'use client'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import { usePlan } from '@/hooks/usePlan'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function Precios() {
  const { plan, esPro, vence, cargando } = usePlan()
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const pagoExitoso = searchParams.get('pago') === 'exitoso'

  async function suscribirse() {
    setProcesando(true)
    setError('')
    try {
      const res = await fetch('/api/suscripcion', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'No se pudo iniciar el pago')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    }
    setProcesando(false)
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-100 p-4 pt-16 pb-24">
        <div className="max-w-lg mx-auto">

          <div className="mb-6 pt-2 text-center">
            <h1 className="text-2xl font-semibold text-gray-800">Planes</h1>
            <p className="text-gray-500 text-sm mt-1">Elige el plan que mejor se adapta a tu negocio</p>
          </div>

          {/* Mensaje pago exitoso */}
          {pagoExitoso && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-center">
              <p className="text-green-700 font-medium text-sm">🎉 ¡Pago recibido! Tu plan Pro se activará en los próximos minutos.</p>
            </div>
          )}

          {/* Plan actual */}
          {!cargando && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tu plan actual</p>
                <p className="text-base font-semibold text-gray-800">
                  {esPro ? '⭐ Pro' : 'Gratis'}
                </p>
                {esPro && vence && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Próximo cobro: {new Date(vence).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}
                  </p>
                )}
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${esPro ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {esPro ? 'Activo' : 'Básico'}
              </span>
            </div>
          )}

          {/* Tarjeta plan Gratis */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-base font-semibold text-gray-800">Gratis</p>
                <p className="text-xs text-gray-400 mt-0.5">Para empezar a ordenar tu negocio</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">$0</p>
                <p className="text-xs text-gray-400">para siempre</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                '100 movimientos por mes',
                'Inventario ilimitado',
                'Dashboard y métricas',
                'Socio Experto (chat IA)',
                'Notificaciones push',
                'Reportes básicos',
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">{f}</p>
                </div>
              ))}
              {[
                'Colaboradores',
                'Análisis profundo',
                'Exportar Excel',
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 opacity-40">
                  <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400">{f}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tarjeta plan Pro */}
          <div className="bg-white rounded-xl border-2 border-green-500 p-5 mb-4 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-green-600 text-white text-xs font-medium px-4 py-1 rounded-full">
                Recomendado
              </span>
            </div>
            <div className="flex justify-between items-start mb-4 mt-1">
              <div>
                <p className="text-base font-semibold text-gray-800">Pro ⭐</p>
                <p className="text-xs text-gray-400 mt-0.5">Para negocios que quieren crecer</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">$7.990</p>
                <p className="text-xs text-gray-400">CLP / mes</p>
              </div>
            </div>
            <div className="space-y-2 mb-5">
              {[
                'Todo lo del plan Gratis',
                'Movimientos ilimitados',
                'Colaboradores con permisos',
                'Análisis profundo con IA',
                'Exportar Excel',
                'Soporte prioritario',
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700">{f}</p>
                </div>
              ))}
            </div>

            {esPro ? (
              <div className="w-full bg-green-50 border border-green-200 rounded-lg py-3 text-center">
                <p className="text-sm font-medium text-green-700">✓ Ya tienes el plan Pro</p>
              </div>
            ) : (
              <button
                onClick={suscribirse}
                disabled={procesando || cargando}
                className="w-full bg-green-600 text-white rounded-lg py-3 text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-all"
              >
                {procesando ? 'Redirigiendo a Mercado Pago...' : 'Suscribirse — $7.990/mes'}
              </button>
            )}

            {error && (
              <p className="text-xs text-red-500 text-center mt-2">{error}</p>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center">
            Pago seguro con Mercado Pago · Cancela cuando quieras
          </p>

        </div>
      </main>
      <NavBar />
    </AuthGuard>
  )
}