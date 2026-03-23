'use client'
import { useState, useRef } from 'react'

export default function OcrInventario({ onProductosImportados }) {
  const [paso, setPaso] = useState('inicio')
  const [productos, setProductos] = useState([])
  const [nota, setNota] = useState('')
  const [confianza, setConfianza] = useState('')
  const [guardando, setGuardando] = useState(false)
  const fileRef = useRef(null)

  async function escanear(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPaso('interpretando')

    const formData = new FormData()
    formData.append('imagen', file)

    const res = await fetch('/api/ocr-inventario', {
      method: 'POST',
      body: formData
    })

    const data = await res.json()

    if (data.productos && data.productos.length > 0) {
      setProductos(data.productos)
      setNota(data.nota || '')
      setConfianza(data.confianza || 'media')
      setPaso('confirmar')
    } else {
      setPaso('sin-resultados')
    }
  }

  function actualizarProducto(index, campo, valor) {
    const nuevos = [...productos]
    nuevos[index][campo] = valor
    setProductos(nuevos)
  }

  function eliminarProducto(index) {
    setProductos(productos.filter((_, i) => i !== index))
  }

  async function guardarTodos() {
    setGuardando(true)
    let exitosos = 0

    for (const p of productos) {
      const res = await fetch('/api/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      })
      if (res.ok) exitosos++
    }

    setGuardando(false)
    setPaso('inicio')
    setProductos([])
    onProductosImportados(exitosos)
  }

  function reiniciar() {
    setPaso('inicio')
    setProductos([])
  }

  const colorConfianza = confianza === 'alta'
    ? 'text-green-600 bg-green-50'
    : confianza === 'media'
    ? 'text-amber-600 bg-amber-50'
    : 'text-red-600 bg-red-50'

  return (
    <div className="bg-white rounded-xl border border-gray-100 mb-4">
      <div className="p-5 border-b border-gray-50">
        <p className="text-sm font-medium text-gray-700">Importar desde foto</p>
        <p className="text-xs text-gray-400 mt-0.5">Escanea una factura o lista de productos</p>
      </div>

      <div className="p-5">

        {paso === 'inicio' && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={escanear}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 text-sm text-gray-400 hover:border-green-400 hover:text-green-600 transition-all"
            >
              <div className="flex flex-col items-center gap-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                <span>Toca para fotografiar o subir imagen</span>
                <span className="text-xs text-gray-300">Factura, lista o cuaderno de productos</span>
              </div>
            </button>
          </>
        )}

        {paso === 'interpretando' && (
          <div className="text-center py-6">
            <div className="flex justify-center gap-1 mb-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-sm text-gray-500">Analizando imagen con IA...</p>
          </div>
        )}

        {paso === 'sin-resultados' && (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-4">No se encontraron productos en la imagen.</p>
            <p className="text-xs text-gray-400 mb-4">Intenta con una imagen más clara o con mejor iluminación.</p>
            <button onClick={reiniciar} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm">
              Intentar de nuevo
            </button>
          </div>
        )}

        {paso === 'confirmar' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className={`text-xs px-2 py-1 rounded-full font-medium ${colorConfianza}`}>
                Confianza: {confianza}
              </div>
              <span className="text-xs text-gray-400">{productos.length} productos detectados</span>
            </div>

            {nota && (
              <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg mb-3">{nota}</p>
            )}

            <div className="space-y-3 mb-4">
              {productos.map((p, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-2">
                    <input
                      value={p.nombre}
                      onChange={e => actualizarProducto(i, 'nombre', e.target.value)}
                      className="text-sm font-medium text-gray-800 border-none outline-none flex-1 bg-transparent"
                    />
                    <button
                      onClick={() => eliminarProducto(i)}
                      className="text-gray-300 hover:text-red-400 text-xs ml-2"
                    >✕</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Stock</p>
                      <input
                        type="number"
                        value={p.stock}
                        onChange={e => actualizarProducto(i, 'stock', Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-green-400"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Precio</p>
                      <input
                        type="number"
                        value={p.precio}
                        onChange={e => actualizarProducto(i, 'precio', Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-green-400"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Costo</p>
                      <input
                        type="number"
                        value={p.costo}
                        onChange={e => actualizarProducto(i, 'costo', Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-green-400"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={reiniciar}
                className="border border-gray-200 text-gray-500 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarTodos}
                disabled={guardando || productos.length === 0}
                className="bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : `Guardar ${productos.length} productos`}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}