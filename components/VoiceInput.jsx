'use client'
import { useState, useRef } from 'react'

export default function VoiceInput({ onResult }) {
  const [estado, setEstado] = useState('idle')
  const [textoTranscrito, setTextoTranscrito] = useState('')
  const [error, setError] = useState('')
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const audioContextRef = useRef(null)

  async function iniciar() {
    setError('')
    setTextoTranscrito('')

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador no soporta grabación.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }
      })

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
        if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
        }

        setEstado('procesando')

        const blob = new Blob(chunksRef.current, { type: mimeType })

        if (blob.size < 1000) {
          setError('Muy corto, intenta de nuevo.')
          setEstado('idle')
          return
        }

        try {
          const formData = new FormData()
          formData.append('audio', blob, 'audio.webm')
          const res = await fetch('/api/voz', { method: 'POST', body: formData })
          const data = await res.json()

          if (data.texto?.trim()) {
            setTextoTranscrito(data.texto.trim())
            setEstado('confirmar')
          } else {
            setError('No se entendió, intenta de nuevo.')
            setEstado('idle')
          }
        } catch {
          setError('Error al procesar.')
          setEstado('idle')
        }
      }

      mediaRecorder.start(100)
      setEstado('grabando')

      // Detección de silencio automática
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      analyser.fftSize = 512
      const dataArray = new Uint8Array(analyser.fftSize)
      let silencioConsecutivo = 0

      function detectarSilencio() {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return
        analyser.getByteTimeDomainData(dataArray)
        let suma = 0
        for (let i = 0; i < dataArray.length; i++) suma += Math.abs(dataArray[i] - 128)
        const volumen = suma / dataArray.length
        if (volumen < 3) {
          silencioConsecutivo++
          if (silencioConsecutivo > 45) { detener(); return }
        } else {
          silencioConsecutivo = 0
        }
        requestAnimationFrame(detectarSilencio)
      }

      setTimeout(() => requestAnimationFrame(detectarSilencio), 500)

    } catch {
      setError('Permiso de micrófono denegado.')
      setEstado('idle')
    }
  }

  function detener() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  function confirmar() {
    onResult(textoTranscrito)
    setTextoTranscrito('')
    setEstado('idle')
  }

  function reintentar() {
    setTextoTranscrito('')
    setEstado('idle')
  }

  return (
    <div className="flex flex-col items-end gap-1">

      {/* Botón principal */}
      {(estado === 'idle' || estado === 'grabando' || estado === 'procesando') && (
        <button
          onClick={estado === 'idle' ? iniciar : estado === 'grabando' ? detener : undefined}
          disabled={estado === 'procesando'}
          type="button"
          className={`w-11 h-11 rounded-xl border text-lg transition-all select-none flex items-center justify-center ${
            estado === 'grabando'
              ? 'bg-red-500 border-red-400 text-white shadow-md animate-pulse'
              : estado === 'procesando'
              ? 'bg-blue-50 border-blue-200 text-blue-400'
              : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-green-50 hover:border-green-300 active:scale-95'
          }`}
        >
          {estado === 'grabando' ? '⏹' : estado === 'procesando' ? '⏳' : '🎤'}
        </button>
      )}

      {estado === 'grabando' && (
        <p className="text-xs text-red-400 animate-pulse">escuchando... toca para detener</p>
      )}
      {estado === 'procesando' && (
        <p className="text-xs text-blue-400">procesando...</p>
      )}

      {/* ✅ Vista de confirmación */}
      {estado === 'confirmar' && (
        <div className="bg-white border border-gray-200 rounded-xl p-3 w-64 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">¿Esto es lo que dijiste?</p>
          <p className="text-sm text-gray-800 font-medium mb-3 leading-snug">"{textoTranscrito}"</p>
          <div className="flex gap-2">
            <button
              onClick={reintentar}
              className="flex-1 border border-gray-200 text-gray-500 rounded-lg py-1.5 text-xs hover:bg-gray-50"
            >
              Reintentar
            </button>
            <button
              onClick={confirmar}
              className="flex-1 bg-green-600 text-white rounded-lg py-1.5 text-xs font-medium hover:bg-green-700"
            >
              Confirmar ✓
            </button>
          </div>
        </div>
      )}

      {error && estado === 'idle' && (
        <p className="text-xs text-red-400 max-w-40 text-right leading-tight">{error}</p>
      )}
    </div>
  )
}