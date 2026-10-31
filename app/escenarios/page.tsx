'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Search, AlertTriangle, FileText, Copy, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DeleteCaseDialog } from '@/components/delete-case-dialog'
import { PageHeader } from '@/components/page-header'
import { OwnerFilterTabs, useOwnerFilter } from '@/components/owner-filter'
import { normalizeSearch } from '@/lib/utils'
import { SeverityGauge } from '@/components/severity-gauge'
import { Paginator, paginate } from '@/components/paginator'
import { LoadingState } from '@/components/ui-states'
import { toast } from 'sonner'
import { deleteScenario, getScenarioUsage, listScenarios, type BackendScenario } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { canManageCase } from '@/lib/case-permissions'

function formatSeverityValue(value: number) {
  const safeValue = Math.max(0, Math.min(5, value))
  return `${safeValue.toFixed(1)}/5.0`
}

export default function EscenariosPage() {
  const router = useRouter()
  const { user, userRole, isLoading: authLoading } = useAuth()
  const [items, setItems] = useState<BackendScenario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [owner, setOwner] = useOwnerFilter('escenarios:owner-filter')
  const [page, setPage] = useState(1)
  const [toDelete, setToDelete] = useState<BackendScenario | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!authLoading && userRole === 'student') {
      router.push('/sesiones')
    }
  }, [authLoading, userRole, router])

  const load = async () => {
    setLoading(true)
    try {
      setItems(await listScenarios())
    } catch (err) {
      toast.error('No se pudo cargar la lista: ' + String(err))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void load() }, [])
  useEffect(() => { setPage(1) }, [search, owner])

  const mineCount = useMemo(
    () => items.filter((s) => !!user && s.created_by === user.id).length,
    [items, user],
  )

  const filtered = useMemo(() => {
    const scoped = owner === 'mine'
      ? items.filter((s) => !!user && s.created_by === user.id)
      : items
    if (!search.trim()) return scoped
    const q = normalizeSearch(search)
    return scoped.filter((s) =>
      normalizeSearch(s.name).includes(q) || normalizeSearch(s.context).includes(q)
    )
  }, [items, search, owner, user])

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteScenario(toDelete.id)
      toast.success('Escenario eliminado.')
      setToDelete(null)
      void load()
    } catch (err) {
      toast.error('No se pudo eliminar: ' + (err instanceof Error ? err.message : String(err)))
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  if (authLoading || userRole === 'student') return null

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Escenarios"
          description="Contextos clínicos disponibles para emparejar con perfiles"
        />
        <Link href="/escenarios/new">
          <Button>
            <Plus className="mr-1 h-4 w-4" /> Nuevo escenario
          </Button>
        </Link>
      </div>

      <OwnerFilterTabs
        value={owner}
        onChange={setOwner}
        mineCount={mineCount}
        allCount={items.length}
      />

      <div className="mb-4 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o contexto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <Card><CardContent><LoadingState className="py-8" /></CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {items.length === 0
                ? 'Aún no has creado ningún escenario. Empieza creando uno.'
                : owner === 'mine' && mineCount === 0
                  ? 'Aún no has creado escenarios. Puedes duplicar uno existente desde Todos o crear uno nuevo.'
                  : 'No hay resultados para tu búsqueda.'}
            </p>
            {items.length === 0 && (
              <Link href="/escenarios/new">
                <Button className="mt-4">
                  <Plus className="mr-1 h-4 w-4" /> Crear primer escenario
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginate(filtered, page).map((s) => {
            const riskFlags = Array.isArray(s.risk_flags) ? s.risk_flags : []

            const riskShown = riskFlags.slice(0, 3)
            const riskExtra = riskFlags.length - riskShown.length
            const canManage = canManageCase(s.created_by, user, userRole)

            return (
            <Card key={s.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {riskFlags.length > 0
                        ? `${riskFlags.length} riesgo${riskFlags.length === 1 ? '' : 's'} visible${riskFlags.length === 1 ? '' : 's'}`
                        : 'Sin banderas de riesgo'}
                    </p>
                    {!!user && s.created_by === user.id && (
                      <Badge variant="outline" className="mt-1 text-xs text-muted-foreground">Tuyo</Badge>
                    )}
                  </div>
                </div>

                <p className="mb-3 line-clamp-3 text-sm">
                  {s.context}
                </p>

                <div className="mb-3 flex items-center gap-1">
                  <div className="flex min-w-0 flex-1 flex-wrap gap-1 overflow-hidden">
                    {riskShown.length > 0 ? riskShown.map((f) => (
                      <Badge key={f} variant="outline" className="gap-1 text-xs">
                        <AlertTriangle className="h-3 w-3" /> {f}
                      </Badge>
                    )) : (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        Sin alertas
                      </span>
                    )}
                  </div>
                  {riskExtra > 0 && (
                    <span className="shrink-0 rounded border border-muted-foreground/30 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      +{riskExtra}
                    </span>
                  )}
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-3">
                  <div className="min-w-0 text-xs text-muted-foreground">
                    <div className="inline-flex items-center gap-2">
                      <span>Severidad</span>
                      <SeverityGauge level={s.severity} size="sm" />
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {formatSeverityValue(s.severity)}
                      </span>
                    </div>
                  </div>

                  <div className="flex w-full items-center justify-end sm:ml-auto sm:w-auto sm:gap-1">
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => router.push(`/escenarios/${s.id}`)}
                    title="Ver"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => router.push(`/escenarios/new?cloneFrom=${s.id}`)}
                    title="Clonar"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {canManage && (
                    <>
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => router.push(`/escenarios/${s.id}/edit`)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => setToDelete(s)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      )}
      <Paginator total={filtered.length} page={page} onPageChange={setPage} />

      <DeleteCaseDialog
        kind="escenario"
        target={toDelete}
        deleting={deleting}
        getUsage={getScenarioUsage}
        onConfirm={() => { void handleDelete() }}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
