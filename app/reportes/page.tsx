'use client'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import { useState, useEffect } from 'react'
import { useRol } from '@/hooks/useRol'

export default function Reportes() {
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [exportando, setExportando] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroColaborador, setFiltroColaborador] = useState('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const { rol } = useRol()
  const esDueno = rol === 'dueño'

  // ✅ Carga todo de una vez sin depender de esDueno
  useEffect(() => {
    cargarMovimientos()
    cargarColaboradores()
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

    const html = `
      <html>
      <head>
        <meta charset="utf-8">
        <title>Cierre de Caja — Socio Pro</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #1f2937; max-width: 600px; margin: 0 auto; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          .sub { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
          .metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
          .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; text-align: center; }
          .card span { display: block; font-size: 11px; color: #9ca3af; margin-bottom: 6px; }
          .green { color: #16a34a; font-size: 20px; font-weight: 700; }
          .red { color: #ef4444; font-size: 20px; font-weight: 700; }
          .blue { color: #2563eb; font-size: 20px; font-weight: 700; }
          .divider { border: none; border-top: 1px solid #f3f4f6; margin: 16px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { text-align: left; padding: 8px 10px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
          td { padding: 8px 10px; border-bottom: 1px solid #f9fafb; }
          .ingreso { color: #16a34a; font-weight: 500; }
          .egreso { color: #ef4444; font-weight: 500; }
          .badge { font-size: 11px; background: #eff6ff; color: #2563eb; padding: 2px 6px; border-radius: 4px; }
          .footer { margin-top: 24px; font-size: 11px; color: #9ca3af; text-align: center; }
        </style>
      </head>
      <body>
        <h1>Cierre de Caja</h1>
        <p class="sub">Socio Pro · ${new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div class="metrics">
          <div class="card"><span>Ingresos</span><div class="green">$${ingresosHoy.toLocaleString()}</div></div>
          <div class="card"><span>Egresos</span><div class="red">$${egresosHoy.toLocaleString()}</div></div>
          <div class="card"><span>Balance</span><div class="${balanceHoy >= 0 ? 'blue' : 'red'}">$${balanceHoy.toLocaleString()}</div></div>
        </div>
        <hr class="divider">
        <table>
          <tr><th>Hora</th><th>Concepto</th><th>Registrado por</th><th>Tipo</th><th>Monto</th></tr>
          ${hoy.map(m => `
            <tr>
              <td>${new Date(m.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</td>
              <td>${m.concepto}</td>
              <td><span class="badge">${getNombreColaborador(m)}</span></td>
              <td>${m.tipo}</td>
              <td class="${m.tipo === 'ingreso' ? 'ingreso' : 'egreso'}">${m.tipo === 'ingreso' ? '+' : '-'}$${m.monto.toLocaleString()}</td>
            </tr>
          `).join('')}
        </table>
        <p class="footer">Generado con Socio Pro · ${new Date().toLocaleTimeString('es-CL')}</p>
      </body>
      </html>
    `
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

  async function exportarExcel() {
    setExportando(true)
    const XLSX = (await import('xlsx')).default
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
    XLSX.writeFile(wb, 'socio-pro-reporte.xlsx')
    setExportando(false)
  }

  async function exportarReporte() {
    setExportando(true)
    const balance = ingresos - egresos
    const nombreFiltroColab = filtroColaborador === 'todos'
      ? 'Todo el equipo'
      : filtroColaborador === 'dueno'
      ? 'Solo dueño'
      : colaboradores.find((c: any) => c.id === filtroColaborador)?.nombre || 'Colaborador'

    const html = `
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte Socio Pro</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #1f2937; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          .sub { color: #6b7280; font-size: 13px; margin-bottom: 8px; }
          .filtros { color: #6b7280; font-size: 12px; margin-bottom: 24px; padding: 8px 12px; background: #f9fafb; border-radius: 6px; }
          .metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
          .card span { display: block; font-size: 11px; color: #9ca3af; margin-bottom: 4px; }
          .green { color: #16a34a; font-size: 18px; font-weight: 600; }
          .red { color: #ef4444; font-size: 18px; font-weight: 600; }
          .blue { color: #2563eb; font-size: 18px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { text-align: left; padding: 8px 12px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-weight: 600; }
          td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
          .ingreso { color: #16a34a; font-weight: 500; }
          .egreso { color: #ef4444; font-weight: 500; }
          .badge { font-size: 11px; background: #eff6ff; color: #2563eb; padding: 2px 6px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>Socio Pro — Reporte</h1>
        <p class="sub">Generado el ${new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div class="filtros">
          Filtros: Tipo: ${filtroTipo} | Categoría: ${filtroCategoria} | Registrado por: ${nombreFiltroColab}
          ${fechaDesde ? ` | Desde: ${fechaDesde}` : ''}
          ${fechaHasta ? ` | Hasta: ${fechaHasta}` : ''}
          | Total: ${filtrados.length} movimientos
        </div>
        <div class="metrics">
          <div class="card"><span>Ingresos</span><div class="green">$${ingresos.toLocaleString()}</div></div>
          <div class="card"><span>Egresos</span><div class="red">$${egresos.toLocaleString()}</div></div>
          <div class="card"><span>Balance</span><div class="${balance >= 0 ? 'blue' : 'red'}">$${balance.toLocaleString()}</div></div>
        </div>
        <table>
          <tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Registrado por</th><th>Tipo</th><th>Monto</th></tr>
          ${filtrados.map(m => `
            <tr>
              <td>${new Date(m.created_at).toLocaleDateString('es-CL')}</td>
              <td>${m.concepto}</td>
              <td>${m.categoria || 'general'}</td>
              <td><span class="badge">${getNombreColaborador(m)}</span></td>
              <td>${m.tipo}</td>
              <td class="${m.tipo === 'ingreso' ? 'ingreso' : 'egreso'}">${m.tipo === 'ingreso' ? '+' : '-'}$${m.monto.toLocaleString()}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'socio-pro-reporte.html'
    a.click()
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
              <button
                onClick={cierreDeCaja}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-green-700 transition-all"
              >
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
                <select
                  value={filtroTipo}
                  onChange={e => setFiltroTipo(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-green-400"
                >
                  <option value="todos">Todos</option>
                  <option value="ingreso">Ingresos</option>
                  <option value="egreso">Egresos</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Categoría</p>
                <select
                  value={filtroCategoria}
                  onChange={e => setFiltroCategoria(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-green-400"
                >
                  {categorias.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por colaborador — aparece si hay colaboradores */}
              {colaboradores.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-1">Registrado por</p>
                  <select
                    value={filtroColaborador}
                    onChange={e => setFiltroColaborador(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-green-400"
                  >
                    <option value="todos">Todo el equipo</option>
                    <option value="dueno">Solo mis registros</option>
                    {colaboradores.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.nombre || c.email}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-400 mb-1">Desde</p>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={e => setFechaDesde(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-green-400"
                />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Hasta</p>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={e => setFechaHasta(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-green-400"
                />
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

          {/* Vista previa */}
          <div className="bg-white rounded-xl border border-gray-100 mb-4">
            <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
              <p className="text-sm font-medium text-gray-700">Vista previa</p>
              <span className="text-xs text-gray-400">{filtrados.length} movimientos</span>
            </div>

            {filtrados.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">
                No hay movimientos con estos filtros
              </p>
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
                        {/* ✅ Badge visible si hay colaboradores */}
                        {colaboradores.length > 0 && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            m.colaborador_id
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-green-50 text-green-700'
                          }`}>
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
                <button
                  onClick={exportarExcel}
                  disabled={exportando || filtrados.length === 0}
                  className="bg-green-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-all"
                >
                  {exportando ? 'Exportando...' : 'Descargar Excel'}
                </button>
                <button
                  onClick={exportarReporte}
                  disabled={exportando || filtrados.length === 0}
                  className="bg-blue-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {exportando ? 'Exportando...' : 'Descargar Reporte'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
      <NavBar />
    </AuthGuard>
  )
}