'use client'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import SocioChat from '@/components/SocioChat'
import AnalisisProfundo from '@/components/AnalisisProfundo'
import { useState } from 'react'
import { usePlan } from '@/hooks/usePlan'
import Link from 'next/link'

export default function Socio() {
  const [sugerencia, setSugerencia] = useState('')
  const { esPro } = usePlan()

  return (
    <AuthGuard>
      <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #f9fafb 40%)' }}>
        <main className="p-4 pt-16 pb-24">
          <div className="max-w-2xl mx-auto">

            {/* Header */}
            <div className="mb-5 pt-2">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-green-600 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <span className="text-xl">🤖</span>
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-800">Socio IA</h1>
                  <p className="text-xs text-gray-400">Tu asesor financiero personal</p>
                </div>
                {!esPro && (
                  <Link
                    href="/precios"
                    className="ml-auto flex-shrink-0 bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-amber-600 transition-all"
                  >
                    Pro ⭐
                  </Link>
                )}
              </div>
            </div>

            {/* Banner plan gratis */}
            {!esPro && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-amber-800">2 consultas diarias en plan gratis</p>
                  <p className="text-xs text-amber-600 mt-0.5">Tu Socio IA tiene más para ti 🔒</p>
                </div>
                <Link
                  href="/precios"
                  className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                >
                  Ver Pro ⭐
                </Link>
              </div>
            )}

            {/* Preguntas sugeridas */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2 px-1">💬 Preguntas rápidas</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  '¿En qué estoy perdiendo plata?',
                  '¿Mi producto más rentable?',
                  '¿Cómo estuvo esta semana?',
                  '¿Qué mejorar urgente?',
                  '¿Cuánto debería cobrar?',
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setSugerencia(q)}
                    className="flex-shrink-0 text-xs bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-full hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat con micrófono integrado */}
            <SocioChat inputId="socio-input" suggestion={sugerencia} />

            {/* Análisis Profundo */}
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-400 font-medium px-2">Análisis avanzado</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              <AnalisisProfundo />
            </div>

          </div>
        </main>
        <NavBar />
      </div>
    </AuthGuard>
  )
}