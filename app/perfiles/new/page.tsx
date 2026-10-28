'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Check, Plus, Search, Trash2, Loader2,
  GraduationCap, HeartCrack, AlertTriangle, Users, Briefcase, MapPin, PencilLine, Copy,
  User as UserIcon, UserCheck, UsersRound,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FutureFeatureBadge } from '@/components/future-feature-badge'
import { Slider } from '@/components/ui/slider'
import { formatSeverityNumber, SeverityGauge } from '@/components/severity-gauge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  createProfile, createScenario, getProfile, listScenarios, startSession, listStudents,
  type BackendProfile, type BackendScenario, type BackendUserProfile,
} from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import {
  PROFILE_TEMPLATES,
  BLANK_TEMPLATE,
  type ProfileTemplate,
} from '@/lib/profile-templates'

const ALL_STEPS = [
  { id: 'template',  title: 'Plantilla',          desc: 'Elige un punto de partida' },
  { id: 'identity',  title: 'Identidad',          desc: 'Nombre, edad, ocupación' },
  { id: 'psych',     title: 'Perfil psicológico', desc: 'Personalidad y estilo' },
  { id: 'scenario',  title: 'Escenario',          desc: 'Caso y banderas (opcional)' },
  { id: 'assign',    title: 'Asignación',         desc: 'Quién practica esta sesión' },
  { id: 'behavior',  title: 'Comportamiento',     desc: 'Disparadores y reguladores' },
  { id: 'review',    title: 'Revisar y crear',    desc: 'Confirmación final' },
]

const ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap, HeartCrack, AlertTriangle, Users, Briefcase, MapPin, PencilPlus: PencilLine,
}

type AssignMode = 'self' | 'students'
type SelfSessionMode = 'now' | 'later'

type CloneState = {
  sourceId: string
  sourceName: string
}

type ScenarioValues = ProfileTemplate['scenario']

// Escenario existente elegido en el formulario, con los valores originales
// para saber si el docente los modificó antes de guardar.
type ExistingScenario = {
  id: string
  original: ScenarioValues
}

type ScenarioOutcome = 'created' | 'reused' | 'copied'

const SCENARIO_NOTE: Record<ScenarioOutcome, string> = {
  created: 'Se creó un escenario nuevo.',
  reused: 'Se usó el escenario existente sin cambios.',
  copied: 'Se creó un escenario nuevo con tus cambios y el original no cambió.',
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return [value.trim()]
  }
  return []
}

function asBehaviorItems(value: unknown): { name: string; description: string }[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    const name = typeof record.name === 'string' ? record.name.trim() : ''
    const description = typeof record.description === 'string' ? record.description.trim() : ''
    if (!name && !description) return []
    return [{ name, description }]
  })
}

function scenarioToFormValues(item: BackendScenario): ScenarioValues {
  return {
    name: item.name,
    description: typeof item.constraints?.description === 'string' ? item.constraints.description : '',
    context: item.context ?? '',
    severity: Math.max(1, Math.min(5, Math.round(item.severity ?? 3))),
    riskFlags: asStringArray(item.risk_flags),
  }
}

// Compara contra los valores originales: nombre, contexto, descripción,
// severidad redondeada y banderas (sin importar el orden).
function scenarioWasModified(original: ScenarioValues, current: ScenarioValues): boolean {
  if (original.name !== current.name) return true
  if (original.context !== current.context) return true
  if (original.description !== current.description) return true
  if (Math.round(original.severity) !== Math.round(current.severity)) return true
  const a = [...original.riskFlags].sort()
  const b = [...current.riskFlags].sort()
  return a.length !== b.length || a.some((flag, i) => flag !== b[i])
}

