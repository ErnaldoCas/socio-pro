// socio-pro/app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">🤔</div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Página no encontrada</h1>
        <p className="text-gray-500 text-sm mb-6">
          Esta página no existe. Volvamos a donde estaban los números.
        </p>
        <Link
          href="/"
          className="bg-green-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-green-700 transition-all"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}