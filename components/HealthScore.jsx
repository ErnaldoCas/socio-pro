'use client'
import { calcularHealthScore } from '@/lib/healthScore'

export default function HealthScore({ movimientos }) {
  const resultado = calcularHealthScore(movimientos)
  const score = resultado?.score ?? 0
  const estado = resultado?.estado ?? 'sin datos'
  const alertas = resultado?.alertas ?? []
  const balance = resultado?.balance ?? 0
  const margen = resultado?.margen ?? 0

  const color = score >= 85 ? '#16a34a'
    : score >= 70 ? '#65a30d'
    : score >= 50 ? '#ca8a04'
    : score >= 30 ? '#ea580c'
    : '#dc2626'

  const circunferencia = 2 * Math.PI * 36
  const progreso = circunferencia - (score / 100) * circunferencia

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 mb-4">
      <p className="text-sm font-medium text-gray-700 mb-4">Salud del negocio</p>

      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#f3f4f6" strokeWidth="8" />
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeDasharray={circunferencia}
              strokeDashoffset={progreso}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold" style={{ color }}>{score}</span>
            <span className="text-xs text-gray-400">/100</span>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-base font-medium capitalize mb-1" style={{ color }}>{estado}</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p className="text-xs text-gray-400">Margen</p>
              <p className="text-sm font-medium text-gray-700">{margen}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Balance</p>
              <p className={`text-sm font-medium ${balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                ${balance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {alertas.length > 0 && (
        <div className="mt-4 space-y-2">
          {alertas.map((a, i) => (
            <div key={i} className="flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2">
              <span className="text-amber-500 text-xs mt-0.5">!</span>
              <p className="text-xs text-amber-700">{a}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}