'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatSeverityNumber, SeverityGauge } from '@/components/severity-gauge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { getScenario, updateScenario } from '@/lib/api'
import { LoadingState } from '@/components/ui-states'
import { useAuth } from '@/lib/auth-context'
import { canManageCase } from '@/lib/case-permissions'
import { CaseEditRestricted } from '@/components/case-edit-restricted'

export default function EditarEscenarioPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id as string
  const { user, userRole, isLoading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // undefined = el escenario aún no se cargó
  const [createdBy, setCreatedBy] = useState<string | null | undefined>(undefined)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [context, setContext] = useState('')
  const [severity, setSeverity] = useState(3)
  const [riskFlags, setRiskFlags] = useState<string[]>([])
  const [draftFlag, setDraftFlag] = useState('')
  const [constraintsExtras, setConstraintsExtras] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (!authLoading && userRole === 'student') {
      router.push('/sesiones')
      return
    }
    if (!id) return
    void (async () => {
      try {
        const s = await getScenario(id)
        const constraints = (s.constraints ?? {}) as Record<string, unknown>
        const knownKeys = new Set(['description'])

        setCreatedBy(s.created_by ?? null)
        setName(s.name)
        setDescription(typeof constraints.description === 'string' ? constraints.description : '')
        setContext(s.context)
        setSeverity(Math.max(1, Math.min(5, Math.round(s.severity || 3))))
        setRiskFlags(s.risk_flags ?? [])
        setConstraintsExtras(
          Object.fromEntries(
            Object.entries(constraints).filter(([key]) => !knownKeys.has(key))
          )
        )
      } catch (err) {
        toast.error('No se pudo cargar el escenario: ' + String(err))
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const addFlag = () => {
    const v = draftFlag.trim()
    if (!v || riskFlags.includes(v)) return
    setRiskFlags([...riskFlags, v])
    setDraftFlag('')
  }

  const handleSave = async () => {
    if (!name.trim() || !context.trim()) {
      toast.error('Nombre y contexto son obligatorios.')
      return
    }
    setSaving(true)
    try {
      const constraints: Record<string, unknown> = {
        ...constraintsExtras,
        description,
      }

      await updateScenario(id, {
        name,
        context,
        severity: Math.round(severity),
        risk_flags: riskFlags,
        constraints,
      })
      toast.success('Escenario actualizado.')
      router.push('/escenarios')
    } catch (err) {
      toast.error('No se pudo guardar: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || userRole === 'student') return null

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card><CardContent><LoadingState className="py-8" /></CardContent></Card>
      </div>
    )
  }

  if (createdBy !== undefined && !canManageCase(createdBy, user, userRole)) {
    return (
      <CaseEditRestricted
        backHref="/escenarios"
        backLabel="Volver a escenarios"
        cloneHref={`/escenarios/new?cloneFrom=${id}`}
      />
    )
  }

  return (
    <div className="container mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      <Link href="/escenarios" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Volver a escenarios
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Editar escenario</h1>
        <p className="text-sm text-muted-foreground">
          Ajusta el contexto, la severidad inicial y las banderas de riesgo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuración del escenario</CardTitle>
          <CardDescription>Los cambios se aplicarán a las próximas sesiones.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej. Sobrecarga académica en universidad" />
          </div>
            <div className="space-y-2">
              <Label>Descripción *</Label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe brevemente el objetivo del escenario."
              />
            </div>
            <div className="space-y-2">
            <Label>Contexto narrativo *</Label>
            <Textarea
              rows={4}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="¿Qué está viviendo el NPC al iniciar la sesión?"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Severidad inicial · {formatSeverityNumber(severity)} / 5</Label>
              <Slider value={[severity]} min={1} max={5} step={1} onValueChange={(v) => setSeverity(v[0])} />
              <div className="pt-1">
                <SeverityGauge level={severity} size="md" showLabel />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Banderas de riesgo</Label>
              <span className="text-xs text-muted-foreground">{riskFlags.length} activas</span>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex flex-wrap gap-2">
                {riskFlags.length === 0
                  ? <span className="text-xs text-muted-foreground">Sin banderas.</span>
                  : riskFlags.map((f, i) => (
                    <Badge key={`${f}-${i}`} variant="outline" className="gap-1.5 bg-background">
                      <AlertTriangle className="h-3 w-3 text-amber-600" /> {f}
                      <button
                        onClick={() => setRiskFlags(riskFlags.filter((_, j) => j !== i))}
                        className="hover:text-destructive"
                        aria-label="Quitar"
                      >×</button>
                    </Badge>
                  ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Input
                  value={draftFlag}
                  onChange={(e) => setDraftFlag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFlag() } }}
                  placeholder="ej. insomnio"
                  className="h-10"
                />
                <Button type="button" variant="outline" onClick={addFlag} className="h-10 w-10 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-1 h-4 w-4" /> {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}
