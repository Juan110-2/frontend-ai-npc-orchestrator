'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export const PAGE_SIZE = 6

interface PaginatorProps {
  total: number
  page: number
  pageSize?: number
  onPageChange: (p: number) => void
}

export function Paginator({ total, page, pageSize = PAGE_SIZE, onPageChange }: PaginatorProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null

  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm">
      <span className="text-muted-foreground">
        {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} de {total}
      </span>
      <Button
        variant="outline" size="icon"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="px-2">Página {page} / {pages}</span>
      <Button
        variant="outline" size="icon"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function paginate<T>(arr: T[], page: number, pageSize: number = PAGE_SIZE): T[] {
  const start = (page - 1) * pageSize
  return arr.slice(start, start + pageSize)
}