function buildClonedTemplate(profile: BackendProfile): ProfileTemplate {
  const traits = (profile.traits ?? {}) as Record<string, unknown>
  const behavior = (profile.behavior ?? {}) as Record<string, unknown>

  return {
    ...BLANK_TEMPLATE,
    id: `clone-${profile.id}`,
    label: `Clon de ${profile.name}`,
    description: 'Formulario precargado desde un perfil existente.',
    icon: 'User',
    identity: {
      name: `${profile.name} (copia)`,
      identityName: typeof traits.identity_name === 'string' && traits.identity_name.trim()
        ? `${traits.identity_name.trim()} (copia)`
        : `${profile.name} (copia)`,
      age: typeof traits.age === 'number' ? traits.age : 0,
      occupation: typeof traits.occupation === 'string' ? traits.occupation : '',
      description: profile.description ?? '',
    },
    psych: {
      personality: asStringArray(traits.personality),
      communicationStyle: asStringArray(traits.communication_style),
    },
    // Clonar copia solo el perfil: el escenario se elige o se crea en su paso.
    scenario: {
      ...BLANK_TEMPLATE.scenario,
    },
    behavior: {
      behaviorMin: typeof behavior.behavior_min === 'number' ? behavior.behavior_min : 0,
      behaviorMax: typeof behavior.behavior_max === 'number'
        ? behavior.behavior_max
        : BLANK_TEMPLATE.behavior.behaviorMax,
      triggers: asBehaviorItems(behavior.triggers),
      regulators: asBehaviorItems(behavior.regulators),
    },
  }
}

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
    if (!v || items.includes(v)) return
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

