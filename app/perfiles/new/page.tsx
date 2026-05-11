'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Check, Plus, Trash2,
  GraduationCap, HeartCrack, AlertTriangle, Users, Briefcase, MapPin, PencilLine,
  User as UserIcon,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createProfile, createScenario, startSession } from '@/lib/backend-api'
import {
  PROFILE_TEMPLATES,
  BLANK_TEMPLATE,
  type ProfileTemplate,
} from '@/lib/profile-templates'

const STEPS = [
  { id: 'template',  title: 'Plantilla',         desc: 'Elige un punto de partida' },
  { id: 'identity',  title: 'Identidad',         desc: 'Nombre, edad, ocupación' },
  { id: 'psych',     title: 'Perfil psicológico', desc: 'Personalidad y estilo' },
  { id: 'scenario',  title: 'Motivo de consulta', desc: 'Caso y banderas' },
  { id: 'behavior',  title: 'Comportamiento',    desc: 'Disparadores y reguladores' },
  { id: 'review',    title: 'Revisar y crear',   desc: 'Confirmación final' },
]

const ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap, HeartCrack, AlertTriangle, Users, Briefcase, MapPin, PencilPlus: PencilLine,
}

type ChipInput = { value: string; onAdd: (v: string) => void; placeholder?: string }

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <Badge variant="secondary" className="gap-1.5">
      {children}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-destructive" aria-label="Quitar">
          ×
        </button>
      )}
    </Badge>
  )
}

