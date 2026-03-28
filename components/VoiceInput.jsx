'use client'
import { useState, useRef } from 'react'

export default function VoiceInput({ onResult }) {
  const [estado, setEstado] = useState('idle')
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const audioContextRef = useRef(null)

  async function iniciar() {
    if (estado !== 'idle') return
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

          const res = await fetch('/api/voz', {
            method: 'POST',
            body: formData
          })

          const data = await res.json()

          if (data.texto?.trim()) {
            const texto = data.texto.trim()

            // ✅ CONFIRMACIÓN SIN UI EXTRA
            const ok = window.confirm(`¿Usar este texto?\n\n"${texto}"`)

            if (ok) {
              onResult(texto)
            }

            setError('')
          } else {
            setError('No se entendió, intenta de nuevo.')
          }
        } catch {
          setError('Error al procesar.')
        }

        setEstado('idle')
      }

      mediaRecorder.start(100)
      setEstado('grabando')

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
        for (let i = 0; i < dataArray.length; i++) {
          suma += Math.abs(dataArray[i] - 128)
        }

        const volumen = suma / dataArray.length

        if (volumen < 3) {
          silencioConsecutivo++
          if (silencioConsecutivo > 45) {
            detener()
            return
          }
        } else {
          silencioConsecutivo = 0
        }

        requestAnimationFrame(detectarSilencio)
      }

      setTimeout(() => {
        requestAnimationFrame(detectarSilencio)
      }, 500)

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

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={estado === 'idle' ? iniciar : detener}
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
        {estado === 'grabando' ? '🔴' : estado === 'procesando' ? '⏳' : '🎤'}
      </button>

      {estado === 'grabando' && (
        <p className="text-xs text-red-400 animate-pulse">escuchando...</p>
      )}

      {estado === 'procesando' && (
        <p className="text-xs text-blue-400">procesando...</p>
      )}

      {error && estado === 'idle' && (
        <p className="text-xs text-red-400 max-w-40 text-right leading-tight">
          {error}
        </p>
      )}
    </div>
  )
}