export default function WizardPerfilPage() {
  const router = useRouter()
  const { user, userRole, isLoading: authLoading } = useAuth()
  const [stepIndex, setStepIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [draftRiskFlag, setDraftRiskFlag] = useState('')
  const [cloneLoading, setCloneLoading] = useState(false)
  const [cloneState, setCloneState] = useState<CloneState | null>(null)
  const [cloneFrom, setCloneFrom] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    setCloneFrom(params.get('cloneFrom')?.trim() ?? '')
  }, [])

  useEffect(() => {
    if (!authLoading && userRole === 'student') {
      router.push('/sesiones')
    }
  }, [authLoading, userRole, router])

  // Diálogos de escenario
  const [scenarioCreateOpen, setScenarioCreateOpen] = useState(false)
  const [scenarioSearchOpen, setScenarioSearchOpen] = useState(false)
  const [scenarioOptions, setScenarioOptions] = useState<BackendScenario[]>([])
  const [scenarioQuery, setScenarioQuery] = useState('')
  const [scenarioLoading, setScenarioLoading] = useState(false)
  const [existingScenario, setExistingScenario] = useState<ExistingScenario | null>(null)
  const selectedScenarioId = existingScenario?.id ?? null

  // Estado de asignación
  const [assignMode, setAssignMode] = useState<AssignMode>('self')
  const [selfSessionMode, setSelfSessionMode] = useState<SelfSessionMode>('now')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [students, setStudents] = useState<BackendUserProfile[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentQuery, setStudentQuery] = useState('')

  // Estado del formulario
  const [form, setForm] = useState<ProfileTemplate>(BLANK_TEMPLATE)

  const hasScenario = !!form.scenario.name.trim()
  const scenarioModified = existingScenario
    ? scenarioWasModified(existingScenario.original, form.scenario)
    : false

  // Navegación entre pasos

  const applyTemplate = (tpl: ProfileTemplate) => {
    setExistingScenario(null)
    setForm(tpl)
    setStepIndex(1)
  }

  const next = () => {
    if (ALL_STEPS[stepIndex].id === 'scenario' && !hasScenario) {
      // omitir paso 'assign'
      setStepIndex((i) => Math.min(i + 2, ALL_STEPS.length - 1))
    } else {
      setStepIndex((i) => Math.min(i + 1, ALL_STEPS.length - 1))
    }
  }

  const back = () => {
    if (ALL_STEPS[stepIndex].id === 'behavior' && !hasScenario) {
      // volver saltando 'assign'
      setStepIndex((i) => Math.max(i - 2, 0))
    } else {
      setStepIndex((i) => Math.max(i - 1, 0))
    }
  }

  const skipScenario = () => {
    resetScenario()
    setStepIndex((i) => Math.min(i + 2, ALL_STEPS.length - 1))
  }

  // Pasos efectivos (para el contador "Paso X de N")
  const effectiveSteps = ALL_STEPS.filter((s) => s.id !== 'assign' || hasScenario)
  const effectiveIndex = effectiveSteps.findIndex((s) => s.id === ALL_STEPS[stepIndex].id)

  // Helpers de estado

  const setIdentity = (patch: Partial<ProfileTemplate['identity']>) =>
    setForm((f) => ({ ...f, identity: { ...f.identity, ...patch } }))
  const setPsych = (patch: Partial<ProfileTemplate['psych']>) =>
    setForm((f) => ({ ...f, psych: { ...f.psych, ...patch } }))
  const setScenario = (patch: Partial<ProfileTemplate['scenario']>) =>
    setForm((f) => ({ ...f, scenario: { ...f.scenario, ...patch } }))
  const resetScenario = () => {
    setExistingScenario(null)
    setScenario({ name: '', description: '', context: '', severity: 3, riskFlags: [] })
    setDraftRiskFlag('')
  }
  const setBehavior = (patch: Partial<ProfileTemplate['behavior']>) =>
    setForm((f) => ({ ...f, behavior: { ...f.behavior, ...patch } }))

  useEffect(() => {
    if (!cloneFrom) {
      setCloneState(null)
      return
    }

    let active = true

    void (async () => {
      try {
        setCloneLoading(true)
        const profile = await getProfile(cloneFrom)
        if (!active) return

        setForm(buildClonedTemplate(profile))
        setExistingScenario(null)
        setCloneState({ sourceId: profile.id, sourceName: profile.name })
        setStepIndex(1)
      } catch (err) {
        if (!active) return
        setCloneState(null)
        toast.error('No se pudo cargar el perfil a clonar: ' + String(err))
      } finally {
        if (active) setCloneLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [cloneFrom])

  // Carga de escenarios existentes

  useEffect(() => {
    if (!scenarioSearchOpen || scenarioOptions.length > 0) return
    void (async () => {
      try {
        setScenarioLoading(true)
        setScenarioOptions(await listScenarios())
      } catch (err) {
        toast.error('No se pudieron cargar los escenarios: ' + String(err))
      } finally {
        setScenarioLoading(false)
      }
    })()
  }, [scenarioSearchOpen, scenarioOptions.length])

  const applyScenario = (item: BackendScenario) => {
    const values = scenarioToFormValues(item)
    setExistingScenario({ id: item.id, original: values })
    setScenario({ ...values })
    setScenarioSearchOpen(false)
  }

  // Carga de estudiantes

  useEffect(() => {
    if (ALL_STEPS[stepIndex].id !== 'assign' || assignMode !== 'students') return
    if (students.length > 0 || studentsLoading) return
    void (async () => {
      try {
        setStudentsLoading(true)
        setStudents(await listStudents())
      } catch (err) {
        toast.error('No se pudieron cargar los estudiantes: ' + String(err))
      } finally {
        setStudentsLoading(false)
      }
    })()
  }, [stepIndex, assignMode, students.length, studentsLoading])

  useEffect(() => {
    if (assignMode === 'self') {
      setSelfSessionMode('now')
    }
  }, [assignMode])

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const filteredStudents = students.filter((s) => {
    if (!studentQuery.trim()) return true
    const q = studentQuery.toLowerCase()
    return (
      s.full_name?.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    )
  })

  // Validación por paso

  const canNext = (() => {
    const id = ALL_STEPS[stepIndex].id
    if (id === 'identity') return !!form.identity.name.trim() && !!form.identity.age
    if (id === 'scenario') return !!form.scenario.name.trim() && !!form.scenario.description.trim() && !!form.scenario.context.trim()
    if (id === 'assign') {
      if (assignMode === 'students') return selectedStudentIds.length > 0
      return true
    }
    return true
  })()

  // Submit

  const handleSubmit = async () => {
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
          behavior_min: 0,
          behavior_max: form.behavior.behaviorMax,
          triggers: form.behavior.triggers,
          regulators: form.behavior.regulators,
        },
      })

      if (!hasScenario) {
        toast.success('Perfil creado.')
        router.push('/perfiles')
        return
      }

      // Este formulario nunca modifica un escenario existente: si no cambió se
      // reutiliza tal cual, y si cambió se crea uno nuevo con los valores del formulario.
      let scenarioId: string
      let outcome: ScenarioOutcome
      if (existingScenario && !scenarioModified) {
        scenarioId = existingScenario.id
        outcome = 'reused'
      } else {
        const sameNameAsOriginal = !!existingScenario && form.scenario.name === existingScenario.original.name
        const created = await createScenario({
          name: sameNameAsOriginal ? `${form.scenario.name} (copia)` : form.scenario.name,
          context: form.scenario.context,
          severity: Math.round(form.scenario.severity),
          risk_flags: form.scenario.riskFlags,
          constraints: { description: form.scenario.description },
        })
        scenarioId = created.id
        outcome = existingScenario ? 'copied' : 'created'
      }
      const scenarioNote = SCENARIO_NOTE[outcome]

      if (assignMode === 'self') {
        const session = await startSession({ profile_id: profile.id, scenario_id: scenarioId })
        toast.success(`Perfil y sesión creados. ${scenarioNote}`)
        if (selfSessionMode === 'now') {
          router.push(`/chat?sesion=${session.id}`)
        } else {
          router.push('/sesiones')
        }
      } else {
        await Promise.all(
          selectedStudentIds.map((studentId) =>
            startSession({ profile_id: profile.id, scenario_id: scenarioId, user_id: studentId })
          )
        )
        toast.success(`Sesiones asignadas a ${selectedStudentIds.length} estudiante(s). ${scenarioNote}`)
        router.push('/perfiles')
      }
    } catch (err) {
      toast.error('No se pudo crear: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSubmitting(false)
    }
  }

  const stepId = ALL_STEPS[stepIndex].id

  if (authLoading || userRole === 'student') return null
  if (cloneLoading) {
    return (
      <div className="container mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <Link
          href="/perfiles"
          className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver a perfiles
        </Link>

        <Card>
          <CardContent className="flex min-h-[240px] items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando datos del perfil clonado...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
        <h1 className="text-2xl font-semibold">{cloneState ? 'Clonar perfil' : 'Nuevo perfil'}</h1>
        <p className="text-sm text-muted-foreground">
          {cloneState
            ? 'Este formulario fue precargado desde un perfil existente. Revisa cada campo antes de crear la nueva versión.'
            : 'Crea un caso clínico simulado. Puedes empezar desde una plantilla o construirlo desde cero.'}
        </p>
      </div>

      {cloneState && (
        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-background p-2 text-primary shadow-sm">
              <Copy className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Perfil clonado desde {cloneState.sourceName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Úsalo como base. Si todo está correcto puedes crearlo tal cual; si algo debe cambiar,
                ajusta los campos antes de finalizar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* wizard y demás componentes aquí... */}
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex min-w-[520px] items-center gap-2">
          {effectiveSteps.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center">
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                  i < effectiveIndex ? 'bg-primary text-primary-foreground' :
                  i === effectiveIndex ? 'bg-primary/10 text-primary border border-primary' :
                  'border bg-background text-muted-foreground'
                )}
              >
                {i < effectiveIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {i < effectiveSteps.length - 1 && (
                <div className={cn('mx-2 h-px flex-1', i < effectiveIndex ? 'bg-primary' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="mb-4 text-sm font-medium">
        Paso {effectiveIndex + 1} de {effectiveSteps.length} · {ALL_STEPS[stepIndex].title}
      </p>

      {/* ── PLANTILLA ──────────────────────────────────────────────────────────── */}
      {stepId === 'template' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {cloneState ? 'Base actual del clon' : 'Empieza desde una plantilla'}
            </CardTitle>
            <CardDescription>
              {cloneState
                ? 'Este clon ya viene precargado. Si prefieres, puedes cambiar la base por una plantilla distinta o empezar desde cero.'
                : 'Te ahorra tiempo. Cualquier campo puede ajustarse después.'}
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
                    onClick={() => applyTemplate(tpl)}
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
                onClick={() => applyTemplate(BLANK_TEMPLATE)}
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

      {/* ── IDENTIDAD ──────────────────────────────────────────────────────────── */}
      {stepId === 'identity' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identidad del perfil</CardTitle>
            <CardDescription>Los datos básicos que el NPC sabrá sobre sí mismo.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo *</Label>
              <Input
                id="name"
                value={form.identity.name}
                onChange={(e) => setIdentity({ name: e.target.value, identityName: e.target.value })}
                placeholder="ej. Valentina Rojas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Edad *</Label>
              <Input
                id="age" type="number" min={5} max={99}
                value={form.identity.age}
                onChange={(e) => setIdentity({ age: Number(e.target.value || 0) })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="occupation">Ocupación</Label>
              <Input
                id="occupation"
                value={form.identity.occupation}
                onChange={(e) => setIdentity({ occupation: e.target.value })}
                placeholder="ej. Estudiante universitaria"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
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

      {/* ── PERFIL PSICOLÓGICO ──────────────────────────────────────────────────── */}
      {stepId === 'psych' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perfil psicológico</CardTitle>
            <CardDescription>Rasgos y forma de comunicarse del NPC.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Rasgos de personalidad</Label>
              <p className="mb-2 text-xs text-muted-foreground">ej. reservada, sensible, perfeccionista</p>
              <ChipsField
                items={form.psych.personality}
                onChange={(v) => setPsych({ personality: v })}
                placeholder="Escribe un rasgo y presiona Enter"
              />
            </div>
            <div className="space-y-2">
              <Label>Estilo de comunicación</Label>
              <p className="mb-2 text-xs text-muted-foreground">ej. responde breve, evita el conflicto, se abre con empatía</p>
              <ChipsField
                items={form.psych.communicationStyle}
                onChange={(v) => setPsych({ communicationStyle: v })}
                placeholder="Escribe un rasgo del estilo y presiona Enter"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── ESCENARIO ──────────────────────────────────────────────────────────── */}
      {stepId === 'scenario' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Escenario</CardTitle>
            <CardDescription>
              El caso concreto que el estudiante va a abordar. Puedes omitirlo si solo quieres crear el perfil por ahora.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label className="text-sm">Escenario seleccionado</Label>
                <p className="text-xs text-muted-foreground">Crea uno nuevo o elige uno existente.</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setScenarioSearchOpen(true)}>
                  Buscar existente
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button">Crear nuevo</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Crear un escenario desde cero</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esto reemplazará el escenario actual. Si continúas, se limpiarán los datos cargados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => { resetScenario(); setScenarioCreateOpen(true) }}>
                        Continuar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {form.scenario.name ? (
              <div className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{form.scenario.name}</p>
                      {selectedScenarioId && (
                        <Badge variant="secondary" className="text-[11px]">
                          Escenario existente
                        </Badge>
                      )}
                    </div>
                    {form.scenario.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{form.scenario.description}</p>
                    )}
                    {selectedScenarioId && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {scenarioModified
                          ? 'Modificaste un escenario existente: al guardar se creará un escenario nuevo con estos cambios y el original no cambia.'
                          : 'Se usará este escenario tal como está.'}
                      </p>
                    )}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setScenarioCreateOpen(true)}>
                    Editar
                  </Button>
                </div>
                <p className="mt-3 text-sm">{form.scenario.context}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Severidad inicial</span>
                  <SeverityGauge level={form.scenario.severity} size="sm" />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {form.scenario.riskFlags.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Sin banderas.</span>
                  ) : (
                    form.scenario.riskFlags.map((flag) => (
                      <Badge key={flag} variant="outline" className="gap-1.5">
                        <AlertTriangle className="h-3 w-3 text-amber-600" /> {flag}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Aún no seleccionas un escenario.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── ASIGNACIÓN ─────────────────────────────────────────────────────────── */}
      {stepId === 'assign' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Asignación de sesión</CardTitle>
            <CardDescription>¿Para quién es esta sesión de práctica?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setAssignMode('self')}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition',
                  assignMode === 'self'
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50 hover:bg-muted/40'
                )}
              >
                <UserCheck className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">Probar yo mismo</p>
                <p className="text-xs text-muted-foreground">
                  Crea la sesión para tu propio uso. Ideal para explorar el caso antes de asignarlo.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setAssignMode('students')}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition',
                  assignMode === 'students'
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50 hover:bg-muted/40'
                )}
              >
                <UsersRound className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">Asignar a estudiantes</p>
                <p className="text-xs text-muted-foreground">
                  Selecciona uno o varios estudiantes. Se creará una sesión individual para cada uno.
                </p>
              </button>
            </div>

            {assignMode === 'self' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSelfSessionMode('now')}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 text-left transition',
                    selfSessionMode === 'now'
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50 hover:bg-muted/40'
                  )}
                >
                  <UserCheck className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Probar ahora</p>
                    <p className="text-xs text-muted-foreground">Abrir chat inmediatamente.</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelfSessionMode('later')}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 text-left transition',
                    selfSessionMode === 'later'
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50 hover:bg-muted/40'
                  )}
                >
                  <UsersRound className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Guardar para después</p>
                    <p className="text-xs text-muted-foreground">La sesión quedará en tu listado.</p>
                  </div>
                </button>
              </div>
            )}

            {assignMode === 'students' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o correo..."
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-64 overflow-auto rounded-lg border">
                  {studentsLoading ? (
                    <div className="flex items-center justify-center gap-2 p-4 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Cargando estudiantes...</span>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">No se encontraron estudiantes.</p>
                  ) : (
                    filteredStudents.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleStudent(s.id)}
                        className={cn(
                          'flex w-full items-center gap-3 border-b px-3 py-2.5 text-left last:border-b-0 transition',
                          selectedStudentIds.includes(s.id)
                            ? 'bg-primary/5'
                            : 'hover:bg-muted/40'
                        )}
                      >
                        <div className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                          selectedStudentIds.includes(s.id)
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-input'
                        )}>
                          {selectedStudentIds.includes(s.id) && <Check className="h-3 w-3" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{s.full_name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {selectedStudentIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedStudentIds.length} estudiante(s) seleccionado(s)
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── COMPORTAMIENTO ─────────────────────────────────────────────────────── */}
      {stepId === 'behavior' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comportamiento conversacional</CardTitle>
            <CardDescription>Cómo reacciona el NPC durante la conversación.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Severidad máxima del NPC · {formatSeverityNumber(form.behavior.behaviorMax)} / 5</Label>
              <p className="mb-3 text-xs text-muted-foreground">
                El NPC siempre puede calmarse hasta 0. Este valor define hasta qué punto puede escalar.
              </p>
              <div className="max-w-sm">
                <Slider
                  value={[form.behavior.behaviorMax]}
                  min={1} max={5} step={0.1}
                  onValueChange={(v) => setBehavior({ behaviorMax: v[0] })}
                />
                <div className="pt-1">
                  <SeverityGauge level={form.behavior.behaviorMax} size="sm" showLabel />
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="flex items-center gap-2">Disparadores <FutureFeatureBadge /></Label>
                <Button type="button" variant="outline" size="sm" onClick={() =>
                  setBehavior({ triggers: [...form.behavior.triggers, { name: '', description: '' }] })
                }>
                  <Plus className="mr-1 h-3 w-3" /> Agregar
                </Button>
              </div>
              {form.behavior.triggers.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin disparadores definidos.</p>
              ) : form.behavior.triggers.map((t, i) => (
                <div key={i} className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto]">
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
                  <Button variant="ghost" size="icon" onClick={() =>
                    setBehavior({ triggers: form.behavior.triggers.filter((_, j) => j !== i) })
                  } className="self-start sm:self-auto">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="flex items-center gap-2">Reguladores <FutureFeatureBadge /></Label>
                <Button type="button" variant="outline" size="sm" onClick={() =>
                  setBehavior({ regulators: [...form.behavior.regulators, { name: '', description: '' }] })
                }>
                  <Plus className="mr-1 h-3 w-3" /> Agregar
                </Button>
              </div>
              {form.behavior.regulators.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin reguladores definidos.</p>
              ) : form.behavior.regulators.map((r, i) => (
                <div key={i} className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto]">
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
                  <Button variant="ghost" size="icon" onClick={() =>
                    setBehavior({ regulators: form.behavior.regulators.filter((_, j) => j !== i) })
                  } className="self-start sm:self-auto">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── REVISAR Y CREAR ────────────────────────────────────────────────────── */}
      {stepId === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revisar y crear</CardTitle>
            <CardDescription>
              Así quedará el perfil. Puedes volver atrás a ajustar antes de crear.
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
              <div className="mb-3 flex flex-wrap gap-1.5">
                {form.psych.communicationStyle.map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            </div>

            {hasScenario ? (
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm font-medium">Escenario</p>
                <p className="text-sm">{form.scenario.name}</p>
                {form.scenario.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{form.scenario.description}</p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">{form.scenario.context}</p>
                <p className="mt-2 text-xs">
                  Severidad inicial: <strong>{formatSeverityNumber(form.scenario.severity)} / 5</strong> · Máximo permitido {formatSeverityNumber(form.behavior.behaviorMax)}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.scenario.riskFlags.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Sin banderas.</span>
                  ) : form.scenario.riskFlags.map((r) => (
                    <Badge key={r} variant="destructive">{r}</Badge>
                  ))}
                </div>
                <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                  {assignMode === 'self'
                    ? (selfSessionMode === 'now'
                        ? 'Sesión asignada a ti mismo para probar ahora.'
                        : 'Sesión asignada a ti mismo para después.')
                    : `Sesiones para ${selectedStudentIds.length} estudiante(s).`}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-card p-4 text-sm text-muted-foreground">
                Sin escenario: solo se creará el perfil, sin sesión.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs de escenario */}
      <Dialog open={scenarioCreateOpen} onOpenChange={setScenarioCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear escenario</DialogTitle>
            <DialogDescription>Completa los datos del escenario para este perfil.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sname">Nombre del caso *</Label>
              <Input
                id="sname"
                value={form.scenario.name}
                onChange={(e) => setScenario({ name: e.target.value })}
                placeholder="ej. Sobrecarga académica en universidad"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sdesc">Descripción *</Label>
              <Textarea
                id="sdesc" rows={3}
                value={form.scenario.description}
                onChange={(e) => setScenario({ description: e.target.value })}
                placeholder="Describe brevemente el objetivo del escenario."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sctx">Contexto narrativo *</Label>
              <Textarea
                id="sctx" rows={3}
                value={form.scenario.context}
                onChange={(e) => setScenario({ context: e.target.value })}
                placeholder="¿Qué está viviendo el NPC al iniciar la sesión?"
              />
            </div>
            <div className="space-y-2">
              <Label>Severidad inicial · {formatSeverityNumber(form.scenario.severity)} / 5</Label>
              <Slider
                value={[form.scenario.severity]}
                min={1} max={5} step={1}
                onValueChange={(v) => setScenario({ severity: v[0] })}
              />
              <div className="pt-1">
                <SeverityGauge level={form.scenario.severity} size="md" showLabel />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Banderas de riesgo</Label>
                <span className="text-xs text-muted-foreground">{form.scenario.riskFlags.length} activas</span>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex flex-wrap gap-2">
                  {form.scenario.riskFlags.length === 0
                    ? <span className="text-xs text-muted-foreground">Sin banderas.</span>
                    : form.scenario.riskFlags.map((flag, index) => (
                      <span key={`${flag}-${index}`} className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs">
                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                        {flag}
                        <button
                          type="button"
                          onClick={() => setScenario({ riskFlags: form.scenario.riskFlags.filter((_, i) => i !== index) })}
                          className="hover:text-destructive"
                          aria-label="Quitar"
                        >×</button>
                      </span>
                    ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Input
                    value={draftRiskFlag}
                    onChange={(e) => setDraftRiskFlag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const v = draftRiskFlag.trim()
                        if (!v || form.scenario.riskFlags.includes(v)) return
                        setScenario({ riskFlags: [...form.scenario.riskFlags, v] })
                        setDraftRiskFlag('')
                      }
                    }}
                    placeholder="ej. insomnio"
                    className="h-10"
                  />
                  <Button
                    type="button" variant="outline" className="h-10 w-10 p-0"
                    onClick={() => {
                      const v = draftRiskFlag.trim()
                      if (!v || form.scenario.riskFlags.includes(v)) return
                      setScenario({ riskFlags: [...form.scenario.riskFlags, v] })
                      setDraftRiskFlag('')
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setScenarioCreateOpen(false)}>Listo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scenarioSearchOpen} onOpenChange={setScenarioSearchOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buscar escenario</DialogTitle>
            <DialogDescription>Selecciona un escenario existente para este perfil.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o contexto..."
                value={scenarioQuery}
                onChange={(e) => setScenarioQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-[360px] space-y-2 overflow-auto rounded-lg border p-2">
              {scenarioLoading ? (
                <div className="flex items-center justify-center gap-2 p-4 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Cargando escenarios...</span>
                </div>
              ) : (
                scenarioOptions
                  .filter((item) => {
                    if (!scenarioQuery.trim()) return true
                    const q = scenarioQuery.toLowerCase()
                    return item.name.toLowerCase().includes(q) || item.context.toLowerCase().includes(q)
                  })
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => applyScenario(item)}
                      className="w-full rounded-md border px-3 py-2 text-left transition hover:border-primary hover:bg-primary/5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{item.context}</p>
                        </div>
                        <SeverityGauge level={Math.max(1, Math.min(5, item.severity))} size="sm" />
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setScenarioSearchOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Navegación */}
      <div className="mt-6 flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" onClick={back} disabled={stepIndex === 0 || submitting} className="sm:w-auto">
          <ArrowLeft className="mr-1 h-4 w-4" /> Atrás
        </Button>

        {stepId === 'scenario' && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="ghost" onClick={skipScenario} disabled={submitting} className="sm:w-auto">
              Omitir por ahora
            </Button>
            <Button onClick={next} disabled={!canNext || submitting} className="sm:w-auto">
              Siguiente <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}

        {stepId !== 'scenario' && stepId !== 'review' && (
          <Button onClick={next} disabled={!canNext || submitting} className="sm:w-auto">
            Siguiente <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}

        {stepId === 'review' && (
          <Button onClick={handleSubmit} disabled={submitting} className="sm:w-auto">
            {submitting
              ? 'Creando...'
              : !hasScenario
                ? 'Crear perfil'
                : assignMode === 'self'
                  ? (selfSessionMode === 'now'
                      ? 'Crear y empezar a practicar'
                      : 'Crear y guardar para después')
                  : `Crear y asignar a ${selectedStudentIds.length} estudiante(s)`}
          </Button>
        )}
      </div>
    </div>
  )
}
