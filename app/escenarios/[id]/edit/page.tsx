'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { getScenario, updateScenario } from '@/lib/backend-api'

export default function EditarEscenarioPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [context, setContext] = useState('')
  const [severity, setSeverity] = useState(3)
  const [riskFlags, setRiskFlags] = useState<string[]>([])
  const [draftFlag, setDraftFlag] = useState('')

  useEffect(() => {
    if (!id) return
    void (async () => {
      try {
        const s = await getScenario(id)
        setName(s.name)
        setContext(s.context)
        setSeverity(s.severity)
        setRiskFlags(s.risk_flags ?? [])
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
      await updateScenario(id, {
        name,
        context,
        severity,
        risk_flags: riskFlags,
      })
      toast.success('Escenario actualizado.')
      router.push('/escenarios')
    } catch (err) {
      toast.error('No se pudo guardar: ' + String(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card><CardContent className="p-6 text-center text-muted-foreground">Cargando…</CardContent></Card>
      </div>
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
        <CardContent className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej. Sobrecarga académica en universidad" />
          </div>
          <div>
            <Label>Contexto narrativo *</Label>
            <Textarea
              rows={4}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="¿Qué está viviendo el paciente al iniciar la sesión?"
            />
          </div>
          <div>
            <Label>Severidad inicial · {severity} / 5</Label>
            <Slider value={[severity]} min={0} max={5} step={1} onValueChange={(v) => setSeverity(v[0])} />
            <p className="mt-1 text-xs text-muted-foreground">
              0 = calmado · 5 = en crisis
            </p>
          </div>
          <div>
            <Label>Banderas de riesgo</Label>
            <div className="mt-2 mb-2 flex flex-wrap gap-1.5">
              {riskFlags.length === 0
                ? <span className="text-xs text-muted-foreground">Sin banderas.</span>
                : riskFlags.map((f, i) => (
                    <Badge key={`${f}-${i}`} variant="outline" className="gap-1.5">
                      <AlertTriangle className="h-3 w-3" /> {f}
                      <button
                        onClick={() => setRiskFlags(riskFlags.filter((_, j) => j !== i))}
                        className="hover:text-destructive"
                        aria-label="Quitar"
                      >×</button>
                    </Badge>
                  ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={draftFlag}
                onChange={(e) => setDraftFlag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFlag() } }}
                placeholder="ej. insomnio"
              />
              <Button type="button" variant="outline" onClick={addFlag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-1 h-4 w-4" /> {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}
