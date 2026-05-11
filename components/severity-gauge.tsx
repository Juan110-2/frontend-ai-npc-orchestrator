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
  className,
}: SeverityGaugeProps) {
  const safeLevel = Math.max(0, Math.min(max, Math.round(level)))
  const s = SIZE_MAP[size]
  const segments = Array.from({ length: max }, (_, i) => i + 1) // 1..max

  return (
    <div className={cn('inline-flex items-center', s.gap, className)} aria-label={`Severidad ${safeLevel} de ${max}`}>
      {segments.map((seg) => (
        <div
          key={seg}
          className={cn(
            'rounded-sm transition-colors',
            s.bar,
            seg <= safeLevel
              ? SEGMENT_COLORS[Math.min(seg - 1, SEGMENT_COLORS.length - 1)]
              : 'bg-muted'
          )}
        />
      ))}
      {showLabel && (
        <span className={cn('ml-2 font-medium text-muted-foreground', s.text)}>
          {SEVERITY_LABELS[safeLevel] ?? `${safeLevel}/${max}`}
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
  className?: string
}

export function SeverityRange({ min, max, ceiling = 5, size = 'md', className }: SeverityRangeProps) {
  const s = SIZE_MAP[size]
  const segments = Array.from({ length: ceiling }, (_, i) => i + 1)
  return (
    <div className={cn('inline-flex items-center', s.gap, className)} aria-label={`Rango de severidad ${min} a ${max}`}>
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
  )
}
