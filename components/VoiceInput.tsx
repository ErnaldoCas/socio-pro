'use client'
import { useState, useRef } from 'react'

// ─── Parser: convierte palabras numéricas chilenas a dígitos ─────────────────
const UNIDADES: Record<string, number> = {
  'cero': 0, 'un': 1, 'uno': 1, 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4,
  'cinco': 5, 'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
  'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14, 'quince': 15,
  'dieciséis': 16, 'dieciseis': 16, 'diecisiete': 17, 'dieciocho': 18,
  'diecinueve': 19, 'veinte': 20, 'veintiuno': 21, 'veintidós': 22,
  'veintidos': 22, 'veintitrés': 23, 'veintitres': 23, 'veinticuatro': 24,
  'veinticinco': 25, 'veintiséis': 26, 'veintiseis': 26, 'veintisiete': 27,
  'veintiocho': 28, 'veintinueve': 29,
  'treinta': 30, 'cuarenta': 40, 'cincuenta': 50, 'sesenta': 60,
  'setenta': 70, 'ochenta': 80, 'noventa': 90,
  'cien': 100, 'ciento': 100, 'doscientos': 200, 'doscientas': 200,
  'trescientos': 300, 'trescientas': 300, 'cuatrocientos': 400,
  'cuatrocientas': 400, 'quinientos': 500, 'quinientas': 500,
  'seiscientos': 600, 'seiscientas': 600, 'setecientos': 700,
  'setecientas': 700, 'ochocientos': 800, 'ochocientas': 800,
  'novecientos': 900, 'novecientas': 900,
  'mil': 1000, 'millon': 1000000, 'millón': 1000000,
}

function tokensANumero(tokens: string[]): number | null {
  let total = 0
  let parcial = 0
  for (const t of tokens) {
    const val = UNIDADES[t.toLowerCase()]
    if (val === undefined) return null
    if (val === 1000000) {
      parcial = parcial === 0 ? 1000000 : parcial * 1000000
      total += parcial; parcial = 0
    } else if (val === 1000) {
      parcial = parcial === 0 ? 1000 : parcial * 1000
      total += parcial; parcial = 0
    } else if (val >= 100) {
      parcial += val
    } else {
      parcial += val
    }
  }
  return total + parcial || null
}

function normalizarNumeros(texto: string): string {
  let r = texto

  // "X lucas/luca" → X * 1000
  r = r.replace(
    /\b(un|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|veinte|\d+)\s+lucas?\b/gi,
    (_, n) => { const b = parseInt(n) || UNIDADES[n.toLowerCase()]; return b ? String(b * 1000) : _ }
  )

  // "X palos/palo" → X * 1000000
  r = r.replace(
    /\b(un|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\d+)\s+palos?\b/gi,
    (_, n) => { const b = parseInt(n) || UNIDADES[n.toLowerCase()]; return b ? String(b * 1000000) : _ }
  )

  // Expresiones fijas chilenas
  r = r.replace(/\bmedio\s+palo\b/gi, '500000')
  r = r.replace(/\bmedia\s+luca\b/gi, '500')

  // Secuencias de palabras numéricas → dígitos (ej: "dos mil quinientos" → "2500")
  const palabras = Object.keys(UNIDADES).join('|')
  const re = new RegExp(`\\b((?:(?:${palabras})(?:\\s+y\\s+|\\s+))*(?:${palabras}))\\b`, 'gi')
  r = r.replace(re, (match) => {
    const tokens = match.trim().split(/\s+(?:y\s+)?/)
    const num = tokensANumero(tokens)
    return num !== null && num > 0 ? String(num) : match
  })

  // Capitalizar primera letra
  return r.charAt(0).toUpperCase() + r.slice(1)
}
// ─────────────────────────────────────────────────────────────────────────────

export default function VoiceInput({ onResult }: { onResult: (texto: string) => void }) {
  const [estado, setEstado] = useState('idle')
  const [error, setError] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)

  async function iniciar() {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      mostrarError('Tu navegador no soporta grabación.')
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
          mostrarError('Muy corto, intenta de nuevo.')
          setEstado('idle')
          return
        }

        try {
          const formData = new FormData()
          formData.append('audio', blob, 'audio.webm')
          const res = await fetch('/api/voz', { method: 'POST', body: formData })
          const data = await res.json()

          if (data.texto?.trim()) {
            onResult(normalizarNumeros(data.texto.trim()))
          } else {
            mostrarError('No se entendió, intenta de nuevo.')
          }
        } catch {
          mostrarError('Error al procesar.')
        }

        setEstado('idle')
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
      mostrarError('Permiso de micrófono denegado.')
      setEstado('idle')
    }
  }

  function detener() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  function mostrarError(msg: string) {
    setError(msg)
    setTimeout(() => setError(''), 3000)
  }

  return (
    <div className="relative flex flex-col items-center">
      <button
        onClick={estado === 'idle' ? iniciar : estado === 'grabando' ? detener : undefined}
        disabled={estado === 'procesando'}
        type="button"
        title={
          estado === 'idle' ? 'Grabar con voz'
          : estado === 'grabando' ? 'Toca para detener'
          : 'Procesando...'
        }
        className={`w-11 h-11 rounded-xl border text-lg transition-all select-none flex items-center justify-center ${
          estado === 'grabando'
            ? 'bg-red-500 border-red-400 text-white animate-pulse'
            : estado === 'procesando'
            ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-green-50 hover:border-green-300 active:scale-95'
        }`}
      >
        {estado === 'grabando' ? '⏹' : estado === 'procesando' ? '⏳' : '🎤'}
      </button>

      {/* Error flotante — no desplaza el layout */}
      {error && (
        <p className="absolute top-12 right-0 text-xs text-red-400 bg-white border border-red-100 rounded-lg px-2 py-1 whitespace-nowrap shadow-sm z-10">
          {error}
        </p>
      )}
    </div>
  )
}