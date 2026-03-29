'use client'
import { useEffect, useState } from 'react'

export default function PushSubscriber() {
  const [estado, setEstado] = useState<'idle' | 'activado' | 'denegado' | 'no_soportado'>('idle')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setEstado('no_soportado')
      return
    }
    if (Notification.permission === 'granted') setEstado('activado')
    else if (Notification.permission === 'denied') setEstado('denegado')
  }, [])

  async function activar() {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const permiso = await Notification.requestPermission()
      if (permiso !== 'granted') { setEstado('denegado'); return }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string
        ),
      })

      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      })

      setEstado('activado')
    } catch (err) {
      console.error('Error activando notificaciones:', err)
    }
  }

  async function desactivar() {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setEstado('idle')
    } catch (err) {
      console.error('Error desactivando:', err)
    }
  }

  if (estado === 'no_soportado') return null

  return (
    <button
      onClick={estado === 'activado' ? desactivar : activar}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '14px 16px',
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        borderRadius: 12,
        cursor: estado === 'denegado' ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 20 }}>🔔</span>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--foreground)', margin: 0 }}>
            Notificaciones push
          </p>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            {estado === 'activado'
              ? 'Activadas — toca para desactivar'
              : estado === 'denegado'
              ? 'Bloqueadas en tu navegador'
              : 'Recibe alertas de stock bajo'}
          </p>
        </div>
      </div>

      <div style={{
        width: 44,
        height: 24,
        borderRadius: 99,
        background: estado === 'activado' ? '#16a34a' : '#d1d5db',
        position: 'relative',
        transition: 'background 0.25s',
        flexShrink: 0,
        opacity: estado === 'denegado' ? 0.4 : 1,
      }}>
        <div style={{
          position: 'absolute',
          top: 3,
          left: estado === 'activado' ? 23 : 3,
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

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const output = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}