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

interface Props {
  userId: string
  negocioId: string
  onCompletado: () => void
}

export default function OnboardingDrawer({ userId, negocioId, onCompletado }: Props) {
  const [visible, setVisible] = useState(false)
  const [pasoActual, setPasoActual] = useState(0)
  const [animando, setAnimando] = useState(false)

  // Paso 1
  const [nombreDueno, setNombreDueno] = useState('')
  const [nombreNegocio, setNombreNegocio] = useState('')

  // Paso 2
  const [prodNombre, setProdNombre] = useState('')
  const [prodPrecio, setProdPrecio] = useState('')
  const [prodStock, setProdStock] = useState('')

  // Paso 3
  const [movTexto, setMovTexto] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Pequeño delay para que la animación de entrada se vea bien
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  function cerrar() {
    setVisible(false)
    setTimeout(onCompletado, 400)
  }

  async function saltarTodo() {
    const supabase = createClient()
    await supabase
      .from('negocios')
      .update({ onboarding_completado: true })
      .eq('id', negocioId)
    cerrar()
  }

  async function siguiente() {
    setError('')
    setGuardando(true)

    try {
      const supabase = createClient()

      if (pasoActual === 0) {
        // Guardar nombre dueño y negocio
        if (!nombreDueno.trim()) {
          setError('Escribe tu nombre para continuar.')
          setGuardando(false)
          return
        }
        const updates: Record<string, string> = { nombre_dueno: nombreDueno.trim() }
        if (nombreNegocio.trim()) updates.nombre = nombreNegocio.trim()
        await supabase.from('negocios').update(updates).eq('id', negocioId)
      }

      if (pasoActual === 1) {
        // Guardar producto (opcional, puede saltar)
        if (prodNombre.trim()) {
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
      }

      if (pasoActual === 2) {
        // Guardar movimiento vía API (usa el NLP parser)
        if (movTexto.trim()) {
          await fetch('/api/movimientos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto: movTexto.trim() }),
          })
        }
      }

      if (pasoActual === 3) {
        // Último paso — marcar onboarding como completado
        await supabase
          .from('negocios')
          .update({ onboarding_completado: true })
          .eq('id', negocioId)
        setGuardando(false)
        cerrar()
        return
      }

      // Animar transición al siguiente paso
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
          background: 'rgba(0,0,0,0.4)',
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
          background: 'white',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid #f3f4f6' }}>
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
                color: '#9ca3af',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              Ahora no
            </button>
          </div>

          {/* Barra de progreso */}
          <div style={{ display: 'flex', gap: 4, paddingBottom: 20 }}>
            {PASOS.map((p, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 99,
                  background: i <= pasoActual ? '#16a34a' : '#e5e7eb',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Contenido del paso */}
        <div
          style={{
            flex: 1,
            padding: '32px 24px',
            overflowY: 'auto',
            opacity: animando ? 0 : 1,
            transform: animando ? 'translateX(20px)' : 'translateX(0)',
            transition: 'opacity 0.2s, transform 0.2s',
          }}
        >
          {/* Emoji + título */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{paso.emoji}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, fontWeight: 500 }}>
              PASO {paso.numero} DE {PASOS.length}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
              {paso.titulo}
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
              {paso.descripcion}
            </p>
          </div>

          {/* Formulario paso 1 */}
          {pasoActual === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                  ¿Cómo te llamas? *
                </label>
                <input
                  type="text"
                  value={nombreDueno}
                  onChange={(e) => setNombreDueno(e.target.value)}
                  placeholder="Ej: Claudia, Don Pepe, María..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: 10,
                    fontSize: 15,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                    color: '#111827',
                    background: 'white',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#16a34a')}
                  onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                  ¿Cómo se llama tu negocio? <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span>
                </label>
                <input
                  type="text"
                  value={nombreNegocio}
                  onChange={(e) => setNombreNegocio(e.target.value)}
                  placeholder="Ej: La Cocinería de Claudia"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: 10,
                    fontSize: 15,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                    color: '#111827',
                    background: 'white',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#16a34a')}
                  onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                />
              </div>
            </div>
          )}

          {/* Formulario paso 2 */}
          {pasoActual === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Nombre del producto
                </label>
                <input
                  type="text"
                  value={prodNombre}
                  onChange={(e) => setProdNombre(e.target.value)}
                  placeholder="Ej: Completo, Empanada, Café..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: 10,
                    fontSize: 15,
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: '#111827',
                    background: 'white',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#16a34a')}
                  onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                  autoFocus
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Precio de venta ($)
                  </label>
                  <input
                    type="number"
                    value={prodPrecio}
                    onChange={(e) => setProdPrecio(e.target.value)}
                    placeholder="2500"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: 10,
                      fontSize: 15,
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: '#111827',
                      background: 'white',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#16a34a')}
                    onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Stock inicial
                  </label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="10"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: 10,
                      fontSize: 15,
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: '#111827',
                      background: 'white',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#16a34a')}
                    onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Formulario paso 3 */}
          {pasoActual === 2 && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                Escribe un movimiento en español natural
              </label>
              <input
                type="text"
                value={movTexto}
                onChange={(e) => setMovTexto(e.target.value)}
                placeholder='Ej: "vendí 3 completos a 2500" o "pagué 5 lucas de gas"'
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: 10,
                  fontSize: 15,
                  outline: 'none',
                  boxSizing: 'border-box',
                  color: '#111827',
                  background: 'white',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#16a34a')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                autoFocus
              />
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
                El sistema entiende montos como "5 lucas", "2 palos", "mil 500", etc.
              </p>
            </div>
          )}

          {/* Paso 4 — presentación del Socio */}
          {pasoActual === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 12,
                padding: '16px 18px',
              }}>
                <p style={{ fontSize: 14, color: '#166534', margin: '0 0 8px', fontWeight: 500 }}>
                  🎓 Experto
                </p>
                <p style={{ fontSize: 13, color: '#15803d', margin: 0, lineHeight: 1.6 }}>
                  Te dará análisis financieros basados en tus datos reales.
                </p>
              </div>
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 12,
                padding: '16px 18px',
              }}>
                <p style={{ fontSize: 14, color: '#166534', margin: '0 0 8px', fontWeight: 500 }}>
                  🤝 Socio
                </p>
                <p style={{ fontSize: 13, color: '#15803d', margin: 0, lineHeight: 1.6 }}>
                  Te hablará como un amigo que entiende de negocios — directo y sin rodeos.
                </p>
              </div>
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 12,
                padding: '16px 18px',
              }}>
                <p style={{ fontSize: 14, color: '#166534', margin: '0 0 8px', fontWeight: 500 }}>
                  📚 Aprende hoy
                </p>
                <p style={{ fontSize: 13, color: '#15803d', margin: 0, lineHeight: 1.6 }}>
                  Cada respuesta incluye un consejo práctico para tu tipo de negocio.
                </p>
              </div>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                Lo encuentras en la pestaña <strong>Socio</strong> del menú inferior.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <p style={{ fontSize: 13, color: '#dc2626', marginTop: 12, background: '#fef2f2', padding: '8px 12px', borderRadius: 8 }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer con botones */}
        <div style={{
          padding: '16px 24px 32px',
          borderTop: '1px solid #f3f4f6',
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
                border: '1.5px solid #e5e7eb',
                borderRadius: 10,
                background: 'white',
                fontSize: 14,
                color: '#6b7280',
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