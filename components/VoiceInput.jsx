'use client'
import { useState, useRef } from 'react'

export default function VoiceInput({ onResult }) {
  const [escuchando, setEscuchando] = useState(false)
  const [error, setError] = useState('')
  const [intentos, setIntentos] = useState(0)
  const recognitionRef = useRef(null)

  function iniciar() {
    setError('')

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Tu navegador no soporta voz.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

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
      setIntentos(0)
      setError('')
      onResult(texto)
    }

    recognition.onerror = (event) => {
      setEscuchando(false)

      if (event.error === 'network') {
        // Reintenta automáticamente hasta 2 veces
        if (intentos < 2) {
          setIntentos(prev => prev + 1)
          setError('Reintentando...')
          setTimeout(() => iniciar(), 800)
        } else {
          setIntentos(0)
          setError('Error de red. Verifica tu conexión e intenta de nuevo.')
        }
        return
      }

      if (event.error === 'not-allowed') {
        setError('Permiso denegado. Actívalo en Ajustes del navegador.')
        return
      }

      if (event.error === 'no-speech') {
        setError('No se detectó voz. Intenta de nuevo.')
        return
      }

      if (event.error === 'audio-capture') {
        setError('No se detectó micrófono en el dispositivo.')
        return
      }

      setError('No se pudo usar el micrófono. Intenta de nuevo.')
    }

    try {
      recognition.start()
    } catch (e) {
      setEscuchando(false)
      setError('No se pudo iniciar. Intenta de nuevo.')
    }
  }

  function detener() {
    recognitionRef.current?.stop()
    setEscuchando(false)
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onPointerDown={escuchando ? detener : iniciar}
        type="button"
        className={`p-2.5 rounded-lg border text-sm transition-all select-none ${
          escuchando
            ? 'bg-red-50 border-red-300 text-red-500 animate-pulse'
            : error && !error.includes('Reintentando')
            ? 'bg-orange-50 border-orange-200 text-orange-500'
            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
        }`}
        title={escuchando ? 'Toca para detener' : 'Toca para hablar'}
      >
        {escuchando ? '🔴' : '🎤'}
      </button>
      {error && (
        <p className={`text-xs max-w-48 text-right leading-tight ${
          error.includes('Reintentando') ? 'text-blue-400' : 'text-red-400'
        }`}>
          {error}
        </p>
      )}
    </div>
  )
}