function ChipsField({ items, onChange, placeholder }: {
  items: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (!v) return
    if (items.includes(v)) return
    onChange([...items, v])
    setDraft('')
  }
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {items.length === 0 ? (
          <span className="text-xs text-muted-foreground">Aún no has agregado nada.</span>
        ) : items.map((it, i) => (
          <Chip key={`${it}-${i}`} onRemove={() => onChange(items.filter((_, j) => j !== i))}>
            {it}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder ?? 'Escribe y presiona Enter'}
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function WizardPacientePage() {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Estado completo del wizard, hidratado por la plantilla seleccionada
  const [form, setForm] = useState<ProfileTemplate>(BLANK_TEMPLATE)

  const useTemplate = (tpl: ProfileTemplate) => {
    setForm(tpl)
    setStepIndex(1)
  }

  const next = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  const back = () => setStepIndex((i) => Math.max(i - 1, 0))

  const setIdentity = (patch: Partial<ProfileTemplate['identity']>) =>
    setForm((f) => ({ ...f, identity: { ...f.identity, ...patch } }))
  const setPsych = (patch: Partial<ProfileTemplate['psych']>) =>
    setForm((f) => ({ ...f, psych: { ...f.psych, ...patch } }))
  const setScenario = (patch: Partial<ProfileTemplate['scenario']>) =>
    setForm((f) => ({ ...f, scenario: { ...f.scenario, ...patch } }))
  const setBehavior = (patch: Partial<ProfileTemplate['behavior']>) =>
    setForm((f) => ({ ...f, behavior: { ...f.behavior, ...patch } }))

  const canNext = (() => {
    const id = STEPS[stepIndex].id
    if (id === 'identity')  return !!form.identity.name.trim() && !!form.identity.age
    if (id === 'scenario')  return !!form.scenario.name.trim() && !!form.scenario.context.trim()
    return true
  })()

  const handleSubmit = async (alsoStart: boolean) => {
    setSubmitting(true)
    try {
      const profile = await createProfile({
        name: form.identity.name,
        description: form.identity.description,
        traits: {
          identity_name: form.identity.identityName || form.identity.name,
          age: form.identity.age,
          occupation: form.identity.occupation,
          personality: form.psych.personality,
          communication_style: form.psych.communicationStyle,
        },
        behavior: {
          behavior_min: form.behavior.behaviorMin,
          behavior_max: form.behavior.behaviorMax,
          triggers: form.behavior.triggers,
          regulators: form.behavior.regulators,
        },
      })
      const scenario = await createScenario({
        name: form.scenario.name,
        context: form.scenario.context,
        severity: form.scenario.severity,
        risk_flags: form.scenario.riskFlags,
        constraints: {},
      })
      toast.success('Paciente y escenario creados.')

      if (alsoStart) {
        const session = await startSession({ profile_id: profile.id, scenario_id: scenario.id })
        router.push(`/chat?sesion=${session.id}`)
      } else {
        router.push('/perfiles')
      }
    } catch (err) {
      toast.error('No se pudo crear: ' + String(err))
    } finally {
      setSubmitting(false)
    }
  }

  const stepId = STEPS[stepIndex].id

  return (
    <div className="container mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <Link
        href="/perfiles"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Volver a perfiles
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Nuevo paciente</h1>
        <p className="text-sm text-muted-foreground">
          Crea un caso clínico simulado. Puedes empezar desde una plantilla o construirlo desde cero.
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2">
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
      <p className="mb-4 text-sm font-medium">
        Paso {stepIndex + 1} de {STEPS.length} · {STEPS[stepIndex].title}
      </p>

      {/* CONTENIDO POR PASO */}
      {stepId === 'template' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Empieza desde una plantilla</CardTitle>
            <CardDescription>
              Te ahorra tiempo. Cualquier campo puede ajustarse después.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PROFILE_TEMPLATES.map((tpl) => {
                const Icon = ICON_MAP[tpl.icon] ?? UserIcon
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => useTemplate(tpl)}
                    className="rounded-lg border bg-background p-4 text-left transition hover:border-primary hover:bg-primary/5"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <p className="mt-2 text-sm font-semibold">{tpl.label}</p>
                    <p className="text-xs text-muted-foreground">{tpl.description}</p>
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => useTemplate(BLANK_TEMPLATE)}
                className="rounded-lg border border-dashed bg-background p-4 text-left text-muted-foreground transition hover:border-primary hover:text-foreground"
              >
                <PencilLine className="h-5 w-5" />
                <p className="mt-2 text-sm font-semibold">Empezar desde cero</p>
                <p className="text-xs">Sin plantilla, configurarlo todo a mano.</p>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {stepId === 'identity' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identidad del paciente</CardTitle>
            <CardDescription>Los datos básicos que el NPC sabrá sobre sí mismo.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Nombre completo *</Label>
              <Input
                id="name"
                value={form.identity.name}
                onChange={(e) => setIdentity({ name: e.target.value, identityName: e.target.value })}
                placeholder="ej. Valentina Rojas"
              />
            </div>
            <div>
              <Label htmlFor="age">Edad *</Label>
              <Input
                id="age" type="number" min={5} max={99}
                value={form.identity.age}
                onChange={(e) => setIdentity({ age: Number(e.target.value || 0) })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="occupation">Ocupación</Label>
              <Input
                id="occupation"
                value={form.identity.occupation}
                onChange={(e) => setIdentity({ occupation: e.target.value })}
                placeholder="ej. Estudiante universitaria"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="description">Descripción breve</Label>
              <Textarea
                id="description" rows={3}
                value={form.identity.description}
                onChange={(e) => setIdentity({ description: e.target.value })}
                placeholder="Cuéntale al sistema cómo es esta persona en una o dos frases."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {stepId === 'psych' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perfil psicológico</CardTitle>
            <CardDescription>Rasgos y forma de comunicarse del paciente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>Rasgos de personalidad</Label>
              <p className="mb-2 text-xs text-muted-foreground">
                ej. reservada, sensible, perfeccionista
              </p>
              <ChipsField
                items={form.psych.personality}
                onChange={(v) => setPsych({ personality: v })}
                placeholder="Escribe un rasgo y presiona Enter"
              />
            </div>
            <div>
              <Label>Estilo de comunicación</Label>
              <p className="mb-2 text-xs text-muted-foreground">
                ej. responde breve, evita el conflicto, se abre con empatía
              </p>
              <ChipsField
                items={form.psych.communicationStyle}
                onChange={(v) => setPsych({ communicationStyle: v })}
                placeholder="Escribe un rasgo del estilo y presiona Enter"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {stepId === 'scenario' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Motivo de consulta</CardTitle>
            <CardDescription>El caso concreto que el estudiante va a abordar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="sname">Nombre del caso *</Label>
              <Input
                id="sname"
                value={form.scenario.name}
                onChange={(e) => setScenario({ name: e.target.value })}
                placeholder="ej. Sobrecarga académica en universidad"
              />
            </div>
            <div>
              <Label htmlFor="sctx">Contexto narrativo *</Label>
              <Textarea
                id="sctx" rows={3}
                value={form.scenario.context}
                onChange={(e) => setScenario({ context: e.target.value })}
                placeholder="¿Qué está viviendo el paciente al iniciar la sesión?"
              />
            </div>
            <div>
              <Label>Severidad inicial · {form.scenario.severity} / 5</Label>
              <Slider
                value={[form.scenario.severity]}
                min={0} max={5} step={1}
                onValueChange={(v) => setScenario({ severity: v[0] })}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                0 = calmado · 5 = en crisis
              </p>
            </div>
            <div>
              <Label>Banderas de riesgo</Label>
              <p className="mb-2 text-xs text-muted-foreground">
                ej. insomnio, aislamiento, ideación pasiva
              </p>
              <ChipsField
                items={form.scenario.riskFlags}
                onChange={(v) => setScenario({ riskFlags: v })}
                placeholder="Escribe una bandera y presiona Enter"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {stepId === 'behavior' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comportamiento conversacional</CardTitle>
            <CardDescription>
              Cómo reacciona el paciente durante la conversación.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>Rango de severidad permitido</Label>
              <p className="mb-3 text-xs text-muted-foreground">
                Mínimo {form.behavior.behaviorMin} · Máximo {form.behavior.behaviorMax}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Mínimo</Label>
                  <Slider
                    value={[form.behavior.behaviorMin]}
                    min={0} max={5} step={1}
                    onValueChange={(v) => setBehavior({ behaviorMin: v[0] })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Máximo</Label>
                  <Slider
                    value={[form.behavior.behaviorMax]}
                    min={0} max={5} step={1}
                    onValueChange={(v) => setBehavior({ behaviorMax: v[0] })}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Disparadores</Label>
                <Button type="button" variant="outline" size="sm" onClick={() =>
                  setBehavior({ triggers: [...form.behavior.triggers, { name: '', description: '' }] })
                }>
                  <Plus className="mr-1 h-3 w-3" /> Agregar
                </Button>
              </div>
              {form.behavior.triggers.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin disparadores definidos.</p>
              ) : form.behavior.triggers.map((t, i) => (
                <div key={i} className="mb-2 grid grid-cols-[1fr_2fr_auto] gap-2">
                  <Input
                    placeholder="Nombre"
                    value={t.name}
                    onChange={(e) => {
                      const list = [...form.behavior.triggers]
                      list[i] = { ...list[i], name: e.target.value }
                      setBehavior({ triggers: list })
                    }}
                  />
                  <Input
                    placeholder="Descripción"
                    value={t.description}
                    onChange={(e) => {
                      const list = [...form.behavior.triggers]
                      list[i] = { ...list[i], description: e.target.value }
                      setBehavior({ triggers: list })
                    }}
                  />
                  <Button variant="ghost" size="icon" onClick={() => {
                    setBehavior({ triggers: form.behavior.triggers.filter((_, j) => j !== i) })
                  }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Reguladores</Label>
                <Button type="button" variant="outline" size="sm" onClick={() =>
                  setBehavior({ regulators: [...form.behavior.regulators, { name: '', description: '' }] })
                }>
                  <Plus className="mr-1 h-3 w-3" /> Agregar
                </Button>
              </div>
              {form.behavior.regulators.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin reguladores definidos.</p>
              ) : form.behavior.regulators.map((r, i) => (
                <div key={i} className="mb-2 grid grid-cols-[1fr_2fr_auto] gap-2">
                  <Input
                    placeholder="Nombre"
                    value={r.name}
                    onChange={(e) => {
                      const list = [...form.behavior.regulators]
                      list[i] = { ...list[i], name: e.target.value }
                      setBehavior({ regulators: list })
                    }}
                  />
                  <Input
                    placeholder="Descripción"
                    value={r.description}
                    onChange={(e) => {
                      const list = [...form.behavior.regulators]
                      list[i] = { ...list[i], description: e.target.value }
                      setBehavior({ regulators: list })
                    }}
                  />
                  <Button variant="ghost" size="icon" onClick={() => {
                    setBehavior({ regulators: form.behavior.regulators.filter((_, j) => j !== i) })
                  }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stepId === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revisar y crear</CardTitle>
            <CardDescription>
              Así se verá el paciente. Puedes volver atrás a ajustar antes de crear.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                  {form.identity.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '·'}
                </div>
                <div>
                  <p className="font-medium">{form.identity.name || 'Sin nombre'}</p>
                  <p className="text-xs text-muted-foreground">
                    {form.identity.age ? `${form.identity.age} años` : 'Edad sin definir'} · {form.identity.occupation || 'Ocupación sin definir'}
                  </p>
                </div>
              </div>
              {form.identity.description && (
                <p className="mb-3 text-sm">{form.identity.description}</p>
              )}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {form.psych.personality.map((p) => (
                  <Badge key={p} variant="outline">{p}</Badge>
                ))}
              </div>
              <p className="text-sm font-medium">Caso: {form.scenario.name || 'sin nombre'}</p>
              <p className="mb-2 text-sm text-muted-foreground">{form.scenario.context}</p>
              <p className="text-xs">
                Severidad inicial: <strong>{form.scenario.severity} / 5</strong> · Rango permitido {form.behavior.behaviorMin}–{form.behavior.behaviorMax}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.scenario.riskFlags.map((r) => (
                  <Badge key={r} variant="destructive">{r}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NAV */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={back} disabled={stepIndex === 0 || submitting}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Atrás
        </Button>
        {stepId !== 'review' ? (
          <Button onClick={next} disabled={!canNext || submitting}>
            Siguiente <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSubmit(false)} disabled={submitting}>
              Crear y volver al listado
            </Button>
            <Button onClick={() => handleSubmit(true)} disabled={submitting}>
              Crear y empezar a practicar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
