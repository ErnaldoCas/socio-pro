export function calcularHealthScore(movimientos: any[]) {
  if (movimientos.length === 0) return { score: 0, estado: 'sin datos', alertas: [] }

  const ingresos = movimientos
    .filter(m => m.tipo === 'ingreso')
    .reduce((sum, m) => sum + m.monto, 0)

  const egresos = movimientos
    .filter(m => m.tipo === 'egreso')
    .reduce((sum, m) => sum + m.monto, 0)

  const balance = ingresos - egresos
  const alertas: string[] = []
  let score = 50

  // Balance positivo suma puntos
  if (balance > 0) score += 20
  if (balance < 0) { score -= 20; alertas.push('Estás gastando más de lo que ganas') }

  // Margen
  const margen = ingresos > 0 ? (balance / ingresos) * 100 : 0
  if (margen > 30) score += 15
  if (margen > 50) score += 10
  if (margen < 10 && ingresos > 0) { score -= 10; alertas.push('Tu margen está muy ajustado') }

  // Actividad
  if (movimientos.length >= 5) score += 10
  if (movimientos.length >= 10) score += 5
  if (movimientos.length < 3) { score -= 10; alertas.push('Registra más movimientos para mejor análisis') }

  // Diversidad de categorías
  const categorias = new Set(movimientos.map(m => m.categoria)).size
  if (categorias >= 3) score += 5

  score = Math.max(0, Math.min(100, score))

  let estado = 'crítico'
  if (score >= 30) estado = 'en riesgo'
  if (score >= 50) estado = 'estable'
  if (score >= 70) estado = 'saludable'
  if (score >= 85) estado = 'excelente'

  return { score, estado, alertas, ingresos, egresos, balance, margen: Math.round(margen) }
}