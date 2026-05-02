'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

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
    {
      role: 'assistant',
      content: '¡Hola! Soy tu Socio IA 🤖\n\nCada respuesta tiene 3 partes:\n• 🎓 Análisis técnico con tus datos reales\n• 🤝 Explicación simple y directa\n• 📚 Algo nuevo que aprender\n\n¿Qué quieres saber de tu negocio?'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [guardando, setGuardando] = useState<number | null>(null)
  const [guardados, setGuardados] = useState<Set<number>>(new Set())
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (suggestion) setInput(suggestion)
  }, [suggestion])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function enviar(texto?: string) {
    const msg = texto || input
    if (!msg.trim() || loading || limiteAlcanzado) return

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

      if (res.status === 403) {
        const err = await res.json()
        if (err.codigo === 'LIMITE_CONSULTAS') {
          setLimiteAlcanzado(true)
          setMessages(prev => prev.slice(0, -1))
          setLoading(false)
          return
        }
      }

      const data = await res.json()
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'No pude conectarme. Intenta de nuevo.' }])
    }
    setLoading(false)
  }

  async function guardarAnalisis(idx: number) {
    const respuesta = messages[idx].content
    const pregunta = messages[idx - 1]?.content || 'Análisis general'
    setGuardando(idx)
    try {
      const res = await fetch('/api/analisis-historial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta, respuesta })
      })
      if (res.ok) setGuardados(prev => new Set([...prev, idx]))
    } catch { }
    setGuardando(null)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Header del chat */}
      <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between"
        style={{ background: 'linear-gradient(90deg, #f0fdf4, #ffffff)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-sm font-medium text-gray-700">Chat con Socio IA</p>
        </div>
        {limiteAlcanzado ? (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
            2/2 consultas hoy
          </span>
        ) : (
          <span className="text-xs text-gray-400">En línea</span>
        )}
      </div>

      {/* Banner límite alcanzado */}
      {limiteAlcanzado && (
        <div className="mx-4 mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-amber-800">Tu Socio IA tiene más para ti 🔒</p>
            <p className="text-xs text-amber-600 mt-0.5">Alcanzaste las 2 consultas diarias del plan gratis</p>
          </div>
          <Link
            href="/precios"
            className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-all shadow-sm"
          >
            Ver Pro ⭐
          </Link>
        </div>
      )}

      {/* Mensajes */}
      <div className="p-4 space-y-4 max-h-[420px] overflow-y-auto"
        style={{ background: 'linear-gradient(180deg, #fafffe 0%, #ffffff 100%)' }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            {m.role === 'user' ? (
              <div className="max-w-xs px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed bg-green-600 text-white shadow-sm">
                {m.content}
              </div>
            ) : (
              <div className="w-full">
                {/* Avatar del bot en primer mensaje */}
                {i === 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">🤖</span>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">Socio IA</span>
                  </div>
                )}
                <div className={`${i === 0 ? 'bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3' : ''}`}>
                  {formatearRespuesta(m.content)}
                </div>
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
          <div className="flex justify-start items-center gap-2">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs">🤖</span>
            </div>
            <div className="bg-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100" style={{ background: '#fafffe' }}>
        {limiteAlcanzado ? (
          <div className="text-center py-2">
            <p className="text-xs text-gray-400 mb-2">Vuelve mañana o activa Pro para consultas ilimitadas</p>
            <Link
              href="/precios"
              className="inline-block bg-green-600 text-white text-xs font-semibold px-5 py-2 rounded-xl hover:bg-green-700 transition-all shadow-sm"
            >
              Activar plan Pro ⭐
            </Link>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              id={inputId}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enviar()}
              placeholder="¿En qué estoy perdiendo plata?"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-50 text-gray-800 placeholder-gray-400 bg-white transition-all"
            />
            <button
              onClick={() => enviar()}
              disabled={loading || !input.trim()}
              className="bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-40 transition-all shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}