'use client'
import { useState } from 'react'

export default function VoiceInput({ onResult }) {
  const [escuchando, setEscuchando] = useState(false)
  const [error, setError] = useState('')

  function toggleVoz() {
    setError('')

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Usa Chrome para usar el micrófono.')
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
      // ✅ Pequeño delay para que Android Chrome termine de cerrar el micrófono
      // antes de actualizar el estado de React
      setTimeout(() => {
        onResult(texto)
      }, 150)
    }

    recognition.onerror = (event) => {
      setEscuchando(false)
      if (event.error === 'not-allowed') {
        setError('Permiso denegado. Actívalo en ajustes.')
      } else if (event.error === 'no-speech') {
        setError('No se detectó voz.')
      } else if (event.error === 'network') {
        setError('Error de red. Intenta de nuevo.')
      } else {
        setError('Error: ' + event.error)
      }
    }

    recognition.start()
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={toggleVoz}
        type="button"
        disabled={escuchando}
        className={`p-2.5 rounded-lg border text-sm transition-all ${
          escuchando
            ? 'bg-red-50 border-red-300 text-red-500 animate-pulse'
            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
        }`}
      >
        {escuchando ? '🔴' : '🎤'}
      </button>
      {error && (
        <p className="text-xs text-red-400 max-w-40 text-right leading-tight">
          {error}
        </p>
      )}
    </div>
  )
}