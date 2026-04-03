'use client'
import { usePlan } from '@/hooks/usePlan'
import Link from 'next/link'

interface Props {
  children: React.ReactNode
  feature?: string
  fallback?: React.ReactNode
}

export default function ProGate({ children, feature, fallback }: Props) {
  const { esPro, cargando } = usePlan()

  if (cargando) return <>{children}</>
  if (esPro) return <>{children}</>
  if (fallback) return <>{fallback}</>

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
      <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-800 mb-1">
        {feature || 'Función exclusiva Pro'}
      </p>
      <p className="text-xs text-gray-400 mb-4">
        Disponible en el plan Pro por $7.990/mes
      </p>
      <Link href="/precios" className="inline-block bg-green-600 text-white text-xs font-medium px-5 py-2 rounded-lg hover:bg-green-700 transition-all">
        Ver planes ⭐
      </Link>
    </div>
  )
}