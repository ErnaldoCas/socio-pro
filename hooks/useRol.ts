'use client'
import { useRolContext } from '@/contexts/RolContext'

export function useRol() {
  return useRolContext()
}