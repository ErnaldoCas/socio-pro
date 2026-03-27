'use client'
import { useState, useRef } from 'react'

export default function VoiceInput({ onResult }) {
  const [estado, setEstado] = useState('idle') // idle | grabando | procesando
  const [error, setError] = useState('')
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  async function iniciarGrabacion() {
    setError('')

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador no soporta grabación.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })

      streamRef.current = stream
      chunksRef.current = []

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setEstado('procesando')

        const blob = new Blob(chunksRef.current, { type: mimeType })

        // Mínimo 0.5 segundos de audio para procesar
        if (blob.size < 1000) {
          setError('Grabación muy corta. Mantén presionado y habla.')
          setEstado('idle')
          return
        }

        try {
          const formData = new FormData()
          formData.append('audio', blob, 'audio.webm')

          const res = await fetch('/api/voz', {
            method: 'POST',
            body: formData
          })

          const data = await res.json()

          if (data.texto?.trim()) {
            onResult(data.texto.trim())
            setError('')
          } else {
            setError('No se entendió. Intenta de nuevo.')
          }
        } catch {
          setError('Error al procesar. Intenta de nuevo.')
        }

        setEstado('idle')
      }

      mediaRecorder.start(100) // Captura chunks cada 100ms
      setEstado('grabando')

    } catch {
      setError('Permiso de micrófono denegado.')
      setEstado('idle')
    }
  }

  function detenerGrabacion() {
    if (mediaRecorderRef.current && estado === 'grabando') {
      mediaRecorderRef.current.stop()
    }
  }

  // ✅ Manejo táctil para móvil
  function handleTouchStart(e) {
    e.preventDefault()
    if (estado === 'idle') iniciarGrabacion()
  }

  function handleTouchEnd(e) {
    e.preventDefault()
    if (estado === 'grabando') detenerGrabacion()
  }

  // ✅ Manejo mouse para escritorio
  function handleMouseDown() {
    if (estado === 'idle') iniciarGrabacion()
  }

  function handleMouseUp() {
    if (estado === 'grabando') detenerGrabacion()
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        disabled={estado === 'procesando'}
        type="button"
        className={`p-2.5 rounded-lg border text-sm transition-all select-none ${
          estado === 'grabando'
            ? 'bg-red-500 border-red-400 text-white scale-110 shadow-lg shadow-red-200'
            : estado === 'procesando'
            ? 'bg-blue-50 border-blue-200 text-blue-400'
            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 active:scale-95'
        }`}
        title={
          estado === 'grabando' ? 'Suelta para enviar'
          : estado === 'procesando' ? 'Procesando...'
          : 'Mantén presionado para hablar'
        }
      >
        {estado === 'grabando' ? '🔴' : estado === 'procesando' ? '⏳' : '🎤'}
      </button>

      {/* Instrucción contextual */}
      {estado === 'idle' && !error && (
        <p className="text-xs text-gray-300 text-right">mantén presionado</p>
      )}
      {estado === 'grabando' && (
        <p className="text-xs text-red-400 text-right animate-pulse">escuchando...</p>
      )}
      {estado === 'procesando' && (
        <p className="text-xs text-blue-400 text-right">procesando...</p>
      )}
      {error && estado === 'idle' && (
        <p className="text-xs text-red-400 max-w-40 text-right leading-tight">{error}</p>
      )}
    </div>
  )
}