'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export type OwnerFilter = 'mine' | 'all'

/**
 * Selector "Mis casos / Todos" con la misma apariencia de pestañas
 * primarias de /sesiones. Recuerda la última elección por página en
 * localStorage (si falla, queda en "Todos").
 */
export function useOwnerFilter(storageKey: string) {
  const [filter, setFilterState] = useState<OwnerFilter>('all')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved === 'mine' || saved === 'all') setFilterState(saved)
    } catch {
      setFilterState('all')
    }
  }, [storageKey])

  const setFilter = (value: OwnerFilter) => {
    setFilterState(value)
    try {
      localStorage.setItem(storageKey, value)
    } catch {
      // Sin almacenamiento disponible: la elección solo vale para esta visita.
    }
  }

  return [filter, setFilter] as const
}

export function OwnerFilterTabs({
  value,
  onChange,
  mineCount,
  allCount,
}: {
  value: OwnerFilter
  onChange: (value: OwnerFilter) => void
  mineCount: number
  allCount: number
}) {
  const options: { id: OwnerFilter; label: string }[] = [
    { id: 'mine', label: `Mis casos (${mineCount})` },
    { id: 'all', label: `Todos (${allCount})` },
  ]

  return (
    <div className="mb-5 flex border-b">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            value === opt.id
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
