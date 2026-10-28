'use client'

import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { CaseUsage } from '@/lib/api'

type Props = {
  kind: 'perfil' | 'escenario'
  target: { id: string; name: string } | null
  deleting: boolean
  getUsage: (id: string) => Promise<CaseUsage>
  onConfirm: () => void
  onClose: () => void
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

export function DeleteCaseDialog({ kind, target, deleting, getUsage, onConfirm, onClose }: Props) {
  // Resultado de la consulta, asociado al id consultado: una respuesta tardía
  // de un diálogo anterior nunca se aplica al actual.
  const [result, setResult] = useState<{ id: string; usage: CaseUsage | null } | null>(null)
  const targetId = target?.id

  useEffect(() => {
    if (!targetId) return
    let cancelled = false
    getUsage(targetId)
      .then((usage) => { if (!cancelled) setResult({ id: targetId, usage }) })
      // Sin datos de uso: el backend igual protege con 403/409.
      .catch(() => { if (!cancelled) setResult({ id: targetId, usage: null }) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId])

  const checking = target !== null && result?.id !== targetId
  const usage = result && result.id === targetId ? result.usage : null
  const name = target?.name
  const withActivity = usage?.sessions_with_activity ?? 0
  const unused = usage?.unused_sessions ?? 0
  const notAllowed = usage?.allowed === false
  const blocked = notAllowed || withActivity > 0

  let message: string
  if (notAllowed) {
    message = `Solo el autor del ${kind} o un administrador puede eliminarlo.`
  } else if (withActivity > 0) {
    message =
      `No se puede eliminar: tiene ${withActivity} ` +
      plural(withActivity, 'sesión', 'sesiones') +
      ' con conversación o evaluación registrada. Se conserva para mantener la trazabilidad de las prácticas.'
  } else if (unused > 0) {
    message =
      `Se eliminará el ${kind} «${name}» y también ${unused} ` +
      plural(unused, 'sesión asignada que nunca se inició', 'sesiones asignadas que nunca se iniciaron') +
      '.'
  } else {
    message = `Se eliminará el ${kind} «${name}».`
  }

  return (
    <AlertDialog open={target !== null} onOpenChange={(open) => { if (!open && !deleting) onClose() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar {kind}?</AlertDialogTitle>
          <AlertDialogDescription>
            {checking ? `Se eliminará el ${kind} «${name}». Comprobando sesiones asociadas…` : message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleting || checking || blocked}
            onClick={(e) => { e.preventDefault(); onConfirm() }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
