'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface ChipListProps {
  tags: string[]
  chipClass: string
  badgeClass: string
  className?: string
}

export function ChipList({ tags, chipClass, badgeClass, className }: ChipListProps) {
  const ref = useRef<HTMLDivElement>(null)
  const widthsRef = useRef<number[]>([])
  const [visibleCount, setVisibleCount] = useState(tags.length)

  const compute = (W: number, bW: number) => {
    const GAP = 4
    let used = 0
    let n = 0
    for (let i = 0; i < widthsRef.current.length; i++) {
      const w = widthsRef.current[i]
      const more = widthsRef.current.length - i - 1
      const needed = (n > 0 ? GAP : 0) + w + (more > 0 ? bW : 0)
      if (used + needed <= W) {
        used += (n > 0 ? GAP : 0) + w
        n++
      } else break
    }
    return n
  }

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const chipEls = Array.from(el.querySelectorAll<HTMLElement>('[data-chip]'))
    const saved = chipEls.map(c => c.style.display)
    chipEls.forEach(c => { c.style.display = '' })
    widthsRef.current = chipEls.map(c => c.offsetWidth)
    chipEls.forEach((c, i) => { c.style.display = saved[i] })
    const badgeEl = el.querySelector<HTMLElement>('[data-badge-m]')
    const bW = (badgeEl?.offsetWidth ?? 30) + 4
    setVisibleCount(compute(el.offsetWidth, bW))
  }, [tags.join('\0')])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      if (!widthsRef.current.length) return
      const badgeEl = el.querySelector<HTMLElement>('[data-badge-m]')
      const bW = (badgeEl?.offsetWidth ?? 30) + 4
      setVisibleCount(compute(el.offsetWidth, bW))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const extra = tags.length - visibleCount

  return (
    <div ref={ref} className={cn('relative flex items-center gap-1 overflow-hidden', className)}>
      {tags.map((tag, i) => (
        <span
          key={tag}
          data-chip
          style={i >= visibleCount ? { display: 'none' } : undefined}
          className={cn('shrink-0', chipClass)}
        >
          {tag}
        </span>
      ))}
      {extra > 0 && (
        <span className={cn('shrink-0', badgeClass)}>+{extra}</span>
      )}
      <span
        data-badge-m
        aria-hidden
        className={cn('invisible absolute pointer-events-none', badgeClass)}
      >
        +0
      </span>
    </div>
  )
}
