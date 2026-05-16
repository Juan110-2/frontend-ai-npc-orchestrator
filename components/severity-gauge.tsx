'use client'

import { cn } from '@/lib/utils'

/**
 * SeverityGauge — barra estilo velocímetro 0..5.
 * Cada segmento tiene su propio color fijo (verde → rojo). Los segmentos
 * iguales o inferiores al nivel actual se rellenan; el resto queda gris.
 */

interface SeverityGaugeProps {
  level: number          // 0..5
  max?: number           // default 5
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showValue?: boolean    // muestra "4.2 / 5" junto a la barra
  className?: string
}

// Paleta tipo tablero de moto: verde → lima → amarillo → naranja → rojo
const SEGMENT_COLORS = [
  'bg-emerald-500',   // 1
  'bg-lime-500',      // 2
  'bg-amber-500',     // 3
  'bg-orange-500',    // 4
  'bg-red-500',       // 5
]

const SIZE_MAP = {
  sm: { bar: 'h-1.5 w-3', gap: 'gap-0.5', text: 'text-[10px]' },
  md: { bar: 'h-2.5 w-4', gap: 'gap-1',   text: 'text-xs' },
  lg: { bar: 'h-3 w-6',   gap: 'gap-1.5', text: 'text-sm' },
}

const SEVERITY_LABELS: Record<number, string> = {
  0: 'Calmado',
  1: 'Leve',
  2: 'Moderado',
  3: 'Elevado',
  4: 'Alto',
  5: 'Crisis',
}

export function SeverityGauge({
  level,
  max = 5,
  size = 'md',
  showLabel = false,
  showValue = false,
  className,
}: SeverityGaugeProps) {
  const safeLevel  = Math.max(0, Math.min(max, level))
  const floorLevel = Math.floor(safeLevel)
  const fraction   = safeLevel - floorLevel          // 0.0 – <1.0
  const labelKey   = Math.round(safeLevel)           // para el texto de etiqueta
  const s = SIZE_MAP[size]
  const segments = Array.from({ length: max }, (_, i) => i + 1)

  return (
    <div
      className={cn('inline-flex items-center', s.gap, className)}
      aria-label={`Severidad ${safeLevel.toFixed(1)} de ${max}`}
      title={`${safeLevel.toFixed(1)} / ${max}`}
    >
      {segments.map((seg) => {
        const isFull    = seg <= floorLevel
        const isPartial = seg === floorLevel + 1 && fraction > 0.02
        const color     = SEGMENT_COLORS[Math.min(seg - 1, SEGMENT_COLORS.length - 1)]

        return (
          <div
            key={seg}
            className={cn(
              'relative overflow-hidden rounded-sm',
              s.bar,
              isFull ? color : 'bg-muted',
            )}
          >
            {isPartial && (
              <div
                className={cn('absolute inset-y-0 left-0', color)}
                style={{ width: `${fraction * 100}%` }}
              />
            )}
          </div>
        )
      })}
      {showLabel && (
        <span className={cn('ml-2 font-medium text-muted-foreground', s.text)}>
          {SEVERITY_LABELS[labelKey] ?? `${safeLevel.toFixed(1)} / ${max}`}
        </span>
      )}
      {showValue && (
        <span className={cn('ml-2 tabular-nums text-muted-foreground', s.text)}>
          {safeLevel.toFixed(1)} / {max}
        </span>
      )}
    </div>
  )
}

/**
 * SeverityRange — muestra dos valores (min y max) en el mismo gauge.
 * Útil para indicar el rango de severidad permitido de un perfil.
 */
interface SeverityRangeProps {
  min: number
  max: number
  ceiling?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean   // muestra "Rango · 1–3" encima de la barra
  className?: string
}

export function SeverityRange({ min, max, ceiling = 5, size = 'md', showLabel = false, className }: SeverityRangeProps) {
  const s = SIZE_MAP[size]
  const segments = Array.from({ length: ceiling }, (_, i) => i + 1)
  return (
    <div className={cn('inline-flex flex-col items-end gap-0.5', className)}>
    {showLabel && (
      <span className={cn('text-muted-foreground/60', s.text)}>
        Rango · {min}–{max}
      </span>
    )}
    <div
      className={cn('inline-flex items-center', s.gap)}
      aria-label={`Rango de severidad ${min} a ${max}`}
      title={`Rango de severidad: ${min}–${max} de ${ceiling}`}
    >
      {segments.map((seg) => {
        const inRange = seg >= min && seg <= max
        return (
          <div
            key={seg}
            className={cn(
              'rounded-sm transition-colors',
              s.bar,
              inRange
                ? SEGMENT_COLORS[Math.min(seg - 1, SEGMENT_COLORS.length - 1)]
                : 'bg-muted/60'
            )}
          />
        )
      })}
    </div>
    </div>
  )
}
