'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function Graficos({ movimientos }) {
  const porDia = movimientos.reduce((acc, m) => {
    const fecha = new Date(m.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
    if (!acc[fecha]) acc[fecha] = { fecha, ingresos: 0, egresos: 0 }
    if (m.tipo === 'ingreso') acc[fecha].ingresos += m.monto
    if (m.tipo === 'egreso') acc[fecha].egresos += m.monto
    return acc
  }, {})

  const data = Object.values(porDia).slice(-7)

  if (data.length === 0) return null

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 mb-6">
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm font-medium text-gray-700">Movimientos por día</p>
        <div className="flex gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-green-500 inline-block"></span>Ingresos
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-red-400 inline-block"></span>Egresos
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={20} barGap={4}>
          <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value) => [`$${value.toLocaleString()}`, '']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e5e7eb' }}
            cursor={{ fill: '#f9fafb' }}
          />
          <Bar dataKey="ingresos" fill="#16a34a" radius={[4, 4, 0, 0]} name="Ingresos" />
          <Bar dataKey="egresos" fill="#ef4444" radius={[4, 4, 0, 0]} name="Egresos" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}