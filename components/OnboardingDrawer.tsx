'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const PASOS = [
  {
    numero: 1,
    emoji: '👋',
    titulo: 'Cuéntanos de ti',
    descripcion: 'Tu nombre y el de tu negocio para personalizar todo.',
  },
  {
    numero: 2,
    emoji: '📦',
    titulo: 'Tu primer producto',
    descripcion: 'Agrega algo que vendas o uses en tu negocio.',
  },
  {
    numero: 3,
    emoji: '💸',
    titulo: 'Tu primer movimiento',
    descripcion: 'Registra una venta o gasto para ver cómo funciona.',
  },
  {
    numero: 4,
    emoji: '🤝',
    titulo: 'Conoce a tu Socio',
    descripcion: 'Tu asesor financiero con IA que conoce todos tus datos.',
  },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid var(--input-border)',
  borderRadius: 10,
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
  color: 'var(--input-text)',
  background: 'var(--input-bg)',
  transition: 'border-color 0.2s',
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--muted)',
  display: 'block',
  marginBottom: 6,
}

interface Props {
  userId: string
  negocioId: string
  onCompletado: () => void
}

export default function OnboardingDrawer({ userId, negocioId, onCompletado }: Props) {
  const [visible, setVisible] = useState(false)
  const [pasoActual, setPasoActual] = useState(0)
  const [animando, setAnimando] = useState(false)

  const [nombreDueno, setNombreDueno] = useState('')
  const [nombreNegocio, setNombreNegocio] = useState('')
  const [prodNombre, setProdNombre] = useState('')
  const [prodPrecio, setProdPrecio] = useState('')
  const [prodStock, setProdStock] = useState('')
  const [movTexto, setMovTexto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  function cerrar() {
    setVisible(false)
    setTimeout(onCompletado, 400)
  }

  async function saltarTodo() {
    const supabase = createClient()
    await supabase.from('negocios').update({ onboarding_completado: true }).eq('id', negocioId)
    cerrar()
  }

  async function siguiente() {
    setError('')
    setGuardando(true)
    try {
      const supabase = createClient()

      if (pasoActual === 0) {
        if (!nombreDueno.trim()) {
          setError('Escribe tu nombre para continuar.')
          setGuardando(false)
          return
        }
        const updates: Record<string, string> = { nombre_dueno: nombreDueno.trim() }
        if (nombreNegocio.trim()) updates.nombre = nombreNegocio.trim()
        await supabase.from('negocios').update(updates).eq('id', negocioId)
      }

      if (pasoActual === 1 && prodNombre.trim()) {
        await supabase.from('productos').insert({
          user_id: userId,
          nombre: prodNombre.trim(),
          precio: parseFloat(prodPrecio) || 0,
          stock: parseFloat(prodStock) || 0,
          costo: 0,
          stock_minimo: 1,
          categoria: 'general',
        })
      }

      if (pasoActual === 2 && movTexto.trim()) {
        await fetch('/api/movimientos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texto: movTexto.trim() }),
        })
      }

      if (pasoActual === 3) {
        await supabase.from('negocios').update({ onboarding_completado: true }).eq('id', negocioId)
        setGuardando(false)
        cerrar()
        return
      }

      setAnimando(true)
      setTimeout(() => {
        setPasoActual((p) => p + 1)
        setAnimando(false)
      }, 200)
    } catch {
      setError('Hubo un problema. Intenta de nuevo.')
    }
    setGuardando(false)
  }

  const paso = PASOS[pasoActual]
  const esUltimoPaso = pasoActual === 3
  const puedeSkipPaso = pasoActual === 1 || pasoActual === 2

  return (
    <>
      {/* Overlay */}
      <div
        onClick={saltarTodo}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 40,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.35s ease',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '420px',
          background: 'var(--card)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#15803d' }}>Socio Pro</span>
              <span style={{
                fontSize: 11,
                background: '#dcfce7',
                color: '#15803d',
                padding: '2px 8px',
                borderRadius: 99,
                fontWeight: 500,
              }}>Configuración inicial</span>
            </div>
            <button
              onClick={saltarTodo}
              style={{
                fontSize: 12,
                color: 'var(--muted-light)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              Ahora no
            </button>
          </div>

          {/* Progreso */}
          <div style={{ display: 'flex', gap: 4, paddingBottom: 20 }}>
            {PASOS.map((_, i) => (
              <div key={i} style={{
                flex: 1,
                height: 4,
                borderRadius: 99,
                background: i <= pasoActual ? '#16a34a' : 'var(--input-border)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div style={{
          flex: 1,
          padding: '32px 24px',
          overflowY: 'auto',
          opacity: animando ? 0 : 1,
          transform: animando ? 'translateX(20px)' : 'translateX(0)',
          transition: 'opacity 0.2s, transform 0.2s',
        }}>
          {/* Título del paso */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{paso.emoji}</div>
            <div style={{ fontSize: 11, color: 'var(--muted-light)', marginBottom: 4, fontWeight: 500 }}>
              PASO {paso.numero} DE {PASOS.length}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 8px' }}>
              {paso.titulo}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
              {paso.descripcion}
            </p>
          </div>

          {/* Paso 1 — nombre */}
          {pasoActual === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>¿Cómo te llamas? *</label>
                <input
                  type="text"
                  value={nombreDueno}
                  onChange={(e) => setNombreDueno(e.target.value)}
                  placeholder="Ej: Claudia, Don Pepe, María..."
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#16a34a')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--input-border)')}
                  autoFocus
                />
              </div>
              <div>
                <label style={labelStyle}>
                  ¿Cómo se llama tu negocio?{' '}
                  <span style={{ color: 'var(--muted-light)', fontWeight: 400 }}>(opcional)</span>
                </label>
                <input
                  type="text"
                  value={nombreNegocio}
                  onChange={(e) => setNombreNegocio(e.target.value)}
                  placeholder="Ej: La Cocinería de Claudia"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#16a34a')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--input-border)')}
                />
              </div>
            </div>
          )}

          {/* Paso 2 — producto */}
          {pasoActual === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nombre del producto</label>
                <input
                  type="text"
                  value={prodNombre}
                  onChange={(e) => setProdNombre(e.target.value)}
                  placeholder="Ej: Completo, Empanada, Café..."
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#16a34a')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--input-border)')}
                  autoFocus
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Precio de venta ($)</label>
                  <input
                    type="number"
                    value={prodPrecio}
                    onChange={(e) => setProdPrecio(e.target.value)}
                    placeholder="2500"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = '#16a34a')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--input-border)')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Stock inicial</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="10"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = '#16a34a')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--input-border)')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Paso 3 — movimiento */}
          {pasoActual === 2 && (
            <div>
              <label style={labelStyle}>Escribe un movimiento en español natural</label>
              <input
                type="text"
                value={movTexto}
                onChange={(e) => setMovTexto(e.target.value)}
                placeholder='Ej: "vendí 3 completos a 2500" o "pagué 5 lucas de gas"'
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#16a34a')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--input-border)')}
                autoFocus
              />
              <p style={{ fontSize: 12, color: 'var(--muted-light)', marginTop: 8 }}>
                El sistema entiende montos como "5 lucas", "2 palos", "mil 500", etc.
              </p>
            </div>
          )}

          {/* Paso 4 — presentación Socio */}
          {pasoActual === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: '🎓', titulo: 'Experto', desc: 'Te dará análisis financieros basados en tus datos reales.' },
                { icon: '🤝', titulo: 'Socio', desc: 'Te hablará como un amigo que entiende de negocios — directo y sin rodeos.' },
                { icon: '📚', titulo: 'Aprende hoy', desc: 'Cada respuesta incluye un consejo práctico para tu tipo de negocio.' },
              ].map((item) => (
                <div key={item.titulo} style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 12,
                  padding: '16px 18px',
                }}>
                  <p style={{ fontSize: 14, color: '#15803d', margin: '0 0 6px', fontWeight: 600 }}>
                    {item.icon} {item.titulo}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                Lo encuentras en la pestaña{' '}
                <strong style={{ color: 'var(--foreground)' }}>Socio</strong>{' '}
                del menú inferior.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <p style={{
              fontSize: 13,
              color: '#dc2626',
              marginTop: 12,
              background: '#fef2f2',
              padding: '8px 12px',
              borderRadius: 8,
            }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          background: 'var(--card)',
          borderTop: '1px solid var(--card-border)',
          display: 'flex',
          gap: 10,
        }}>
          {puedeSkipPaso && (
            <button
              onClick={() => {
                setAnimando(true)
                setTimeout(() => {
                  setPasoActual((p) => p + 1)
                  setAnimando(false)
                }, 200)
              }}
              style={{
                flex: 1,
                padding: '12px',
                border: '1.5px solid var(--input-border)',
                borderRadius: 10,
                background: 'var(--card)',
                fontSize: 14,
                color: 'var(--muted)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Saltar
            </button>
          )}
          <button
            onClick={siguiente}
            disabled={guardando}
            style={{
              flex: 2,
              padding: '12px',
              background: guardando ? '#86efac' : '#16a34a',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              color: 'white',
              cursor: guardando ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              transition: 'background 0.2s',
            }}
          >
            {guardando ? 'Guardando...' : esUltimoPaso ? '¡Listo, empecemos! 🚀' : 'Continuar →'}
          </button>
        </div>
      </div>
    </>
  )
}