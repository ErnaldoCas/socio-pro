'use client'
import { useState } from 'react'

export default function VoiceInput({ onResult }) {
  const [escuchando, setEscuchando] = useState(false)

  function iniciarVoz() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Tu navegador no soporta voz. Usa Chrome.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'es-CL'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setEscuchando(true)
    recognition.onend = () => setEscuchando(false)

    recognition.onresult = (event) => {
      const texto = event.results[0][0].transcript
      onResult(texto)
    }

    recognition.onerror = () => setEscuchando(false)

    recognition.start()
  }

  return (
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
  )
}