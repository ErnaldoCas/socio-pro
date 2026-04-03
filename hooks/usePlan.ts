'use client'
import { useState, useEffect } from 'react'

export type PlanTipo = 'gratis' | 'pro' | 'beta'

interface PlanInfo {
  plan: PlanTipo
  esPro: boolean   // true si es 'pro' O 'beta'
  esBeta: boolean
  vence: string | null
  cargando: boolean
}

export function usePlan(): PlanInfo {
  const [plan, setPlan] = useState<PlanTipo>('gratis')
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

  const esPro = plan === 'pro' || plan === 'beta'
  return { plan, esPro, esBeta: plan === 'beta', vence, cargando }
}