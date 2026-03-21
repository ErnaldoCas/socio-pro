'use client'
import { useState, useRef, useEffect } from 'react'

export default function SocioChat({ inputId = 'socio-input' }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! Soy tu Socio Experto. Pregúntame lo que quieras sobre tu negocio.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function enviar(texto) {
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

  return (
    <div className="bg-white rounded-xl border border-gray-100 mt-4">
      <div className="p-4 border-b border-gray-50">
        <p className="text-sm font-medium text-gray-700">Socio Experto</p>
        <p className="text-xs text-gray-400">Tu asesor de negocios personal</p>
      </div>

      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-green-600 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }`}>
              {m.content}
            </div>
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