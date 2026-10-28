'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Copy, Pencil, Play } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { SeverityGauge } from '@/components/severity-gauge'
import { ErrorState, LoadingState } from '@/components/ui-states'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import {
  getProfile, listScenarios, startSession,
  type BackendProfile, type BackendScenario,
} from '@/lib/api'

type NamedItem = { name: string; description: string }

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return [value]
  }
  return []
}

function asNamedItems(value: unknown): NamedItem[] {
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

function NamedList({ items }: { items: NamedItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={`${item.name}-${i}`} className="text-sm">
          <span className="font-medium">{item.name}</span>
          {item.description && (
            <span className="text-muted-foreground"> — {item.description}</span>
          )}
        </li>
      ))}
    </ul>
  )
}

export default function PerfilDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { userRole, isLoading: authLoading } = useAuth()
  const [profile, setProfile] = useState<BackendProfile | null>(null)
  const [scenario, setScenario] = useState<BackendScenario | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (userRole === 'student') {
      router.push('/sesiones')
      return
    }
    void (async () => {
      try {
        setIsLoading(true)
        const item = await getProfile(id)
        setProfile(item)

        const caseName = (item.traits as Record<string, unknown> | undefined)?.case_name
        if (typeof caseName === 'string' && caseName) {
          try {
            const scenarios = await listScenarios()
            setScenario(scenarios.find((s) => s.name === caseName) ?? null)
          } catch {
            setScenario(null)
          }
        } else {
          setScenario(null)
        }
      } catch {
        setProfile(null)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [id, authLoading, userRole, router])

  const handlePractice = async () => {
    if (!scenario) return
    setStarting(true)
    try {
      const session = await startSession({ profile_id: id, scenario_id: scenario.id })
      router.push(`/chat?sesion=${session.id}`)
    } catch (err) {
      toast.error('No se pudo iniciar la sesión: ' + String(err))
      setStarting(false)
    }
  }

  if (authLoading || userRole === 'student') return null

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card><CardContent><LoadingState message="Cargando perfil..." className="py-8" /></CardContent></Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <ErrorState
          title="Perfil no encontrado"
          message="El perfil solicitado no existe o fue eliminado."
        />
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => router.push('/perfiles')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a perfiles
          </Button>
        </div>
      </div>
    )
  }

  const traits = (profile.traits ?? {}) as Record<string, unknown>
  const behavior = (profile.behavior ?? {}) as Record<string, unknown>

  const age = typeof traits.age === 'number' && traits.age > 0 ? traits.age : undefined
  const occupation = typeof traits.occupation === 'string' && traits.occupation.trim()
    ? traits.occupation.trim()
    : undefined
  const identityName = typeof traits.identity_name === 'string' ? traits.identity_name.trim() : ''
  const personality = asStringArray(traits.personality)
  const commStyle = asStringArray(traits.communication_style)
  const behaviorMax = typeof behavior.behavior_max === 'number' ? behavior.behavior_max : undefined
  const triggers = asNamedItems(behavior.triggers)
  const regulators = asNamedItems(behavior.regulators)

  const subtitle = [age ? `${age} años` : 'Edad sin definir', occupation].filter(Boolean).join(' · ')

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link href="/perfiles" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Volver a perfiles
      </Link>

      <PageHeader title={profile.name} description={subtitle}>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => router.push(`/perfiles/new?cloneFrom=${id}`)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar
          </Button>
          <Button variant="outline" onClick={() => router.push(`/perfiles/${id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          {scenario && (
            <Button onClick={() => { void handlePractice() }} disabled={starting}>
              <Play className="mr-2 h-4 w-4" />
              Practicar
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.description ? (
                <p className="text-sm text-foreground">{profile.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Este perfil no tiene descripción.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Perfil psicológico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Personalidad</h4>
                {personality.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {personality.map((p) => (
                      <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Sin rasgos definidos.</p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Estilo de comunicación</h4>
                {commStyle.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {commStyle.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Sin estilo definido.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Disparadores</CardTitle>
            </CardHeader>
            <CardContent>
              {triggers.length > 0 ? (
                <NamedList items={triggers} />
              ) : (
                <p className="text-sm text-muted-foreground">Este perfil no tiene disparadores configurados.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reguladores</CardTitle>
            </CardHeader>
            <CardContent>
              {regulators.length > 0 ? (
                <NamedList items={regulators} />
              ) : (
                <p className="text-sm text-muted-foreground">Este perfil no tiene reguladores configurados.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {identityName && identityName !== profile.name && (
                <div>
                  <p className="text-xs text-muted-foreground">Nombre del personaje</p>
                  <p className="text-sm">{identityName}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground">Edad</p>
                <p className="text-sm">{age ? `${age} años` : 'Sin definir'}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Ocupación</p>
                <p className="text-sm">{occupation ?? 'Sin definir'}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Severidad máxima</p>
                {behaviorMax != null ? (
                  <div className="mt-1">
                    <SeverityGauge level={behaviorMax} size="sm" showLabel showValue />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin comportamiento definido</p>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Última actualización</p>
                <p className="text-sm">{formatDate(profile.updated_at ?? profile.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Escenario vinculado</CardTitle>
            </CardHeader>
            <CardContent>
              {scenario ? (
                <div className="space-y-3">
                  <Link
                    href={`/escenarios/${scenario.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {scenario.name}
                  </Link>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{scenario.context}</p>
                  <SeverityGauge level={scenario.severity} size="sm" showValue />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Este perfil no tiene un escenario vinculado.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
