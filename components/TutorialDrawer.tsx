'use client'
import { useState, useEffect } from 'react'

const PASOS = [
  {
    pantalla: 'Inicio',
    emoji: '🏠',
    titulo: 'Registrar movimientos',
    descripcion: 'Aquí registras todo lo que entra y sale de tu negocio o finanzas personales.',
    consejos: [
      'Escribe en orden: acción + concepto + monto. Ejemplo: "vendí completos 5000" o "pagué arriendo 200000"',
      'Usa palabras que identifiquen ingresos: vendí, cobré, recibí, gané. Para egresos: pagué, compré, gasté.',
      'También puedes usar el micrófono 🎤 — habla natural y Mi Socio Pro entiende.',
      'Puedes escribir "sueldo 800000" para registrar tu ingreso personal.',
    ],
    ejemplos: [
      '"vendí café 1500"',
      '"pagué bencina 45000"',
      '"cobré comisión 80000"',
      '"compré insumos 25000"',
    ]
  },
  {
    pantalla: 'Movimientos',
    emoji: '📋',
    titulo: 'Ver y buscar movimientos',
    descripcion: 'Historial completo de todo lo que has registrado. Filtra y busca para encontrar lo que necesitas.',
    consejos: [
      'Usa el buscador para encontrar movimientos por palabra clave. Ejemplo: "imprevistos", "colación", "hobby".',
      'Filtra por tipo (ingresos/egresos) para ver solo lo que te interesa.',
      'Si tienes colaboradores, puedes ver quién registró cada movimiento.',
      'Puedes editar o eliminar cualquier movimiento si te equivocaste.',
    ],
    ejemplos: [
      'Busca "taxi" para ver todos tus gastos en transporte',
      'Busca "sueldo" para ver todos tus ingresos personales',
      'Filtra por "egresos" para revisar en qué estás gastando',
    ]
  },
  {
    pantalla: 'Inventario',
    emoji: '📦',
    titulo: 'Gestionar productos y stock',
    descripcion: 'Registra los productos que vendes. Cuando registras una venta, el stock se descuenta automáticamente.',
    consejos: [
      'Agrega cada producto con su precio de venta y costo — así Socio Pro calcula tu margen.',
      'Define un stock mínimo para recibir alertas cuando te estés quedando sin producto.',
      'Al registrar "vendí 3 completos 4500" en el inicio, el stock de "completo" baja automáticamente.',
      'Usa los botones + / - para ajustar el stock manualmente si recibes mercadería.',
    ],
    ejemplos: [
      'Producto: "Completo" | Precio: $2.500 | Costo: $800 | Stock mínimo: 10',
      'Producto: "Café" | Precio: $1.500 | Costo: $300 | Stock mínimo: 20',
    ]
  },
  {
    pantalla: 'Reportes',
    emoji: '📊',
    titulo: 'Analizar y exportar',
    descripcion: 'Ve el resumen financiero de tu negocio, compara meses y exporta tus datos.',
    consejos: [
      'El cierre de caja genera un resumen del día — útil para revisar al cerrar.',
      'Usa el buscador para filtrar movimientos por palabra clave antes de exportar.',
      'Compara dos meses para ver si tu negocio está creciendo o retrocediendo.',
      'Exporta a Excel (plan Pro) o descarga el reporte HTML para compartir con tu contador.',
    ],
    ejemplos: [
      'Filtra por "alimentación" + mes actual para ver tus gastos en insumos',
      'Compara abril vs marzo para saber si mejoraste',
    ]
  },
  {
    pantalla: 'Socio',
    emoji: '🤝',
    titulo: 'Tu asesor financiero con IA',
    descripcion: 'El Socio Experto conoce todos tus datos y te da análisis y consejos personalizados.',
    consejos: [
      'Cada respuesta tiene 3 partes: análisis técnico (🎓), explicación simple (🤝) y algo que aprender (📚).',
      'Pregúntale cosas concretas: "¿en qué estoy perdiendo plata?", "¿cuál es mi producto más rentable?"',
      'Guarda los análisis que te parezcan útiles — aparecen en Reportes para revisarlos después.',
      'El análisis profundo (plan Pro) te da un diagnóstico completo con alertas y una acción para hoy.',
    ],
    ejemplos: [
      '"¿Cómo estuvo esta semana?"',
      '"¿Cuánto debería cobrar por mis productos?"',
      '"¿Qué debería mejorar urgente?"',
      '"¿En qué estoy gastando demasiado?"',
    ]
  },
  {
    pantalla: 'Usos creativos',
    emoji: '💡',
    titulo: 'Ideas de uso más allá del negocio',
    descripcion: 'Socio Pro se adapta a distintas necesidades. Úsalo como más te sirva.',
    consejos: [
      'Finanzas personales: registra tu sueldo como ingreso y tus gastos del hogar como egresos.',
      'Control de comisiones: si vendes con colaboradores, cada uno registra sus ventas y tú ves el total.',
      'Presupuesto mensual: registra tus metas de ahorro como "meta ahorro 100000" y controla tus gastos.',
      'Gastos compartidos: usa colaboradores para llevar cuentas de gastos en grupo.',
    ],
    ejemplos: [
      '"sueldo 800000" → ingreso personal mensual',
      '"supermercado 85000" → gasto del hogar',
      '"ahorro meta 50000" → control de ahorro',
    ]
  },
]

