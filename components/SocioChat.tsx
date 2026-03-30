'use client'
import { useState, useRef, useEffect } from 'react'

function formatearRespuesta(content: string) {
  const tieneFormato = content.includes('🎓') || content.includes('🤝') || content.includes('📚')
  if (!tieneFormato) return <p className="text-sm text-gray-800 leading-relaxed">{content}</p>

  const bloques = []

  const experto = content.match(/🎓[^\n]*\n([\s\S]*?)(?=🤝|$)/)
  const socio = content.match(/🤝[^\n]*\n([\s\S]*?)(?=📚|$)/)
  const aprende = content.match(/📚[^\n]*\n([\s\S]*)/)

  if (experto?.[1]?.trim()) {
    bloques.push(
      <div key="experto" className="mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-base">🎓</span>
          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Experto</span>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl px-3 py-2.5">
          <p className="text-xs text-purple-900 leading-relaxed whitespace-pre-wrap">{experto[1].trim()}</p>
        </div>
      </div>
    )
  }

  if (socio?.[1]?.trim()) {
    bloques.push(
      <div key="socio" className="mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-base">🤝</span>
          <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Socio</span>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
          <p className="text-xs text-green-900 leading-relaxed whitespace-pre-wrap">{socio[1].trim()}</p>
        </div>
      </div>
    )
  }

  if (aprende?.[1]?.trim()) {
    const terminos = aprende[1].trim().split('\n').filter(l => l.trim())
    bloques.push(
      <div key="aprende">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-base">📚</span>
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Aprende hoy</span>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 space-y-1.5">
          {terminos.map((t, i) => {
            const limpio = t.replace(/\*\*/g, '').replace(/^[-•]\s*/, '').trim()
            const partes = limpio.split(':')
            if (partes.length >= 2) {
              return (
                <div key={i}>
                  <span className="text-xs font-semibold text-amber-800">{partes[0].trim()}: </span>
                  <span className="text-xs text-amber-900">{partes.slice(1).join(':').trim()}</span>
                </div>
              )
            }
            return <p key={i} className="text-xs text-amber-900">{limpio}</p>
          })}
        </div>
      </div>
    )
  }

  if (bloques.length === 0) {
    return <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{content}</p>
  }

  return <div>{bloques}</div>
}

interface Message {
  role: string
  content: string
}

export default function SocioChat({ inputId = 'socio-input', suggestion = '' }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy tu Socio Experto. Cada respuesta tiene 3 partes: análisis profesional, explicación simple y un término para aprender. ¡Pregúntame lo que quieras!' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  // guardando: índice del mensaje que se está guardando, guardado: índices ya guardados
  const [guardando, setGuardando] = useState<number | null>(null)
  const [guardados, setGuardados] = useState<Set<number>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (suggestion) setInput(suggestion)
  }, [suggestion])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function enviar(texto?: string) {
    const msg = texto || input
    if (!msg.trim() || loading) return
    const userMsg = { role: 'user', content: msg }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/socio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      })
      const data = await res.json()
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'No pude conectarme. Intenta de nuevo.' }])
    }
    setLoading(false)
  }

  async function guardarAnalisis(idx: number) {
    // Buscar la pregunta del usuario justo antes de esta respuesta
    const respuesta = messages[idx].content
    const pregunta = messages[idx - 1]?.content || 'Análisis general'

    setGuardando(idx)
    try {
      const res = await fetch('/api/analisis-historial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta, respuesta })
      })
      if (res.ok) {
        setGuardados(prev => new Set([...prev, idx]))
      }
    } catch {
      // silencioso
    }
    setGuardando(null)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 mt-4">
      <div className="p-4 border-b border-gray-50">
        <p className="text-sm font-medium text-gray-700">Socio Experto</p>
        <p className="text-xs text-gray-400">Análisis profesional + explicación simple + aprende algo nuevo</p>
      </div>

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            {m.role === 'user' ? (
              <div className="max-w-xs px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed bg-green-600 text-white">
                {m.content}
              </div>
            ) : (
              <div className="w-full">
                {formatearRespuesta(m.content)}
                {/* Botón guardar — solo en respuestas del asistente que no sean el saludo inicial */}
                {i > 0 && (
                  <div className="mt-2 flex justify-end">
                    {guardados.has(i) ? (
                      <span className="text-xs text-green-600 font-medium">✓ Guardado en Reportes</span>
                    ) : (
                      <button
                        onClick={() => guardarAnalisis(i)}
                        disabled={guardando === i}
                        className="text-xs text-gray-400 hover:text-green-600 border border-gray-200 hover:border-green-300 px-3 py-1 rounded-full transition-all disabled:opacity-50"
                      >
                        {guardando === i ? 'Guardando...' : '💾 Guardar análisis'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-50 flex gap-2">
        <input
          id={inputId}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
          placeholder="¿En qué estoy perdiendo plata?"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400 text-gray-800 placeholder-gray-400 bg-white"
        />
        <button
          onClick={() => enviar()}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  )
}