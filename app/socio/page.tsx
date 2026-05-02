'use client'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import SocioChat from '@/components/SocioChat'
import AnalisisProfundo from '@/components/AnalisisProfundo'
import VoiceInput from '@/components/VoiceInput'
import { useState } from 'react'
import { usePlan } from '@/hooks/usePlan'
import Link from 'next/link'

export default function Socio() {
  const [sugerencia, setSugerencia] = useState('')
  const [textoVoz, setTextoVoz] = useState('')
  const { esPro } = usePlan()

  function handleVoz(texto: string) {
    setSugerencia(texto)
    setTextoVoz(texto)
    setTimeout(() => setTextoVoz(''), 3000)
  }

  return (
    <AuthGuard>
      {/* Fondo degradado verde sutil */}
      <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #f9fafb 40%)' }}>
        <main className="p-4 pt-16 pb-24">
          <div className="max-w-2xl mx-auto">

            {/* Header con gradiente */}
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

            {/* ✅ 1. MICRÓFONO — primero y destacado */}
            <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-medium text-gray-700">🎤 Habla con tu Socio IA</span>
                {!esPro && (
                  <span className="ml-auto text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                    2 consultas/día
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <VoiceInput onResult={handleVoz} />
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 min-h-[40px] flex items-center">
                  {textoVoz ? (
                    <p className="text-sm text-green-700 font-medium">"{textoVoz}" ✓</p>
                  ) : (
                    <p className="text-xs text-gray-400">Toca el micrófono y habla directo...</p>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ 2. PREGUNTAS SUGERIDAS */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2 px-1">💬 O elige una pregunta rápida</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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

            {/* ✅ 3. CHAT — centro de la experiencia */}
            <SocioChat inputId="socio-input" suggestion={sugerencia} />

            {/* ✅ 4. ANÁLISIS PROFUNDO — separado abajo con divisor */}
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