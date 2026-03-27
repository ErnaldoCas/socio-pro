'use client'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import { useState, useEffect } from 'react'
import { useRol } from '@/hooks/useRol'

export default function Movimientos() {
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [filtro, setFiltro] = useState('todos')
  const [filtroColaborador, setFiltroColaborador] = useState('todos')
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ concepto: '', monto: '', tipo: '', categoria: '' })
  const [guardando, setGuardando] = useState(false)

  const { rol } = useRol()
  const esDueno = rol === 'dueño'

  useEffect(() => {
    cargarMovimientos()
  }, [])

  // ✅ Se dispara cuando esDueno cambia de false a true
  useEffect(() => {
    if (esDueno) cargarColaboradores()
  }, [esDueno])

  async function cargarColaboradores() {
    const res = await fetch('/api/negocio')
    const data = await res.json()
    setColaboradores(data.colaboradores?.filter((c: any) => c.estado === 'activo') || [])
  }

  async function cargarMovimientos() {
    const res = await fetch('/api/movimientos')
    const data = await res.json()
    setMovimientos(data || [])
  }

  async function eliminar(id: string) {
    await fetch(`/api/movimientos?id=${id}`, { method: 'DELETE' })
    setConfirmandoId(null)
    cargarMovimientos()
  }

  function iniciarEdicion(m: any) {
    setEditandoId(m.id)
    setEditForm({
      concepto: m.concepto,
      monto: String(m.monto),
      tipo: m.tipo,
      categoria: m.categoria || 'general'
    })
  }

  async function guardarEdicion(id: string) {
    if (!editForm.concepto.trim() || !editForm.monto) return
    setGuardando(true)
    await fetch('/api/movimientos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        concepto: editForm.concepto,
        monto: Number(editForm.monto),
        tipo: editForm.tipo,
        categoria: editForm.categoria
      })
    })
    setEditandoId(null)
    setGuardando(false)
    cargarMovimientos()
  }

  function getNombreColaborador(m: any) {
    if (!m.colaborador_id) return 'Tú (dueño)'
    const colab = colaboradores.find(c => c.id === m.colaborador_id)
    return colab?.nombre || colab?.email || 'Colaborador'
  }

  const filtrados = movimientos.filter(m => {
    const porTipo = filtro === 'todos' || m.tipo === filtro
    const porColaborador = filtroColaborador === 'todos'
      ? true
      : filtroColaborador === 'dueno'
      ? !m.colaborador_id
      : m.colaborador_id === filtroColaborador
    return porTipo && porColaborador
  })

  const ingresos = filtrados.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0)
  const egresos = filtrados.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0)

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-100 p-4 pt-16 pb-24">
        <div className="max-w-2xl mx-auto">

          <div className="mb-6 pt-2">
            <h1 className="text-2xl font-semibold text-gray-800">Movimientos</h1>
            <p className="text-gray-500 text-sm">Historial completo</p>
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

          {/* Filtro por tipo */}
          <div className="flex gap-2 mb-3">
            {['todos', 'ingreso', 'egreso'].map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filtro === f
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-500 border border-gray-200'
                }`}
              >
                {f === 'todos' ? 'Todos' : f === 'ingreso' ? 'Ingresos' : 'Egresos'}
              </button>
            ))}
          </div>

          {/* Filtro por colaborador */}
          {esDueno && colaboradores.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              <button
                onClick={() => setFiltroColaborador('todos')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                  filtroColaborador === 'todos'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-500 border border-gray-200'
                }`}
              >
                Todo el equipo
              </button>
              <button
                onClick={() => setFiltroColaborador('dueno')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                  filtroColaborador === 'dueno'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-500 border border-gray-200'
                }`}
              >
                Solo mis registros
              </button>
              {colaboradores.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => setFiltroColaborador(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                    filtroColaborador === c.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-500 border border-gray-200'
                  }`}
                >
                  {c.nombre || c.email}
                </button>
              ))}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100">
            {filtrados.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No hay movimientos</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtrados.map(m => (
                  <div key={m.id}>

                    {editandoId === m.id ? (
                      <div className="p-4 bg-gray-50">
                        <p className="text-xs font-medium text-gray-600 mb-3">Editar movimiento</p>
                        <div className="space-y-2">
                          <input
                            value={editForm.concepto}
                            onChange={e => setEditForm({ ...editForm, concepto: e.target.value })}
                            placeholder="Concepto"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-400 bg-white"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              value={editForm.monto}
                              onChange={e => setEditForm({ ...editForm, monto: e.target.value })}
                              placeholder="Monto"
                              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-400 bg-white"
                            />
                            <select
                              value={editForm.tipo}
                              onChange={e => setEditForm({ ...editForm, tipo: e.target.value })}
                              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-400 bg-white"
                            >
                              <option value="ingreso">Ingreso</option>
                              <option value="egreso">Egreso</option>
                            </select>
                          </div>
                          <select
                            value={editForm.categoria}
                            onChange={e => setEditForm({ ...editForm, categoria: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-400 bg-white"
                          >
                            <option value="general">General</option>
                            <option value="alimentación">Alimentación</option>
                            <option value="insumos">Insumos</option>
                            <option value="servicios">Servicios</option>
                            <option value="personal">Personal</option>
                            <option value="transporte">Transporte</option>
                            <option value="marketing">Marketing</option>
                          </select>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              onClick={() => setEditandoId(null)}
                              className="border border-gray-200 text-gray-500 rounded-lg py-2 text-sm hover:bg-gray-100"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => guardarEdicion(m.id)}
                              disabled={guardando}
                              className="bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                            >
                              {guardando ? 'Guardando...' : 'Guardar'}
                            </button>
                          </div>
                        </div>
                      </div>

                    ) : confirmandoId === m.id ? (
                      <div className="p-4 bg-red-50">
                        <p className="text-sm text-red-700 font-medium mb-1">¿Eliminar este movimiento?</p>
                        <p className="text-xs text-red-500 mb-3 truncate">{m.concepto} — ${m.monto.toLocaleString()}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setConfirmandoId(null)}
                            className="border border-gray-200 text-gray-500 rounded-lg py-2 text-sm hover:bg-gray-100 bg-white"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => eliminar(m.id)}
                            className="bg-red-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-600"
                          >
                            Sí, eliminar
                          </button>
                        </div>
                      </div>

                    ) : (
                      <div className="p-4 flex justify-between items-center">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm text-gray-800 truncate">{m.concepto}</p>
                          <div className="flex gap-2 mt-0.5 flex-wrap items-center">
                            {m.categoria && (
                              <span className="text-xs text-gray-400">{m.categoria}</span>
                            )}
                            <span className="text-xs text-gray-300">
                              {new Date(m.created_at).toLocaleDateString('es-CL', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                            {/* ✅ Badge quién registró */}
                            {esDueno && (
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
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-sm font-medium ${m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-500'}`}>
                            {m.tipo === 'ingreso' ? '+' : '-'}${m.monto.toLocaleString()}
                          </span>
                          <button
                            onClick={() => iniciarEdicion(m)}
                            className="text-xs text-blue-500 border border-blue-100 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setConfirmandoId(m.id)}
                            className="text-xs text-red-400 border border-red-100 bg-red-50 px-2 py-1 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
      <NavBar />
    </AuthGuard>
  )
}