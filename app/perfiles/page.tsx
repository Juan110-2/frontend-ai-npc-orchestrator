'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, Play, Pencil, Trash2, Search, User as UserIcon, AlertTriangle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { SeverityRange } from '@/components/severity-gauge'
import { Paginator, paginate, PAGE_SIZE } from '@/components/paginator'
import { LoadingState } from '@/components/ui-states'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import {
  deleteProfile, listProfiles, listScenarios, startSession,
  type BackendProfile, type BackendScenario,
} from '@/lib/backend-api'

type CardData = {
  profile: BackendProfile
  scenario: BackendScenario | null
}

export default function PerfilesPage() {
  const router = useRouter()
  const { userRole, isLoading: authLoading } = useAuth()
  const [items, setItems] = useState<CardData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!authLoading && userRole === 'student') {
      router.push('/sesiones')
    }
  }, [authLoading, userRole, router])

  const load = async () => {
    setLoading(true)
    try {
      const [profiles, scenarios] = await Promise.all([listProfiles(), listScenarios()])
      // Por ahora emparejamos por orden de creación o dejamos sin escenario.
      // El wizard crea perfil+escenario en secuencia, así que el último escenario
      // suele corresponder al último perfil. Para vista listado no es crítico:
      // el botón "Practicar" abrirá un selector si es necesario.
      const data: CardData[] = profiles.map((p) => ({
        profile: p,
        scenario: scenarios.find((s) => s.name === (p.traits as any)?.case_name) ?? null,
      }))
      setItems(data)
    } catch (err) {
      toast.error('No se pudo cargar el listado: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])
  useEffect(() => { setPage(1) }, [search])

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(({ profile }) =>
      profile.name.toLowerCase().includes(q) ||
      profile.description.toLowerCase().includes(q)
    )
  }, [items, search])

  const handlePractice = async (profileId: string) => {
    // Necesitamos un escenario para iniciar sesión. Si no hay vinculado,
    // usamos el primero disponible. (Mejor mejora en otra iteración: selector.)
    const list = await listScenarios()
    if (list.length === 0) {
      toast.error('No hay escenarios. Crea uno primero.')
      return
    }
    try {
      const session = await startSession({ profile_id: profileId, scenario_id: list[0].id })
      router.push(`/chat?sesion=${session.id}`)
    } catch (err) {
      toast.error('No se pudo iniciar la sesión: ' + String(err))
    }
  }

  const handleDelete = async (profileId: string) => {
    if (!confirm('¿Eliminar este perfil? Las sesiones asociadas también se borrarán.')) return
    try {
      await deleteProfile(profileId)
      toast.success('Perfil eliminado.')
      void load()
    } catch (err) {
      toast.error('No se pudo eliminar: ' + String(err))
    }
  }

  if (authLoading || userRole === 'student') return null

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Perfiles"
          description="Casos clínicos simulados disponibles para práctica"
        />
        <Link href="/perfiles/new">
          <Button>
            <Plus className="mr-1 h-4 w-4" /> Nuevo perfil
          </Button>
        </Link>
      </div>

      <div className="mb-4 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o descripción…"
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
            <UserIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {items.length === 0
                ? 'Aún no has creado ningún perfil. Empieza creando uno.'
                : 'No hay resultados para tu búsqueda.'}
            </p>
            {items.length === 0 && (
              <Link href="/perfiles/new">
                <Button className="mt-3" size="sm">
                  <Plus className="mr-1 h-4 w-4" /> Crear primer perfil
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginate(filtered, page).map(({ profile }) => {
            const traits = (profile.traits ?? {}) as Record<string, unknown>
            const age = traits.age as number | undefined
            const occupation = traits.occupation as string | undefined
            const personality = (traits.personality as string[]) ?? []
            const behavior = (profile.behavior ?? {}) as Record<string, unknown>
            const behaviorMin = behavior.behavior_min as number | undefined
            const behaviorMax = behavior.behavior_max as number | undefined

            const initials = profile.name.split(' ')
              .map((w) => w[0]).slice(0, 2).join('').toUpperCase()

            return (
              <Card key={profile.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {initials || '·'}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{profile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {age ? `${age} años` : 'Edad sin definir'}
                        {occupation ? ` · ${occupation}` : ''}
                      </p>
                    </div>
                  </div>

                  <p className="mb-3 line-clamp-2 text-sm">{profile.description}</p>

                  {personality.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {personality.slice(0, 4).map((p) => (
                        <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-muted-foreground">
                      {behaviorMin != null && behaviorMax != null ? (
                        <div className="inline-flex items-center gap-2">
                          <span>Rango</span>
                          <SeverityRange min={behaviorMin} max={behaviorMax} size="sm" />
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="h-3 w-3" /> Sin comportamiento
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:flex sm:justify-end">
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => router.push(`/perfiles/${profile.id}/edit`)}
                        title="Editar"
                        className="w-full sm:w-auto"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => handleDelete(profile.id)}
                        title="Eliminar"
                        className="w-full sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        className="w-full sm:w-auto"
                        onClick={() => handlePractice(profile.id)}
                      >
                        <Play className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Practicar</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      <Paginator total={filtered.length} page={page} onPageChange={setPage} />
    </div>
  )
}
