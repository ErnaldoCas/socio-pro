'use client'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import SocioChat from '@/components/SocioChat'
import AnalisisProfundo from '@/components/AnalisisProfundo'
import VoiceInput from '@/components/VoiceInput'
import { useState, useRef } from 'react'
import { usePlan } from '@/hooks/usePlan'
import Link from 'next/link'

export default function Socio() {
  const [sugerencia, setSugerencia] = useState('')
  const [textoVoz, setTextoVoz] = useState('')
  const { esPro } = usePlan()

  function handleVoz(texto: string) {
    // Pone el texto en el input del chat y lo envía automáticamente
    setSugerencia(texto)
    setTextoVoz(texto)
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-100 p-4 pt-16 pb-24">
        <div className="max-w-2xl mx-auto">

          <div className="mb-4 pt-2">
            <h1 className="text-2xl font-semibold text-gray-800">Socio IA 🤖</h1>
            <p className="text-gray-500 text-sm">Tu asesor financiero personal — siempre disponible</p>
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

          <AnalisisProfundo />

          {/* Preguntas sugeridas */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">💬 Pregúntale algo concreto</p>
            <div className="flex flex-wrap gap-2">
              {[
                '¿En qué estoy perdiendo plata?',
                '¿Cuál es mi producto más rentable?',
                '¿Cómo estuvo esta semana?',
                '¿Qué debería mejorar urgente?',
                '¿Cuánto debería cobrar?',
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => setSugerencia(q)}
                  className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* ✅ Input de voz funcional */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
            <p className="text-xs font-medium text-gray-500 mb-3">🎤 O háblale directo</p>
            <div className="flex items-center gap-3">
              <VoiceInput onResult={handleVoz} />
              <div className="flex-1">
                {textoVoz ? (
                  <p className="text-sm text-green-700 font-medium">"{textoVoz}" ✓</p>
                ) : (
                  <p className="text-xs text-gray-400">Toca el micrófono y habla natural.<br/>Ej: "¿cuánto gané esta semana?"</p>
                )}
              </div>
            </div>
          </div>

          <SocioChat inputId="socio-input" suggestion={sugerencia} />

        </div>
      </main>
      <NavBar />
    </AuthGuard>
  )
}