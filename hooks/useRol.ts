'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export function useRol() {
  const [rol, setRol] = useState<'dueño' | 'colaborador' | null>(null)
  const [colaborador, setColaborador] = useState<any>(null)
  const [negocio, setNegocio] = useState<any>(null)
  const [permisos, setPermisos] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function detectarRol() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: negocioPropio } = await supabase
        .from('negocios')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (negocioPropio) {
        setRol('dueño')
        setNegocio(negocioPropio)
        setPermisos({
          registrar_movimientos: true,
          ver_metricas: true,
          ver_inventario: true,
          editar_inventario: true,
          ver_reportes: true,
          cierre_caja: true,
          socio_experto: true
        })
        setLoading(false)
        return
      }

      const { data: colab } = await supabase
        .from('colaboradores')
        .select('*, negocios(*)')
        .eq('user_id', user.id)
        .eq('estado', 'activo')
        .single()

      if (colab) {
        setRol('colaborador')
        setColaborador(colab)
        setNegocio(colab.negocios)
        setPermisos(colab.permisos)
      }

      setLoading(false)
    }

    detectarRol()
  }, [])

  return { rol, colaborador, negocio, permisos, loading }
}