'use client'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import { useState, useEffect } from 'react'
import { useRol } from '@/hooks/useRol'
import { usePlan } from '@/hooks/usePlan'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PERMISOS_LABELS: Record<string, string> = {
  registrar_movimientos: 'Registrar movimientos',
  ver_metricas: 'Ver métricas',
  ver_inventario: 'Ver inventario',
  editar_inventario: 'Editar inventario',
  ver_reportes: 'Ver reportes',
  cierre_caja: 'Cierre de caja',
  socio_experto: 'Socio Experto'
}

const PERMISOS_DEFAULT = {
  registrar_movimientos: true,
  ver_metricas: true,
  ver_inventario: true,
  editar_inventario: false,
  ver_reportes: false,
  cierre_caja: true,
  socio_experto: false
}

export default function Equipo() {
  const [negocio, setNegocio] = useState<any>(null)
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [form, setForm] = useState({ email: '', nombre: '', permisos: PERMISOS_DEFAULT })
  const [mensaje, setMensaje] = useState('')

  const { rol } = useRol()
  const { esPro, cargando: cargandoPlan } = usePlan()
  const router = useRouter()

  useEffect(() => {
    if (rol === 'colaborador') router.push('/')
  }, [rol])

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const res = await fetch('/api/negocio')
    const data = await res.json()
    setNegocio(data.negocio)
    setColaboradores(data.colaboradores || [])
    setLoading(false)
  }

  async function invitar() {
    if (!form.email.trim()) return
    const res = await fetch('/api/negocio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accion: 'invitar_colaborador',
        email: form.email,
        nombre: form.nombre,
        permisos: form.permisos
      })
    })
    if (res.ok) {
      setMensaje('Colaborador agregado correctamente')
      setForm({ email: '', nombre: '', permisos: PERMISOS_DEFAULT })
      setMostrarForm(false)
      cargarDatos()
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  async function actualizarPermisos(colaboradorId: string, permisos: any) {
    await fetch('/api/negocio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'actualizar_permisos', colaborador_id: colaboradorId, permisos })
    })
    cargarDatos()
    setEditando(null)
  }

  async function eliminar(colaboradorId: string) {
    await fetch('/api/negocio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'eliminar_colaborador', colaborador_id: colaboradorId })
    })
    cargarDatos()
  }

  async function actualizarNombre(nombre: string) {
    await fetch('/api/negocio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'actualizar_nombre', nombre })
    })
    cargarDatos()
  }

  if (loading || cargandoPlan) return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-100 p-4 pt-16 pb-24 flex items-center justify-center">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </main>
      <NavBar />
    </AuthGuard>
  )

  // Bloqueo para plan gratis
  if (!esPro) return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-100 p-4 pt-16 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="mb-4 pt-2">
            <h1 className="text-2xl font-semibold text-gray-800">Mi Equipo</h1>
            <p className="text-gray-500 text-sm">Gestiona colaboradores y permisos</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-800 mb-2">Colaboradores — Plan Pro</p>
            <p className="text-sm text-gray-400 mb-2">Agrega a tu equipo, asigna permisos y ve quién registra cada movimiento.</p>
            <p className="text-xs text-gray-300 mb-6">Disponible en el plan Pro por $7.990/mes</p>
            <Link href="/precios" className="inline-block bg-green-600 text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-green-700 transition-all">
              Ver planes ⭐
            </Link>
          </div>
        </div>
      </main>
      <NavBar />
    </AuthGuard>
  )

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-100 p-4 pt-16 pb-24">
        <div className="max-w-2xl mx-auto">

          <div className="mb-4 pt-2">
            <h1 className="text-2xl font-semibold text-gray-800">Mi Equipo</h1>
            <p className="text-gray-500 text-sm">Gestiona colaboradores y permisos</p>
          </div>

          {mensaje && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4">
              <p className="text-sm text-green-700">{mensaje}</p>
            </div>
          )}

          <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
            <p className="text-xs text-gray-400 mb-1">Nombre del negocio</p>
            <input
              defaultValue={negocio?.nombre}
              onBlur={e => actualizarNombre(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-400"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 mb-4">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">Colaboradores</p>
                <p className="text-xs text-gray-400">{colaboradores.length} en tu equipo</p>
              </div>
              <button
                onClick={() => setMostrarForm(!mostrarForm)}
                className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700"
              >
                + Agregar
              </button>
            </div>

            {mostrarForm && (
              <div className="p-4 border-b border-gray-50">
                <p className="text-xs font-medium text-gray-700 mb-3">Nuevo colaborador</p>
                <div className="space-y-3">
                  <input
                    placeholder="Nombre"
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-400"
                  />
                  <input
                    placeholder="Email de Google"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-400"
                  />
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Permisos</p>
                    <div className="space-y-2">
                      {Object.entries(PERMISOS_LABELS).map(([key, label]) => (
                        <label key={key} className="flex items-center justify-between py-1">
                          <span className="text-xs text-gray-700">{label}</span>
                          <input
                            type="checkbox"
                            checked={form.permisos[key as keyof typeof PERMISOS_DEFAULT]}
                            onChange={e => setForm({ ...form, permisos: { ...form.permisos, [key]: e.target.checked } })}
                            className="w-4 h-4 accent-green-600"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setMostrarForm(false)} className="border border-gray-200 text-gray-500 rounded-lg py-2 text-sm">Cancelar</button>
                    <button onClick={invitar} className="bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700">Agregar</button>
                  </div>
                </div>
              </div>
            )}

            {colaboradores.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Aún no hay colaboradores</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {colaboradores.map(c => (
                  <div key={c.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{c.nombre || c.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-400">{c.email}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${c.estado === 'activo' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                            {c.estado === 'activo' ? 'Activo' : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditando(editando?.id === c.id ? null : c)} className="text-xs text-blue-600 border border-blue-100 bg-blue-50 px-2 py-1 rounded-lg">Permisos</button>
                        <button onClick={() => eliminar(c.id)} className="text-xs text-red-500 border border-red-100 bg-red-50 px-2 py-1 rounded-lg">Quitar</button>
                      </div>
                    </div>
                    {editando?.id === c.id && (
                      <div className="mt-3 bg-gray-50 rounded-xl p-3">
                        <p className="text-xs font-medium text-gray-600 mb-2">Editar permisos</p>
                        <div className="space-y-2">
                          {Object.entries(PERMISOS_LABELS).map(([key, label]) => (
                            <label key={key} className="flex items-center justify-between py-0.5">
                              <span className="text-xs text-gray-700">{label}</span>
                              <input
                                type="checkbox"
                                checked={editando.permisos?.[key] ?? false}
                                onChange={e => setEditando({ ...editando, permisos: { ...editando.permisos, [key]: e.target.checked } })}
                                className="w-4 h-4 accent-green-600"
                              />
                            </label>
                          ))}
                        </div>
                        <button onClick={() => actualizarPermisos(c.id, editando.permisos)} className="w-full mt-3 bg-green-600 text-white rounded-lg py-2 text-xs font-medium hover:bg-green-700">
                          Guardar permisos
                        </button>
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(c.permisos || {}).filter(([, v]) => v).map(([k]) => (
                        <span key={k} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{PERMISOS_LABELS[k]}</span>
                      ))}
                    </div>
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