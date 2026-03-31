'use client'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import { useState, useEffect, useMemo } from 'react'
import { useRol } from '@/hooks/useRol'

// ─── Helpers comparativa ─────────────────────────────────────────────────────
function getMesesDisponibles(movimientos: any[]) {
  const meses = new Set<string>()
  movimientos.forEach(m => {
    const d = new Date(m.created_at)
    meses.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  })
  return Array.from(meses).sort((a, b) => b.localeCompare(a))
}

function nombreMes(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
}

function metricasMes(movimientos: any[], ym: string) {
  const [y, m] = ym.split('-').map(Number)
  const mov = movimientos.filter(mv => {
    const d = new Date(mv.created_at)
    return d.getFullYear() === y && d.getMonth() + 1 === m
  })
  const ingresos = mov.filter(mv => mv.tipo === 'ingreso').reduce((s, mv) => s + mv.monto, 0)
  const egresos = mov.filter(mv => mv.tipo === 'egreso').reduce((s, mv) => s + mv.monto, 0)
  const balance = ingresos - egresos
  const margen = ingresos > 0 ? Math.round((balance / ingresos) * 100) : 0
  const movimientos_count = mov.length
  const ticket = mov.filter(mv => mv.tipo === 'ingreso').length > 0
    ? Math.round(ingresos / mov.filter(mv => mv.tipo === 'ingreso').length)
    : 0

  // Por categoría
  const categorias: Record<string, { ingresos: number; egresos: number }> = {}
  mov.forEach(mv => {
    const cat = mv.categoria || 'general'
    if (!categorias[cat]) categorias[cat] = { ingresos: 0, egresos: 0 }
    if (mv.tipo === 'ingreso') categorias[cat].ingresos += mv.monto
    else categorias[cat].egresos += mv.monto
  })

  return { ingresos, egresos, balance, margen, movimientos_count, ticket, categorias }
}

function diff(a: number, b: number) {
  if (b === 0) return a > 0 ? 100 : 0
  return Math.round(((a - b) / Math.abs(b)) * 100)
}