interface Props {
  onCerrar: () => void
}

export default function TutorialDrawer({ onCerrar }: Props) {
  const [visible, setVisible] = useState(false)
  const [paso, setPaso] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  function cerrar() {
    setVisible(false)
    setTimeout(onCerrar, 400)
  }

  const paso_actual = PASOS[paso]
  const es_ultimo = paso === PASOS.length - 1

  return (
    <>
      {/* Overlay */}
      <div
        onClick={cerrar}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 40, opacity: visible ? 1 : 0, transition: 'opacity 0.35s ease',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '440px',
        background: 'var(--card)', zIndex: 50, display: 'flex', flexDirection: 'column',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#15803d' }}>Tutorial</span>
              <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 99, fontWeight: 500 }}>
                Guía de uso
              </span>
            </div>
            <button onClick={cerrar} style={{ fontSize: 12, color: 'var(--muted-light)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
              Cerrar
            </button>
          </div>

          {/* Barra de progreso */}
          <div style={{ display: 'flex', gap: 4, paddingBottom: 20 }}>
            {PASOS.map((_, i) => (
              <div
                key={i}
                onClick={() => setPaso(i)}
                style={{
                  flex: 1, height: 4, borderRadius: 99, cursor: 'pointer',
                  background: i <= paso ? '#16a34a' : 'var(--input-border)',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, padding: '28px 24px', overflowY: 'auto' }}>

          {/* Pantalla + emoji */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>{paso_actual.emoji}</div>
            <div style={{ fontSize: 11, color: 'var(--muted-light)', marginBottom: 4, fontWeight: 500 }}>
              PANTALLA: {paso_actual.pantalla.toUpperCase()} · {paso + 1}/{PASOS.length}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 8px' }}>
              {paso_actual.titulo}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
              {paso_actual.descripcion}
            </p>
          </div>

          {/* Consejos */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              Cómo usarlo
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {paso_actual.consejos.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#dcfce7',
                    color: '#15803d', fontSize: 11, fontWeight: 700, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                  }}>
                    {i + 1}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--foreground)', margin: 0, lineHeight: 1.6 }}>{c}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ejemplos */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              Ejemplos
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {paso_actual.ejemplos.map((e, i) => (
                <div key={i} style={{
                  background: 'var(--input-bg)', border: '1px solid var(--card-border)',
                  borderRadius: 8, padding: '8px 12px',
                  fontSize: 13, color: '#15803d', fontFamily: 'monospace',
                }}>
                  {e}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer navegación */}
        <div style={{
          padding: '16px 24px',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          background: 'var(--card)', borderTop: '1px solid var(--card-border)',
          display: 'flex', gap: 10,
        }}>
          <button
            onClick={() => setPaso(p => Math.max(0, p - 1))}
            disabled={paso === 0}
            style={{
              flex: 1, padding: '12px', border: '1.5px solid var(--input-border)',
              borderRadius: 10, background: 'var(--card)', fontSize: 14,
              color: 'var(--muted)', cursor: paso === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 500, opacity: paso === 0 ? 0.4 : 1,
            }}
          >
            ← Anterior
          </button>
          {es_ultimo ? (
            <button
              onClick={cerrar}
              style={{
                flex: 2, padding: '12px', background: '#16a34a', border: 'none',
                borderRadius: 10, fontSize: 15, color: 'white', cursor: 'pointer', fontWeight: 600,
              }}
            >
              ¡Listo! 🚀
            </button>
          ) : (
            <button
              onClick={() => setPaso(p => Math.min(PASOS.length - 1, p + 1))}
              style={{
                flex: 2, padding: '12px', background: '#16a34a', border: 'none',
                borderRadius: 10, fontSize: 15, color: 'white', cursor: 'pointer', fontWeight: 600,
              }}
            >
              Siguiente →
            </button>
          )}
        </div>
      </div>
    </>
  )
}