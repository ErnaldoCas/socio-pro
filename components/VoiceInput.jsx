'use client'
import { useState, useRef } from 'react'

export default function VoiceInput({ onResult }) {
  const [estado, setEstado] = useState('idle') // idle | grabando | procesando
  const [error, setError] = useState('')
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  async function iniciarGrabacion() {
    setError('')

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador no soporta grabación de audio.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Detiene todos los tracks del micrófono
        stream.getTracks().forEach(t => t.stop())

        setEstado('procesando')

        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType
        })

        try {
          const formData = new FormData()
          formData.append('audio', blob, 'audio.webm')

          const res = await fetch('/api/voz', {
            method: 'POST',
            body: formData
          })

          const data = await res.json()

          if (data.texto) {
            onResult(data.texto)
            setError('')
          } else {
            setError('No se entendió. Intenta de nuevo.')
          }
        } catch {
          setError('Error al procesar el audio.')
        }

        setEstado('idle')
      }

      mediaRecorder.start()
      setEstado('grabando')

    } catch (err) {
      setError('Permiso de micrófono denegado.')
      setEstado('idle')
    }
  }

  function detenerGrabacion() {
    if (mediaRecorderRef.current && estado === 'grabando') {
      mediaRecorderRef.current.stop()
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={estado === 'grabando' ? detenerGrabacion : iniciarGrabacion}
        disabled={estado === 'procesando'}
        type="button"
        className={`p-2.5 rounded-lg border text-sm transition-all ${
          estado === 'grabando'
            ? 'bg-red-50 border-red-300 text-red-500 animate-pulse'
            : estado === 'procesando'
            ? 'bg-blue-50 border-blue-200 text-blue-400'
            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
        }`}
        title={
          estado === 'grabando' ? 'Toca para detener'
          : estado === 'procesando' ? 'Procesando...'
          : 'Toca para hablar'
        }
      >
        {estado === 'grabando' ? '🔴' : estado === 'procesando' ? '⏳' : '🎤'}
      </button>
      {estado === 'grabando' && (
        <p className="text-xs text-red-400 text-right">Grabando... toca para detener</p>
      )}
      {estado === 'procesando' && (
        <p className="text-xs text-blue-400 text-right">Procesando...</p>
      )}
      {error && estado === 'idle' && (
        <p className="text-xs text-red-400 max-w-40 text-right leading-tight">{error}</p>
      )}
    </div>
  )
}