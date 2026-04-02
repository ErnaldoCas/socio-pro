'use client'
import { useState, useEffect } from 'react'

interface PlanInfo {
  plan: 'gratis' | 'pro'
  esPro: boolean
  vence: string | null
  cargando: boolean
}

export function usePlan(): PlanInfo {
  const [plan, setPlan] = useState<'gratis' | 'pro'>('gratis')
  const [vence, setVence] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch('/api/suscripcion')
      .then(r => r.json())
      .then(data => {
        setPlan(data.plan || 'gratis')
        setVence(data.vence || null)
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  return { plan, esPro: plan === 'pro', vence, cargando }
}