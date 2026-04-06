'use client'
import { useState, useEffect } from 'react'

const PASOS = [
  {
    pantalla: 'Inicio',
    emoji: '🏠',
    titulo: 'Dashboard — Registrar movimientos',
    descripcion: 'El centro de operaciones. Aquí registras todo lo que entra y sale, y monitoras tu negocio en tiempo real.',
    consejos: [
      'Escribe en orden natural: "vendí 3 completos a 2500" o "pagué arriendo 350000". El sistema detecta si es ingreso o egreso automáticamente.',
      'Usa el micrófono 🎤 para hablar directo. Mi Socio Pro transcribe tu voz y deja el texto listo para registrar sin confirmación.',
      'Mientras escribes aparece una etiqueta verde (+ Ingreso) o roja (- Egreso) — así sabes que el sistema entendió bien antes de registrar.',
      'Si tienes productos en inventario, al registrar una venta el stock se descuenta automáticamente. Ej: "vendí 3 completos" baja el stock de Completo en 3.',
      'El Health Score (0-100) y el gráfico de barras se actualizan al instante con cada movimiento que registras.',
    ],
    ejemplos: [
      '"vendí 3 completos a 2500"  →  Ingreso $7.500',
      '"pagué 5 lucas de gas"  →  Egreso $5.000',
      '"cobré comisión 80000"  →  Ingreso $80.000',
      '"gasté 2 palos en arriendo"  →  Egreso $2.000.000',
      '"bencina medio palo"  →  Egreso $500.000',
    ],
    tip: 'Chilenismos: lucas = $1.000 · palos = $1.000.000 · k = mil · medio palo = $500.000',
  },
  {
    pantalla: 'Movimientos',
    emoji: '📋',
    titulo: 'Historial, búsqueda y edición',
    descripcion: 'Historial completo de todos los ingresos y egresos. Busca, filtra y edita cualquier movimiento directamente.',
    consejos: [
      'El buscador filtra por concepto o categoría. El término buscado aparece resaltado en amarillo dentro de los resultados.',
      'Usa los botones Todos / Ingresos / Egresos para filtrar por tipo. Las métricas del encabezado se recalculan según el filtro activo.',
      'Si tienes equipo (Pro), filtra entre "Todo el equipo", "Solo mis registros" o por colaborador específico. Cada movimiento muestra quién lo registró.',
      'Toca Editar en cualquier movimiento para modificar concepto, monto, tipo y categoría directamente en la lista.',
      'Al eliminar aparece una confirmación antes de borrar. Una vez eliminado no se puede recuperar.',
    ],
    ejemplos: [
      'Busca "taxi" → todos los gastos de transporte',
      'Busca "sueldo" → todos los ingresos de sueldo',
      'Busca "arriendo" → todos los pagos de arriendo',
      'Busca "marketing" → filtra la categoría completa',
    ],
    tip: 'Las métricas de ingresos, egresos y balance del encabezado se calculan sobre los movimientos filtrados, no el total.',
  },
  {
    pantalla: 'Inventario',
    emoji: '📦',
    titulo: 'Productos, stock y alertas',
    descripcion: 'Gestiona tus productos con precio, costo y stock. Se integra automáticamente con el registro de ventas.',
    consejos: [
      'Agrega cada producto con nombre, precio de venta y costo. Con ambos el Socio Experto calcula tu margen de ganancia unitario.',
      'Define un stock mínimo para recibir alertas cuando te estés quedando sin producto — aparece alerta roja en pantalla y notificación push si las tienes activadas.',
      'Usa el escáner OCR 📷 para tomar una foto a una factura o lista de productos. La IA los extrae y agrega al inventario automáticamente.',
      'El nombre del producto importa: si lo llamas "Completo", di "vendí completos" al registrar para que el stock descuente correctamente.',
      'Los botones + y − ajustan el stock manualmente para cuando recibes mercadería o corriges un error.',
    ],
    ejemplos: [
      'Completo · Precio $2.500 · Costo $800 · Stock mínimo 10',
      'Café · Precio $1.500 · Costo $300 · Stock mínimo 20',
      'Empanada · Precio $1.800 · Costo $600 · Stock mínimo 15',
    ],
    tip: 'Margen = (Precio - Costo) / Precio × 100. Un completo a $2.500 con costo $800 tiene margen del 68%.',
  },
  {
    pantalla: 'Reportes',
    emoji: '📊',
    titulo: 'Analizar, comparar y exportar',
    descripcion: 'Cierre de caja, filtros avanzados, comparativa entre meses y exportación de datos.',
    consejos: [
      'El contador de uso (plan gratis) muestra cuántos de los 50 movimientos mensuales llevas. Se pone amarillo al 80% y rojo al llegar al límite.',
      'El cierre de caja genera un resumen del día con todos los movimientos descargable en HTML — ideal para revisar al cerrar o enviar al contador.',
      'Combina filtros de texto, tipo, categoría, colaborador y fechas. Los filtros aplican también a las exportaciones.',
      'La comparativa mes a mes muestra diferencias en ingresos, egresos, balance, margen y ticket promedio con indicadores ▲ ▼.',
      'Los análisis guardados desde el Socio Experto aparecen en el Historial de análisis — puedes expandirlos o eliminarlos.',
    ],
    ejemplos: [
      'Filtra "alimentación" + este mes → cuánto gastaste en insumos',
      'Compara abril vs marzo → ¿creciste o retrocediste?',
      'Filtra por colaborador → quién generó más ingresos',
      'Descarga Excel (Pro) → envía el detalle a tu contador',
    ],
    tip: 'El reporte HTML incluye los filtros aplicados, métricas totales y el detalle de cada movimiento. Abre en cualquier navegador.',
  },
  {
    pantalla: 'Socio',
    emoji: '🤝',
    titulo: 'Tu asesor financiero con IA',
    descripcion: 'El Socio Experto conoce todos tus datos y te da análisis personalizados. El chat es gratis para todos los planes.',
    consejos: [
      'Cada respuesta tiene 3 bloques: 🎓 EXPERTO (análisis técnico con tus datos reales), 🤝 SOCIO (lo mismo en lenguaje simple) y 📚 APRENDE HOY (términos explicados).',
      'Usa las preguntas sugeridas de la pantalla o escribe lo que necesites. Sé específico: "¿en qué categoría gasto más?" es mejor que "¿cómo estoy?".',
      'El Socio solo responde temas del negocio — finanzas, inventario, equipo y uso de la app. Para otras cosas te redirigirá al negocio.',
      'Guarda cualquier respuesta con el botón "💾 Guardar análisis". Quedará en Reportes → Historial para consultarlo después.',
      'El Análisis Profundo (Pro) hace un diagnóstico completo automático con un clic — sin necesidad de escribir ninguna pregunta.',
    ],
    ejemplos: [
      '"¿En qué estoy perdiendo plata?"',
      '"¿Cuál es mi producto más rentable?"',
      '"¿Qué debería mejorar urgente?"',
      '"¿Quién de mi equipo vende más?"',
      '"¿Estoy en números rojos o verdes?"',
    ],
    tip: 'Mientras más movimientos e inventario tengas registrado, más preciso y útil será el análisis del Socio.',
  },
  {
    pantalla: 'Usos creativos',
    emoji: '💡',
    titulo: 'Más allá del negocio tradicional',
    descripcion: 'Mi Socio Pro se adapta a cualquier contexto. Aquí algunos usos que descubrieron nuestros usuarios.',
    consejos: [
      'Finanzas personales: registra tu sueldo como ingreso y tus gastos del hogar como egresos. El Socio analiza tu situación personal igual que un negocio.',
      'Taxista o delivery: registra ingresos por turno y gastos de bencina, mantención y peajes. El Socio te dice cuánto ganas real por jornada.',
      'Vendedor por catálogo: registra comisiones como ingresos y pagos a la empresa como egresos. Controla tu utilidad neta real.',
      'Control de ahorro: registra metas de ahorro como egresos ("meta ahorro 100000"). El Socio controla que no te las gastes.',
      'Negocio con equipo (Pro): cada colaborador registra sus ventas, tú ves el consolidado y el rendimiento individual de cada uno.',
    ],
    ejemplos: [
      '"sueldo 800000" → ingreso personal mensual',
      '"supermercado 85000" → gasto del hogar',
      '"turno mañana 45000" + "bencina 35000" → utilidad real del día',
      '"comisión pedido 45000" + "pago catálogo 120000" → ganancia neta catálogo',
    ],
    tip: 'El Socio detecta el contexto por tus datos. "Sueldo" y "supermercado" = finanzas personales. "Completos" y "vienesas" = cocinería.',
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
        <div style={{ flex: 1, padding: '24px 24px', overflowY: 'auto' }}>

          {/* Cabecera del paso */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>{paso_actual.emoji}</div>
            <div style={{ fontSize: 11, color: 'var(--muted-light)', marginBottom: 4, fontWeight: 500 }}>
              {paso_actual.pantalla.toUpperCase()} · {paso + 1}/{PASOS.length}
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 8px' }}>
              {paso_actual.titulo}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
              {paso_actual.descripcion}
            </p>
          </div>

          {/* Consejos */}
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
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
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
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

          {/* Tip */}
          {paso_actual.tip && (
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
              <p style={{ fontSize: 12, color: '#1e40af', margin: 0, lineHeight: 1.5 }}>{paso_actual.tip}</p>
            </div>
          )}
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