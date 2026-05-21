'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Save, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { LoadingState } from '@/components/ui-states'
import { useAuth } from '@/lib/auth-context'
import { getProfile, updateProfile } from '@/lib/backend-api'

type ChipsProps = {
  items: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}
function ChipsField({ items, onChange, placeholder }: ChipsProps) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (!v || items.includes(v)) return
    onChange([...items, v])
    setDraft('')
  }
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {items.length === 0
          ? <span className="text-xs text-muted-foreground">Vacío.</span>
          : items.map((it, i) => (
              <Badge key={`${it}-${i}`} variant="secondary" className="gap-1.5">
                {it}
                <button
                  onClick={() => onChange(items.filter((_, j) => j !== i))}
                  className="hover:text-destructive"
                  aria-label="Quitar"
                >×</button>
              </Badge>
            ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder ?? 'Escribe y presiona Enter'}
        />
        <Button type="button" variant="outline" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  )
}

type ItemNameDesc = { name: string; description: string }

const STEPS = [
  { id: 'identity', title: 'Identidad', desc: 'Nombre, edad, ocupación' },
  { id: 'psych', title: 'Perfil psicológico', desc: 'Personalidad y estilo' },
  { id: 'behavior', title: 'Comportamiento', desc: 'Disparadores y reguladores' },
  { id: 'review', title: 'Revisar y guardar', desc: 'Confirmación final' },
]