function DiffBadge({ valor }: { valor: number }) {
  if (valor === 0) return <span className="text-xs text-gray-400">—</span>
  const positivo = valor > 0
  return (
    <span className={`text-xs font-medium ${positivo ? 'text-green-600' : 'text-red-500'}`}>
      {positivo ? '▲' : '▼'} {Math.abs(valor)}%
    </span>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Reportes() {
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [exportando, setExportando] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroColaborador, setFiltroColaborador] = useState('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [historial, setHistorial] = useState<any[]>([])
  const [analisisAbierto, setAnalisisAbierto] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState<string | null>(null)

  // Comparativa
  const [mesA, setMesA] = useState('')
  const [mesB, setMesB] = useState('')

  const { rol } = useRol()

  useEffect(() => {
    cargarMovimientos()
    cargarColaboradores()
    cargarHistorial()
  }, [])

  async function cargarColaboradores() {
    try {
      const res = await fetch('/api/negocio')
      const data = await res.json()
      setColaboradores(data.colaboradores?.filter((c: any) => c.estado === 'activo') || [])
    } catch {
      setColaboradores([])
    }
  }

  async function cargarMovimientos() {
    const res = await fetch('/api/movimientos')
    const data = await res.json()
    setMovimientos(data || [])
  }

  async function cargarHistorial() {
    try {
      const res = await fetch('/api/analisis-historial')
      const data = await res.json()
      setHistorial(Array.isArray(data) ? data : [])
    } catch {
      setHistorial([])
    }
  }

  async function eliminarAnalisis(id: string) {
    setEliminando(id)
    await fetch(`/api/analisis-historial?id=${id}`, { method: 'DELETE' })
    setHistorial(prev => prev.filter(a => a.id !== id))
    if (analisisAbierto === id) setAnalisisAbierto(null)
    setEliminando(null)
  }

  function getNombreColaborador(m: any) {
    if (!m.colaborador_id) return 'Dueño'
    const colab = colaboradores.find((c: any) => c.id === m.colaborador_id)
    return colab?.nombre || colab?.email || 'Colaborador'
  }

  function filtrarMovimientos() {
    return movimientos.filter(m => {
      const tipo = filtroTipo === 'todos' || m.tipo === filtroTipo
      const cat = filtroCategoria === 'todas' || m.categoria === filtroCategoria
      const desde = !fechaDesde || new Date(m.created_at) >= new Date(fechaDesde)
      const hasta = !fechaHasta || new Date(m.created_at) <= new Date(fechaHasta + 'T23:59:59')
      const colab = filtroColaborador === 'todos'
        ? true
        : filtroColaborador === 'dueno'
        ? !m.colaborador_id
        : m.colaborador_id === filtroColaborador
      return tipo && cat && desde && hasta && colab
    })
  }

  function movimientosHoy() {
    const hoy = new Date().toLocaleDateString('es-CL')
    return movimientos.filter(m =>
      new Date(m.created_at).toLocaleDateString('es-CL') === hoy
    )
  }

  async function cierreDeCaja() {
    const hoy = movimientosHoy()
    const ingresosHoy = hoy.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
    const egresosHoy = hoy.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)
    const balanceHoy = ingresosHoy - egresosHoy
    const html = `<html><head><meta charset="utf-8"><title>Cierre de Caja — Socio Pro</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#1f2937;max-width:600px;margin:0 auto}
      h1{font-size:22px;margin-bottom:4px}.sub{color:#6b7280;font-size:13px;margin-bottom:24px}
      .metrics{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px}
      .card{border:1px solid #e5e7eb;border-radius:8px;padding:14px;text-align:center}
      .card span{display:block;font-size:11px;color:#9ca3af;margin-bottom:6px}
      .green{color:#16a34a;font-size:20px;font-weight:700}.red{color:#ef4444;font-size:20px;font-weight:700}
      .blue{color:#2563eb;font-size:20px;font-weight:700}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th{text-align:left;padding:8px 10px;background:#f9fafb;border-bottom:1px solid #e5e7eb}
      td{padding:8px 10px;border-bottom:1px solid #f9fafb}
      .ingreso{color:#16a34a;font-weight:500}.egreso{color:#ef4444;font-weight:500}
      .badge{font-size:11px;background:#eff6ff;color:#2563eb;padding:2px 6px;border-radius:4px}
      .footer{margin-top:24px;font-size:11px;color:#9ca3af;text-align:center}</style></head>
      <body><h1>Cierre de Caja</h1>
      <p class="sub">Socio Pro · ${new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <div class="metrics">
        <div class="card"><span>Ingresos</span><div class="green">$${ingresosHoy.toLocaleString()}</div></div>
        <div class="card"><span>Egresos</span><div class="red">$${egresosHoy.toLocaleString()}</div></div>
        <div class="card"><span>Balance</span><div class="${balanceHoy >= 0 ? 'blue' : 'red'}">$${balanceHoy.toLocaleString()}</div></div>
      </div>
      <table><tr><th>Hora</th><th>Concepto</th><th>Registrado por</th><th>Tipo</th><th>Monto</th></tr>
      ${hoy.map(m => `<tr>
        <td>${new Date(m.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</td>
        <td>${m.concepto}</td><td><span class="badge">${getNombreColaborador(m)}</span></td>
        <td>${m.tipo}</td>
        <td class="${m.tipo === 'ingreso' ? 'ingreso' : 'egreso'}">${m.tipo === 'ingreso' ? '+' : '-'}$${m.monto.toLocaleString()}</td>
      </tr>`).join('')}</table>
      <p class="footer">Generado con Socio Pro · ${new Date().toLocaleTimeString('es-CL')}</p>
      </body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cierre-caja-${new Date().toLocaleDateString('es-CL').replace(/\//g, '-')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const categorias = ['todas', ...Array.from(new Set(movimientos.map(m => m.categoria || 'general')))]
  const filtrados = filtrarMovimientos()
  const ingresos = filtrados.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresos = filtrados.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)
  const hoy = movimientosHoy()
  const ingresosHoy = hoy.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresosHoy = hoy.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)

  // Comparativa
  const mesesDisponibles = useMemo(() => getMesesDisponibles(movimientos), [movimientos])
  const metA = useMemo(() => mesA ? metricasMes(movimientos, mesA) : null, [movimientos, mesA])
  const metB = useMemo(() => mesB ? metricasMes(movimientos, mesB) : null, [movimientos, mesB])

  // Inicializar meses automáticamente cuando cargan los movimientos
  useEffect(() => {
    if (mesesDisponibles.length >= 1 && !mesA) setMesA(mesesDisponibles[0])
    if (mesesDisponibles.length >= 2 && !mesB) setMesB(mesesDisponibles[1])
  }, [mesesDisponibles])

  async function exportarExcel() {
    setExportando(true)
    try {
      const XLSX = await import('xlsx')
      const datos = filtrados.map(m => ({
        Fecha: new Date(m.created_at).toLocaleDateString('es-CL'),
        Concepto: m.concepto,
        Tipo: m.tipo,
        Monto: m.monto,
        Categoria: m.categoria || 'general',
        'Registrado por': getNombreColaborador(m)
      }))
      const ws = XLSX.utils.json_to_sheet(datos)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Movimientos')
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `socio-pro-reporte-${new Date().toLocaleDateString('es-CL').replace(/\//g, '-')}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Error exportando Excel:', e)
    }
    setExportando(false)
  }

  async function exportarReporte() {
    setExportando(true)
    const balance = ingresos - egresos
    const nombreFiltroColab = filtroColaborador === 'todos' ? 'Todo el equipo'
      : filtroColaborador === 'dueno' ? 'Solo dueño'
      : colaboradores.find((c: any) => c.id === filtroColaborador)?.nombre || 'Colaborador'
    const html = `<html><head><meta charset="utf-8"><title>Reporte Socio Pro</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#1f2937}
      h1{font-size:22px;margin-bottom:4px}.sub{color:#6b7280;font-size:13px;margin-bottom:8px}
      .filtros{color:#6b7280;font-size:12px;margin-bottom:24px;padding:8px 12px;background:#f9fafb;border-radius:6px}
      .metrics{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:24px}
      .card{border:1px solid #e5e7eb;border-radius:8px;padding:16px}
      .card span{display:block;font-size:11px;color:#9ca3af;margin-bottom:4px}
      .green{color:#16a34a;font-size:18px;font-weight:600}.red{color:#ef4444;font-size:18px;font-weight:600}
      .blue{color:#2563eb;font-size:18px;font-weight:600}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th{text-align:left;padding:8px 12px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:600}
      td{padding:8px 12px;border-bottom:1px solid #f3f4f6}
      .ingreso{color:#16a34a;font-weight:500}.egreso{color:#ef4444;font-weight:500}
      .badge{font-size:11px;background:#eff6ff;color:#2563eb;padding:2px 6px;border-radius:4px}</style></head>
      <body><h1>Socio Pro — Reporte</h1>
      <p class="sub">Generado el ${new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <div class="filtros">Filtros: Tipo: ${filtroTipo} | Categoría: ${filtroCategoria} | Registrado por: ${nombreFiltroColab}
      ${fechaDesde ? ` | Desde: ${fechaDesde}` : ''}${fechaHasta ? ` | Hasta: ${fechaHasta}` : ''} | Total: ${filtrados.length} movimientos</div>
      <div class="metrics">
        <div class="card"><span>Ingresos</span><div class="green">$${ingresos.toLocaleString()}</div></div>
        <div class="card"><span>Egresos</span><div class="red">$${egresos.toLocaleString()}</div></div>
        <div class="card"><span>Balance</span><div class="${balance >= 0 ? 'blue' : 'red'}">$${balance.toLocaleString()}</div></div>
      </div>
      <table><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Registrado por</th><th>Tipo</th><th>Monto</th></tr>
      ${filtrados.map(m => `<tr>
        <td>${new Date(m.created_at).toLocaleDateString('es-CL')}</td>
        <td>${m.concepto}</td><td>${m.categoria || 'general'}</td>
        <td><span class="badge">${getNombreColaborador(m)}</span></td>
        <td>${m.tipo}</td>
        <td class="${m.tipo === 'ingreso' ? 'ingreso' : 'egreso'}">${m.tipo === 'ingreso' ? '+' : '-'}$${m.monto.toLocaleString()}</td>
      </tr>`).join('')}</table></body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'socio-pro-reporte.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setExportando(false)
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-100 p-4 pt-16 pb-24">
        <div className="max-w-2xl mx-auto">

          <div className="mb-4 pt-2">
            <h1 className="text-2xl font-semibold text-gray-800">Reportes</h1>
            <p className="text-gray-500 text-sm">Exporta y analiza tu negocio</p>
          </div>

          {/* Cierre de caja */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Cierre de caja</p>
                <p className="text-xs text-gray-400">Resumen del día de hoy</p>
              </div>
              <button onClick={cierreDeCaja} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-green-700 transition-all">
                Hacer cierre
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-green-600 mb-1">Ingresos hoy</p>
                <p className="text-sm font-semibold text-green-700">${ingresosHoy.toLocaleString()}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-xs text-red-500 mb-1">Egresos hoy</p>
                <p className="text-sm font-semibold text-red-600">${egresosHoy.toLocaleString()}</p>
              </div>
              <div className={`${ingresosHoy - egresosHoy >= 0 ? 'bg-blue-50' : 'bg-red-50'} rounded-lg p-3 text-center`}>
                <p className={`text-xs mb-1 ${ingresosHoy - egresosHoy >= 0 ? 'text-blue-500' : 'text-red-500'}`}>Balance hoy</p>
                <p className={`text-sm font-semibold ${ingresosHoy - egresosHoy >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  ${(ingresosHoy - egresosHoy).toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">{hoy.length} movimientos hoy</p>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Filtros</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Tipo</p>
                <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-green-400">
                  <option value="todos">Todos</option>
                  <option value="ingreso">Ingresos</option>
                  <option value="egreso">Egresos</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Categoría</p>
                <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-green-400">
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {colaboradores.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-1">Registrado por</p>
                  <select value={filtroColaborador} onChange={e => setFiltroColaborador(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-green-400">
                    <option value="todos">Todo el equipo</option>
                    <option value="dueno">Solo mis registros</option>
                    {colaboradores.map((c: any) => <option key={c.id} value={c.id}>{c.nombre || c.email}</option>)}
                  </select>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 mb-1">Desde</p>
                <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Hasta</p>
                <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-green-400" />
              </div>
            </div>
          </div>

          {/* Métricas filtradas */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Ingresos</p>
              <p className="text-base font-semibold text-green-600">${ingresos.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Egresos</p>
              <p className="text-base font-semibold text-red-500">${egresos.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Balance</p>
              <p className={`text-base font-semibold ${ingresos - egresos >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                ${(ingresos - egresos).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Vista previa + exportar */}
          <div className="bg-white rounded-xl border border-gray-100 mb-4">
            <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
              <p className="text-sm font-medium text-gray-700">Vista previa</p>
              <span className="text-xs text-gray-400">{filtrados.length} movimientos</span>
            </div>
            {filtrados.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No hay movimientos con estos filtros</p>
            ) : (
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {filtrados.map(m => (
                  <div key={m.id} className="px-5 py-3 flex justify-between items-center">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm text-gray-800 truncate">{m.concepto}</p>
                      <div className="flex gap-2 mt-0.5 flex-wrap items-center">
                        <span className="text-xs text-gray-400">{m.categoria || 'general'}</span>
                        <span className="text-xs text-gray-300">
                          {new Date(m.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                        </span>
                        {colaboradores.length > 0 && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${m.colaborador_id ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-700'}`}>
                            {getNombreColaborador(m)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-sm font-medium flex-shrink-0 ${m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-500'}`}>
                      {m.tipo === 'ingreso' ? '+' : '-'}${m.monto.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="px-5 py-4 border-t border-gray-50">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={exportarExcel} disabled={exportando || filtrados.length === 0}
                  className="bg-green-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-all">
                  {exportando ? 'Exportando...' : '📊 Descargar Excel'}
                </button>
                <button onClick={exportarReporte} disabled={exportando || filtrados.length === 0}
                  className="bg-blue-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all">
                  {exportando ? 'Exportando...' : '📄 Descargar Reporte'}
                </button>
              </div>
            </div>
          </div>

          {/* ─── Comparativa mes a mes ─────────────────────────────────────── */}
          {mesesDisponibles.length >= 1 && (
            <div className="bg-white rounded-xl border border-gray-100 mb-4">
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="text-sm font-medium text-gray-700">📅 Comparativa mes a mes</p>
                <p className="text-xs text-gray-400">Compara dos meses y ve cómo evolucionó el negocio</p>
              </div>

              {/* Selectores de mes */}
              <div className="px-5 py-4 grid grid-cols-2 gap-3 border-b border-gray-50">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Mes A</p>
                  <select value={mesA} onChange={e => setMesA(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-green-400">
                    {mesesDisponibles.map(m => (
                      <option key={m} value={m}>{nombreMes(m)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Mes B (comparar con)</p>
                  <select value={mesB} onChange={e => setMesB(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-green-400">
                    <option value="">Sin comparar</option>
                    {mesesDisponibles.map(m => (
                      <option key={m} value={m}>{nombreMes(m)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tabla comparativa */}
              {metA && (
                <div className="px-5 py-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-xs text-gray-400 font-medium w-1/3">Métrica</th>
                        <th className="text-right py-2 text-xs text-gray-600 font-medium">{nombreMes(mesA)}</th>
                        {metB && <th className="text-right py-2 text-xs text-gray-600 font-medium">{nombreMes(mesB)}</th>}
                        {metB && <th className="text-right py-2 text-xs text-gray-400 font-medium">Diferencia</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {/* Ingresos */}
                      <tr>
                        <td className="py-2.5 text-xs text-gray-500">Ingresos</td>
                        <td className="py-2.5 text-right text-sm font-medium text-green-600">${metA.ingresos.toLocaleString()}</td>
                        {metB && <td className="py-2.5 text-right text-sm font-medium text-green-600">${metB.ingresos.toLocaleString()}</td>}
                        {metB && <td className="py-2.5 text-right"><DiffBadge valor={diff(metA.ingresos, metB.ingresos)} /></td>}
                      </tr>
                      {/* Egresos */}
                      <tr>
                        <td className="py-2.5 text-xs text-gray-500">Egresos</td>
                        <td className="py-2.5 text-right text-sm font-medium text-red-500">${metA.egresos.toLocaleString()}</td>
                        {metB && <td className="py-2.5 text-right text-sm font-medium text-red-500">${metB.egresos.toLocaleString()}</td>}
                        {metB && <td className="py-2.5 text-right"><DiffBadge valor={diff(metA.egresos, metB.egresos) * -1} /></td>}
                      </tr>
                      {/* Balance */}
                      <tr className="bg-gray-50 rounded-lg">
                        <td className="py-2.5 text-xs font-medium text-gray-700 pl-1">Balance</td>
                        <td className={`py-2.5 text-right text-sm font-semibold ${metA.balance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                          ${metA.balance.toLocaleString()}
                        </td>
                        {metB && <td className={`py-2.5 text-right text-sm font-semibold ${metB.balance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                          ${metB.balance.toLocaleString()}
                        </td>}
                        {metB && <td className="py-2.5 text-right"><DiffBadge valor={diff(metA.balance, metB.balance)} /></td>}
                      </tr>
                      {/* Margen */}
                      <tr>
                        <td className="py-2.5 text-xs text-gray-500">Margen</td>
                        <td className="py-2.5 text-right text-sm font-medium text-gray-700">{metA.margen}%</td>
                        {metB && <td className="py-2.5 text-right text-sm font-medium text-gray-700">{metB.margen}%</td>}
                        {metB && <td className="py-2.5 text-right"><DiffBadge valor={metA.margen - metB.margen} /></td>}
                      </tr>
                      {/* Movimientos */}
                      <tr>
                        <td className="py-2.5 text-xs text-gray-500">Movimientos</td>
                        <td className="py-2.5 text-right text-sm font-medium text-gray-700">{metA.movimientos_count}</td>
                        {metB && <td className="py-2.5 text-right text-sm font-medium text-gray-700">{metB.movimientos_count}</td>}
                        {metB && <td className="py-2.5 text-right"><DiffBadge valor={diff(metA.movimientos_count, metB.movimientos_count)} /></td>}
                      </tr>
                      {/* Ticket promedio */}
                      <tr>
                        <td className="py-2.5 text-xs text-gray-500">Ticket promedio</td>
                        <td className="py-2.5 text-right text-sm font-medium text-gray-700">${metA.ticket.toLocaleString()}</td>
                        {metB && <td className="py-2.5 text-right text-sm font-medium text-gray-700">${metB.ticket.toLocaleString()}</td>}
                        {metB && <td className="py-2.5 text-right"><DiffBadge valor={diff(metA.ticket, metB.ticket)} /></td>}
                      </tr>
                    </tbody>
                  </table>

                  {/* Comparativa por categoría */}
                  {metB && (() => {
                    const todasCats = new Set([
                      ...Object.keys(metA.categorias),
                      ...Object.keys(metB.categorias)
                    ])
                    return todasCats.size > 0 ? (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">Por categoría</p>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="text-left py-1.5 text-xs text-gray-400 font-medium">Categoría</th>
                              <th className="text-right py-1.5 text-xs text-gray-400 font-medium">Ing. A</th>
                              <th className="text-right py-1.5 text-xs text-gray-400 font-medium">Ing. B</th>
                              <th className="text-right py-1.5 text-xs text-gray-400 font-medium">Dif.</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {Array.from(todasCats).map(cat => {
                              const ingA = metA.categorias[cat]?.ingresos || 0
                              const ingB = metB.categorias[cat]?.ingresos || 0
                              return (
                                <tr key={cat}>
                                  <td className="py-2 text-xs text-gray-600 capitalize">{cat}</td>
                                  <td className="py-2 text-right text-xs text-gray-700">${ingA.toLocaleString()}</td>
                                  <td className="py-2 text-right text-xs text-gray-700">${ingB.toLocaleString()}</td>
                                  <td className="py-2 text-right"><DiffBadge valor={diff(ingA, ingB)} /></td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : null
                  })()}
                </div>
              )}

              {mesesDisponibles.length === 1 && (
                <p className="text-xs text-gray-400 text-center py-4">
                  Solo hay un mes con datos. Registra más movimientos para comparar.
                </p>
              )}
            </div>
          )}
          {/* ─────────────────────────────────────────────────────────────── */}

          {/* Historial de análisis IA */}
          {historial.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 mb-4">
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="text-sm font-medium text-gray-700">🧠 Historial de análisis</p>
                <p className="text-xs text-gray-400">Análisis guardados del Socio Experto</p>
              </div>
              <div className="divide-y divide-gray-50">
                {historial.map(a => (
                  <div key={a.id} className="px-5 py-3">
                    <div
                      className="flex justify-between items-start cursor-pointer"
                      onClick={() => setAnalisisAbierto(analisisAbierto === a.id ? null : a.id)}
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm text-gray-800 font-medium truncate">{a.pregunta}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(a.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); eliminarAnalisis(a.id) }}
                          disabled={eliminando === a.id}
                          className="text-xs text-gray-300 hover:text-red-400 transition-all"
                        >
                          {eliminando === a.id ? '...' : '✕'}
                        </button>
                        <span className="text-gray-300 text-xs">{analisisAbierto === a.id ? '▲' : '▼'}</span>
                      </div>
                    </div>
                    {analisisAbierto === a.id && (
                      <div className="mt-3 text-xs text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">
                        {a.respuesta}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
      <NavBar />
    </AuthGuard>
  )
}