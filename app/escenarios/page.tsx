'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Search, AlertTriangle, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { SeverityGauge } from '@/components/severity-gauge'
import { toast } from 'sonner'
import { deleteScenario, listScenarios, type BackendScenario } from '@/lib/backend-api'

export default function EscenariosPage() {
  const router = useRouter()
  const [items, setItems] = useState<BackendScenario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter((s) =>
      s.name.toLowerCase().includes(q) || s.context.toLowerCase().includes(q)
    )
  }, [items, search])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este escenario? Las sesiones que lo usan también se borrarán.')) return
    try {
      await deleteScenario(id)
      toast.success('Escenario eliminado.')
      void load()
    } catch (err) {
      toast.error('No se pudo eliminar: ' + String(err))
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Escenarios"
          description="Contextos clínicos disponibles para emparejar con pacientes"
        />
        <Link href="/escenarios/new">
          <Button>
            <Plus className="mr-1 h-4 w-4" /> Nuevo escenario
          </Button>
        </Link>
      </div>

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
        <Card><CardContent className="p-8 text-center text-muted-foreground">Cargando…</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {items.length === 0
                ? 'Aún no has creado ningún escenario.'
                : 'No hay resultados.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex flex-col p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="font-medium leading-tight">{s.name}</p>
                  <SeverityGauge level={s.severity} size="sm" />
                </div>
                <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">
                  {s.context}
                </p>
                {s.risk_flags && s.risk_flags.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {s.risk_flags.slice(0, 3).map((f) => (
                      <Badge key={f} variant="outline" className="gap-1 text-xs">
                        <AlertTriangle className="h-3 w-3" /> {f}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="mt-auto flex items-center justify-end gap-1 border-t pt-3">
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => router.push(`/escenarios/${s.id}/edit`)}
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => handleDelete(s.id)}
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
