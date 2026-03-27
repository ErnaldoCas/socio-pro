'use client'
import { useState } from 'react'

export default function WelcomeModal({ onGuardar }: { onGuardar: (nombre: string) => void }) {
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)

  async function guardar() {
    if (!nombre.trim()) return
    setLoading(true)
    await fetch('/api/negocio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'guardar_nombre_dueno', nombre: nombre.trim() })
    })
    setLoading(false)
    onGuardar(nombre.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">

        <div className="text-center mb-6">
          <div className="text-4xl mb-3">👋</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">¡Bienvenido a Socio Pro!</h2>
          <p className="text-sm text-gray-500">Para que tu experiencia sea más personal, ¿cómo te llamas?</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && guardar()}
            placeholder="Tu nombre o apodo"
            autoFocus
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-400"
          />
          <button
            onClick={guardar}
            disabled={!nombre.trim() || loading}
            className="w-full bg-green-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-all"
          >
            {loading ? 'Guardando...' : '¡Listo!'}
          </button>
        </div>

      </div>
    </div>
  )
}