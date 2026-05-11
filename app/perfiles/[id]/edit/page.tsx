'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
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

export default function EditarPerfilPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
  const [behaviorMin, setBehaviorMin] = useState(1)
  const [behaviorMax, setBehaviorMax] = useState(4)
  const [triggers, setTriggers] = useState<ItemNameDesc[]>([])
  const [regulators, setRegulators] = useState<ItemNameDesc[]>([])

  useEffect(() => {
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
        setBehaviorMin(Number(b.behavior_min ?? 1))
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
          behavior_min: behaviorMin,
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card><CardContent className="p-6 text-center text-muted-foreground">Cargando…</CardContent></Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <Link href="/perfiles" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Volver a perfiles
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Editar paciente</h1>
        <p className="text-sm text-muted-foreground">
          Ajusta identidad, perfil psicológico y comportamiento conversacional.
        </p>
      </div>

      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">Identidad</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Nombre completo</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); setIdentityName(e.target.value) }} />
          </div>
          <div>
            <Label>Edad</Label>
            <Input type="number" min={5} max={99} value={age} onChange={(e) => setAge(Number(e.target.value || 0))} />
          </div>
          <div className="sm:col-span-2">
            <Label>Ocupación</Label>
            <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Descripción</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">Perfil psicológico</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Rasgos de personalidad</Label>
            <ChipsField items={personality} onChange={setPersonality} placeholder="ej. perfeccionista" />
          </div>
          <div>
            <Label>Estilo de comunicación</Label>
            <ChipsField items={communicationStyle} onChange={setCommunicationStyle} placeholder="ej. responde breve" />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Comportamiento conversacional</CardTitle>
          <CardDescription>Rango de severidad permitido y reacciones del paciente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Mínimo · {behaviorMin}</Label>
              <Slider value={[behaviorMin]} min={0} max={5} step={1} onValueChange={(v) => setBehaviorMin(v[0])} />
            </div>
            <div>
              <Label>Máximo · {behaviorMax}</Label>
              <Slider value={[behaviorMax]} min={0} max={5} step={1} onValueChange={(v) => setBehaviorMax(v[0])} />
            </div>
          </div>

          <Separator />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Disparadores</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setTriggers([...triggers, { name: '', description: '' }])}>
                <Plus className="mr-1 h-3 w-3" /> Agregar
              </Button>
            </div>
            {triggers.map((t, i) => (
              <div key={i} className="mb-2 grid grid-cols-[1fr_2fr_auto] gap-2">
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
                <Button variant="ghost" size="icon" onClick={() => setTriggers(triggers.filter((_, j) => j !== i))}>
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
            {regulators.map((r, i) => (
              <div key={i} className="mb-2 grid grid-cols-[1fr_2fr_auto] gap-2">
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
                <Button variant="ghost" size="icon" onClick={() => setRegulators(regulators.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-1 h-4 w-4" /> {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}
