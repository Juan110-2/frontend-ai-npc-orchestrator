'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Copy, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CASE_EDIT_RESTRICTED_MESSAGE } from '@/lib/case-permissions'

interface CaseEditRestrictedProps {
  /** Ruta del listado, para el enlace superior y el botón Volver. */
  backHref: string
  backLabel: string
  /** Ruta del formulario de creación con ?cloneFrom=<id>. */
  cloneHref: string
}

/** Se muestra en lugar del formulario de edición cuando el usuario no es el autor ni administrador. */
export function CaseEditRestricted({ backHref, backLabel, cloneHref }: CaseEditRestrictedProps) {
  const router = useRouter()

  return (
    <div className="container mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      <Link href={backHref} className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> {backLabel}
      </Link>

      <Card>
        <CardContent className="flex flex-col items-center py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-foreground">No puedes editar este caso</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{CASE_EDIT_RESTRICTED_MESSAGE}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => router.push(cloneHref)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </Button>
            <Button variant="outline" onClick={() => router.push(backHref)}>
              Volver
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
