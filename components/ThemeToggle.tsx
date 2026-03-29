'use client'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [oscuro, setOscuro] = useState(false)
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    const guardado = localStorage.getItem('tema')
    const prefiereDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const activo = guardado === 'oscuro' || (!guardado && prefiereDark)
    setOscuro(activo)
    document.documentElement.classList.toggle('dark', activo)
    setMontado(true)
  }, [])

  function toggle() {
    const nuevo = !oscuro
    setOscuro(nuevo)
    document.documentElement.classList.toggle('dark', nuevo)
    localStorage.setItem('tema', nuevo ? 'oscuro' : 'claro')
  }

  if (!montado) return null

  return (
    <button
      onClick={toggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '14px 16px',
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 20 }}>{oscuro ? '🌙' : '☀️'}</span>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--foreground)', margin: 0 }}>
            Modo {oscuro ? 'oscuro' : 'claro'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            {oscuro ? 'Cambia a modo claro' : 'Cambia a modo oscuro'}
          </p>
        </div>
      </div>

      {/* Toggle pill */}
      <div style={{
        width: 44,
        height: 24,
        borderRadius: 99,
        background: oscuro ? '#16a34a' : '#d1d5db',
        position: 'relative',
        transition: 'background 0.25s',
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute',
          top: 3,
          left: oscuro ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: 'white',
          transition: 'left 0.25s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
    </button>
  )
}