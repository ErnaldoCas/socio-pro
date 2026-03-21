'use client'
import SocioChat from '@/components/SocioChat'

export default function Socio() {
  return (
    <main className="min-h-screen bg-gray-100 p-4 pb-24">
      <div className="max-w-2xl mx-auto">

        <div className="mb-6 pt-2">
          <h1 className="text-2xl font-semibold text-gray-800">Socio Experto</h1>
          <p className="text-gray-500 text-sm">Tu asesor de negocios personal</p>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
          <p className="text-xs font-medium text-amber-700 mb-1">Preguntas sugeridas</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              '¿En qué estoy perdiendo plata?',
              '¿Cuál es mi producto más rentable?',
              '¿Cómo estuvo esta semana?',
              '¿Qué debería mejorar urgente?',
              '¿Cuánto debería cobrar por mis productos?'
            ].map((q, i) => (
              <button
                key={i}
                onClick={() => {
                  const input = document.querySelector('#socio-input') as HTMLInputElement
                  if (input) {
                    input.value = q
                    input.dispatchEvent(new Event('input', { bubbles: true }))
                  }
                }}
                className="text-xs bg-white border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <SocioChat inputId="socio-input" />

      </div>
    </main>
  )
}