export default function EditarPerfilPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id as string
  const { userRole, isLoading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  // Identidad
  const [name, setName] = useState('')
  const [identityName, setIdentityName] = useState('')
  const [age, setAge] = useState<number>(25)
  const [occupation, setOccupation] = useState('')
  const [description, setDescription] = useState('')
  // Psicológico
  const [personality, setPersonality] = useState<string[]>([])
  const [communicationStyle, setCommunicationStyle] = useState<string[]>([])
  // Comportamiento
  const [behaviorMax, setBehaviorMax] = useState(4)
  const [triggers, setTriggers] = useState<ItemNameDesc[]>([])
  const [regulators, setRegulators] = useState<ItemNameDesc[]>([])

  const next = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  const back = () => setStepIndex((i) => Math.max(i - 1, 0))

  const canNext = (() => {
    const id = STEPS[stepIndex].id
    if (id === 'identity') return !!name.trim() && !!age
    return true
  })()

  useEffect(() => {
    if (!authLoading && userRole === 'student') {
      router.push('/sesiones')
      return
    }
    if (!id) return
    void (async () => {
      try {
        const p = await getProfile(id)
        const t = (p.traits ?? {}) as any
        const b = (p.behavior ?? {}) as any
        setName(p.name ?? '')
        setIdentityName(t.identity_name ?? p.name ?? '')
        setAge(Number(t.age ?? 25))
        setOccupation(t.occupation ?? '')
        setDescription(p.description ?? '')
        setPersonality(Array.isArray(t.personality) ? t.personality : [])
        setCommunicationStyle(Array.isArray(t.communication_style) ? t.communication_style : [])
        setBehaviorMax(Number(b.behavior_max ?? 4))
        setTriggers(Array.isArray(b.triggers) ? b.triggers : [])
        setRegulators(Array.isArray(b.regulators) ? b.regulators : [])
      } catch (err) {
        toast.error('No se pudo cargar el perfil: ' + String(err))
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile(id, {
        name,
        description,
        traits: {
          identity_name: identityName || name,
          age,
          occupation,
          personality,
          communication_style: communicationStyle,
        },
        behavior: {
          behavior_min: 0,
          behavior_max: behaviorMax,
          triggers,
          regulators,
        },
      })
      toast.success('Cambios guardados.')
      router.push('/perfiles')
    } catch (err) {
      toast.error('No se pudo guardar: ' + String(err))
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

  return (
    <div className="container mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <Link href="/perfiles" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Volver a perfiles
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Editar perfil</h1>
        <p className="text-sm text-muted-foreground">
          Ajusta identidad, perfil psicológico y comportamiento conversacional.
        </p>
      </div>

      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex min-w-[420px] items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center">
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                  i < stepIndex ? 'bg-primary text-primary-foreground' :
                  i === stepIndex ? 'bg-primary/10 text-primary border border-primary' :
                  'border bg-background text-muted-foreground'
                )}
              >
                {i < stepIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('mx-2 h-px flex-1', i < stepIndex ? 'bg-primary' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="mb-4 text-sm font-medium">
        Paso {stepIndex + 1} de {STEPS.length} · {STEPS[stepIndex].title}
      </p>

      {STEPS[stepIndex].id === 'identity' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Identidad</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input value={name} onChange={(e) => { setName(e.target.value); setIdentityName(e.target.value) }} />
            </div>
            <div className="space-y-2">
              <Label>Edad</Label>
              <Input type="number" min={5} max={99} value={age} onChange={(e) => setAge(Number(e.target.value || 0))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Ocupación</Label>
              <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Descripción</Label>
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )}

      {STEPS[stepIndex].id === 'psych' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Perfil psicológico</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Rasgos de personalidad</Label>
              <ChipsField items={personality} onChange={setPersonality} placeholder="ej. perfeccionista" />
            </div>
            <div className="space-y-2">
              <Label>Estilo de comunicación</Label>
              <ChipsField items={communicationStyle} onChange={setCommunicationStyle} placeholder="ej. responde breve" />
            </div>
          </CardContent>
        </Card>
      )}

      {STEPS[stepIndex].id === 'behavior' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comportamiento conversacional</CardTitle>
            <CardDescription>Rango de severidad permitido y reacciones del perfil.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Severidad máxima del paciente · {behaviorMax}</Label>
              <p className="mb-3 text-xs text-muted-foreground">
                El paciente siempre puede calmarse hasta 0. Este valor define hasta qué punto puede escalar.
              </p>
              <Slider value={[behaviorMax]} min={1} max={5} step={1} onValueChange={(v) => setBehaviorMax(v[0])} />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Disparadores</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setTriggers([...triggers, { name: '', description: '' }])}>
                  <Plus className="mr-1 h-3 w-3" /> Agregar
                </Button>
              </div>
              {triggers.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin disparadores definidos.</p>
              ) : triggers.map((t, i) => (
                <div key={i} className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto]">
                  <Input
                    placeholder="Nombre"
                    value={t.name}
                    onChange={(e) => {
                      const next = [...triggers]; next[i] = { ...next[i], name: e.target.value }; setTriggers(next)
                    }}
                  />
                  <Input
                    placeholder="Descripción"
                    value={t.description}
                    onChange={(e) => {
                      const next = [...triggers]; next[i] = { ...next[i], description: e.target.value }; setTriggers(next)
                    }}
                  />
                  <Button variant="ghost" size="icon" onClick={() => setTriggers(triggers.filter((_, j) => j !== i))} className="self-start sm:self-auto">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Reguladores</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setRegulators([...regulators, { name: '', description: '' }])}>
                  <Plus className="mr-1 h-3 w-3" /> Agregar
                </Button>
              </div>
              {regulators.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin reguladores definidos.</p>
              ) : regulators.map((r, i) => (
                <div key={i} className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto]">
                  <Input
                    placeholder="Nombre"
                    value={r.name}
                    onChange={(e) => {
                      const next = [...regulators]; next[i] = { ...next[i], name: e.target.value }; setRegulators(next)
                    }}
                  />
                  <Input
                    placeholder="Descripción"
                    value={r.description}
                    onChange={(e) => {
                      const next = [...regulators]; next[i] = { ...next[i], description: e.target.value }; setRegulators(next)
                    }}
                  />
                  <Button variant="ghost" size="icon" onClick={() => setRegulators(regulators.filter((_, j) => j !== i))} className="self-start sm:self-auto">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {STEPS[stepIndex].id === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revisar y guardar</CardTitle>
            <CardDescription>Confirma los datos antes de guardar los cambios.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                  {name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '·'}
                </div>
                <div>
                  <p className="font-medium">{name || 'Sin nombre'}</p>
                  <p className="text-xs text-muted-foreground">
                    {age ? `${age} años` : 'Edad sin definir'} · {occupation || 'Ocupación sin definir'}
                  </p>
                </div>
              </div>
              {description && (
                <p className="mb-3 text-sm">{description}</p>
              )}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {personality.map((p) => (
                  <Badge key={p} variant="outline">{p}</Badge>
                ))}
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {communicationStyle.map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
              <p className="text-xs">
                Máximo permitido: <strong>{behaviorMax}</strong> · Disparadores {triggers.length} · Reguladores {regulators.length}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" onClick={back} disabled={stepIndex === 0 || saving} className="sm:w-auto">
          <ArrowLeft className="mr-1 h-4 w-4" /> Atrás
        </Button>
        {STEPS[stepIndex].id !== 'review' ? (
          <Button onClick={next} disabled={!canNext || saving} className="sm:w-auto">
            Siguiente <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={saving} className="sm:w-auto">
            <Save className="mr-1 h-4 w-4" /> {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        )}
      </div>
    </div>
  )
}
