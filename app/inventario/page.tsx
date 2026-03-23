'use client'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import OcrInventario from '@/components/OcrInventario'
import { useState, useEffect } from 'react'

export default function Inventario() {
  const [productos, setProductos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [mensajeImport, setMensajeImport] = useState('')
  const [form, setForm] = useState({
    nombre: '',
    stock: '',
    precio: '',
    costo: '',
    stock_minimo: '5',
    categoria: 'general'
  })

  useEffect(() => {
    cargarProductos()
  }, [])

  async function cargarProductos() {
    const res = await fetch('/api/inventario')
    const data = await res.json()
    setProductos(data || [])
  }

  async function agregarProducto() {
    if (!form.nombre.trim()) return
    setLoading(true)

    await fetch('/api/inventario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: form.nombre,
        stock: Number(form.stock),
        precio: Number(form.precio),
        costo: Number(form.costo),
        stock_minimo: Number(form.stock_minimo),
        categoria: form.categoria
      })
    })

    setForm({ nombre: '', stock: '', precio: '', costo: '', stock_minimo: '5', categoria: 'general' })
    setMostrarForm(false)
    cargarProductos()
    setLoading(false)
  }

  function handleImport(n: number) {
    cargarProductos()
    setMensajeImport(`${n} producto${n !== 1 ? 's' : ''} importado${n !== 1 ? 's' : ''} correctamente`)
    setTimeout(() => setMensajeImport(''), 4000)
  }

  const stockBajo = productos.filter(p => p.stock <= p.stock_minimo)

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-100 p-4 pt-16 pb-24">
        <div className="max-w-2xl mx-auto">

          <div className="mb-6 pt-2">
            <h1 className="text-2xl font-semibold text-gray-800">Inventario</h1>
            <p className="text-gray-500 text-sm">Controla tu stock de productos</p>
          </div>

          {mensajeImport && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4">
              <p className="text-sm text-green-700">{mensajeImport}</p>
            </div>
          )}

          {stockBajo.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-red-700 mb-2">Stock bajo</p>
              {stockBajo.map(p => (
                <p key={p.id} className="text-xs text-red-600">
                  {p.nombre} — quedan {p.stock} unidades
                </p>
              ))}
            </div>
          )}

          <OcrInventario onProductosImportados={handleImport} />

          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="w-full bg-green-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-green-700 mb-4"
          >
            {mostrarForm ? 'Cancelar' : '+ Agregar producto manualmente'}
          </button>

          {mostrarForm && (
            <div className="bg-white rounded-xl p-5 border border-gray-100 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-4">Nuevo producto</p>
              <div className="space-y-3">
                <input
                  placeholder="Nombre del producto"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-400"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Stock actual"
                    type="number"
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                    className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-400"
                  />
                  <input
                    placeholder="Stock mínimo"
                    type="number"
                    value={form.stock_minimo}
                    onChange={e => setForm({ ...form, stock_minimo: e.target.value })}
                    className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-400"
                  />
                  <input
                    placeholder="Precio venta"
                    type="number"
                    value={form.precio}
                    onChange={e => setForm({ ...form, precio: e.target.value })}
                    className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-400"
                  />
                  <input
                    placeholder="Costo"
                    type="number"
                    value={form.costo}
                    onChange={e => setForm({ ...form, costo: e.target.value })}
                    className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-400"
                  />
                </div>
                <select
                  value={form.categoria}
                  onChange={e => setForm({ ...form, categoria: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-green-400"
                >
                  <option value="general">General</option>
                  <option value="alimentación">Alimentación</option>
                  <option value="insumos">Insumos</option>
                  <option value="bebidas">Bebidas</option>
                  <option value="limpieza">Limpieza</option>
                </select>
                <button
                  onClick={agregarProducto}
                  disabled={loading}
                  className="w-full bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar producto'}
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100">
            <div className="p-5 border-b border-gray-50">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-700">Productos</p>
                <span className="text-xs text-gray-400">{productos.length} productos</span>
              </div>
            </div>
            {productos.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">
                Aún no hay productos — agrega el primero
              </p>
            ) : (
              <div className="divide-y divide-gray-50">
                {productos.map(p => (
                  <div key={p.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.nombre}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs text-gray-400">Precio: ${p.precio.toLocaleString()}</span>
                        <span className="text-xs text-gray-400">Costo: ${p.costo.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-semibold ${p.stock <= p.stock_minimo ? 'text-red-500' : 'text-gray-700'}`}>
                        {p.stock} u.
                      </span>
                      {p.stock <= p.stock_minimo && (
                        <p className="text-xs text-red-400">stock bajo</p>
                      )}
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