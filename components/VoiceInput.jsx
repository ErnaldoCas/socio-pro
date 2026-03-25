'use client'
import { useState } from 'react'

export default function VoiceInput({ onResult }) {
  const [escuchando, setEscuchando] = useState(false)
  const [error, setError] = useState('')

  function iniciarVoz() {
    setError('')

    // Chequea si el navegador soporta la API
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Tu navegador no soporta voz. Usa Chrome en Android.')
      return
    }

    // Chequea si hay HTTPS (requerido en móvil)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setError('El micrófono requiere HTTPS. Funciona en producción.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'es-CL'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setEscuchando(true)
      setError('')
    }

    recognition.onend = () => {
      setEscuchando(false)
    }

    recognition.onresult = (event) => {
      const texto = event.results[0][0].transcript
      onResult(texto)
    }

    recognition.onerror = (event) => {
      setEscuchando(false)
      if (event.error === 'not-allowed') {
        setError('Permiso de micrófono denegado. Actívalo en ajustes.')
      } else if (event.error === 'no-speech') {
        setError('No se detectó voz. Intenta de nuevo.')
      } else if (event.error === 'network') {
        setError('Error de red. Verifica tu conexión.')
      } else {
        setError('No se pudo usar el micrófono.')
      }
    }

    try {
      recognition.start()
    } catch (e) {
      setError('No se pudo iniciar el micrófono.')
      setEscuchando(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={iniciarVoz}
        type="button"
        className={`p-2.5 rounded-lg border text-sm transition-all ${
          escuchando
            ? 'bg-red-50 border-red-300 text-red-500 animate-pulse'
            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
        }`}
        title="Hablar"
      >
        {escuchando ? '🔴' : '🎤'}
      </button>
      {error && (
        <p className="text-xs text-red-400 max-w-48 text-right leading-tight">{error}</p>
      )}
    </div>
  )
}