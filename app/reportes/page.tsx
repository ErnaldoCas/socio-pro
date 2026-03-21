'use client'
import { useState, useEffect, useRef } from 'react'

export default function Reportes() {
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [escaneando, setEscaneando] = useState(false)
  const [textoOCR, setTextoOCR] = useState('')
  const [exportando, setExportando] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    cargarMovimientos()
  }, [])

  async function cargarMovimientos() {
    const res = await fetch('/api/movimientos')
    const data = await res.json()
    setMovimientos(data || [])
  }

  async function escanearBoleta(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setEscaneando(true)
    setTextoOCR('')
    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker('spa')
    const { data: { text } } = await worker.recognize(file)
    await worker.terminate()
    setTextoOCR(text)
    setEscaneando(false)
  }

  async function exportarExcel() {
    setExportando(true)
    const XLSX = (await import('xlsx')).default
    const datos = movimientos.map(m => ({
      Fecha: new Date(m.created_at).toLocaleDateString('es-CL'),
      Concepto: m.concepto,
      Tipo: m.tipo,
      Monto: m.monto,
      Categoria: m.categoria || 'general'
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos')
    XLSX.writeFile(wb, 'socio-pro-reporte.xlsx')
    setExportando(false)
  }

  async function exportarPDF() {
    setExportando(true)
    const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
    const egresos = movimientos.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)
    const balance = ingresos - egresos

    const html = `
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte Socio Pro</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #1f2937; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          .sub { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
          .metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
          .card span { display: block; font-size: 11px; color: #9ca3af; margin-bottom: 4px; }
          .green { color: #16a34a; font-size: 18px; font-weight: 600; }
          .red { color: #ef4444; font-size: 18px; font-weight: 600; }
          .blue { color: #2563eb; font-size: 18px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
          th { text-align: left; padding: 8px 12px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-weight: 600; }
          td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
          tr:last-child td { border-bottom: none; }
          .ingreso { color: #16a34a; font-weight: 500; }
          .egreso { color: #ef4444; font-weight: 500; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Socio Pro — Reporte de Movimientos</h1>
        <p class="sub">Generado el ${new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div class="metrics">
          <div class="card"><span>Ingresos</span><div class="green">$${ingresos.toLocaleString()}</div></div>
          <div class="card"><span>Egresos</span><div class="red">$${egresos.toLocaleString()}</div></div>
          <div class="card"><span>Balance</span><div class="${balance >= 0 ? 'blue' : 'red'}">$${balance.toLocaleString()}</div></div>
        </div>
        <table>
          <tr>
            <th>Fecha</th>
            <th>Concepto</th>
            <th>Categoría</th>
            <th>Tipo</th>
            <th>Monto</th>
          </tr>
          ${movimientos.map(m => `
            <tr>
              <td>${new Date(m.created_at).toLocaleDateString('es-CL')}</td>
              <td>${m.concepto}</td>
              <td>${m.categoria || 'general'}</td>
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

  const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresos = movimientos.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)

  return (
    <main className="min-h-screen bg-gray-100 p-4 pb-24">
      <div className="max-w-2xl mx-auto">

        <div className="mb-6 pt-2">
          <h1 className="text-2xl font-semibold text-gray-800">Reportes</h1>
          <p className="text-gray-500 text-sm">Exporta y escanea documentos</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Ingresos</p>
            <p className="text-lg font-semibold text-green-600">${ingresos.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Egresos</p>
            <p className="text-lg font-semibold text-red-500">${egresos.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Balance</p>
            <p className={`text-lg font-semibold ${ingresos - egresos >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
              ${(ingresos - egresos).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 mb-4">
          <p className="text-sm font-medium text-gray-700 mb-1">Exportar reporte</p>
          <p className="text-xs text-gray-400 mb-4">{movimientos.length} movimientos registrados</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={exportarExcel}
              disabled={exportando || movimientos.length === 0}
              className="bg-green-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-all"
            >
              {exportando ? 'Exportando...' : 'Descargar Excel'}
            </button>
            <button
              onClick={exportarPDF}
              disabled={exportando || movimientos.length === 0}
              className="bg-blue-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              {exportando ? 'Exportando...' : 'Descargar Reporte'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-1">Escanear boleta</p>
          <p className="text-xs text-gray-400 mb-4">Sube una foto y extraemos el texto automáticamente</p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={escanearBoleta}
            className="hidden"
          />

          <button
            onClick={() => fileRef.current?.click()}
            disabled={escaneando}
            className="w-full border-2 border-dashed border-gray-200 rounded-lg py-8 text-sm text-gray-400 hover:border-green-400 hover:text-green-600 transition-all disabled:opacity-50"
          >
            {escaneando ? 'Escaneando boleta...' : 'Toca para subir foto o imagen'}
          </button>

          {textoOCR && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-700 mb-2">Texto detectado:</p>
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {textoOCR}
              </div>
              <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-3 py-2 rounded-lg">
                Copia el monto detectado y regístralo en el dashboard
              </p>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}