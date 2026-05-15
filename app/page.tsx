'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  UserCircle, Map, Play, MessageSquare, ClipboardCheck, ArrowRight,
  TrendingUp, Clock, Activity, Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { SeverityGauge } from '@/components/severity-gauge'
import { cn } from '@/lib/utils'
import {
  listProfiles, listScenarios, listSessions, getMetricsSummary,
  type BackendProfile, type BackendScenario, type BackendSession, type MetricsSummary,
} from '@/lib/backend-api'
import { useAuth } from '@/lib/auth-context'

type RecentSession = BackendSession & {
  perfilName?: string
  escenarioName?: string
}

export default function DashboardPage() {
  const { userRole, isLoading: authLoading } = useAuth()
  const isAdmin = userRole === 'admin'
  const isStudent = userRole === 'student'

  const [profiles, setProfiles] = useState<BackendProfile[]>([])
  const [scenarios, setScenarios] = useState<BackendScenario[]>([])
  const [sessions, setSessions] = useState<RecentSession[]>([])
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  // Esperar a que auth resuelva antes de fetchear para evitar doble carga
  useEffect(() => {
    if (authLoading) return
    void (async () => {
      try {
        setLoading(true)
        const [p, sc, ss] = await Promise.all([
          listProfiles(),
          listScenarios(),
          listSessions(),
        ])
        setProfiles(p)
        setScenarios(sc)
        setSessions(ss.map((s) => ({
          ...s,
          perfilName: p.find((x) => x.id === s.profile_id)?.name ?? '—',
          escenarioName: sc.find((x) => x.id === s.scenario_id)?.name ?? '—',
        })))
        if (isAdmin) {
          try {
            setMetrics(await getMetricsSummary())
          } catch {
            // sin datos
          }
        }
      } catch (e) {
        console.error('No se pudo cargar el dashboard:', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [authLoading]) // solo re-corre cuando auth termina de cargar

  const activeSessions = sessions.filter((s) => !s.ended_at).length
  const completedSessions = sessions.filter((s) => !!s.ended_at).length
  const avgDurationMin = (() => {
    const closed = sessions.filter((s) => !!s.ended_at)
    if (closed.length === 0) return null
    const total = closed.reduce((acc, s) => {
      return acc + (new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime()) / 60000
    }, 0)
    return Math.round(total / closed.length)
  })()

  const statCards = [
    {
      title: 'Perfiles',
      value: profiles.length,
      description: 'Perfiles creados',
      icon: UserCircle,
      href: isStudent ? '/sesiones' : '/perfiles',
    },
    {
      title: 'Escenarios',
      value: scenarios.length,
      description: 'Contextos de simulación',
      icon: Map,
      href: '/escenarios',
    },
    {
      title: 'Sesiones activas',
      value: activeSessions,
      description: 'En progreso',
      icon: Play,
      href: '/sesiones',
    },
    {
      title: 'Sesiones cerradas',
      value: completedSessions,
      description: 'Listas para evaluar',
      icon: ClipboardCheck,
      href: '/sesiones',
    },
  ]

  // Acciones rápidas según rol
  const quickActions = isStudent
    ? [
        { title: 'Mis sesiones',     description: 'Ver tus prácticas',     href: '/sesiones',   icon: MessageSquare },
        { title: 'Mis evaluaciones', description: 'Revisar tu desempeño',  href: '/evaluacion', icon: ClipboardCheck },
      ]
    : [
        { title: 'Nuevo perfil',      description: 'Crear caso clínico',    href: '/perfiles/new', icon: UserCircle },
        { title: 'Nueva sesión',      description: 'Comenzar simulación',   href: '/sesiones',     icon: MessageSquare },
        { title: 'Ver evaluaciones',  description: 'Revisar desempeño',     href: '/evaluacion',   icon: ClipboardCheck },
      ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Inicio"
        description="Vista general del sistema de simulación clínica"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="transition-all hover:border-border/80 hover:shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight">
                      {loading ? '…' : stat.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-3">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Sesiones recientes + acciones rápidas */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium">Sesiones recientes</CardTitle>
              <CardDescription>Últimas simulaciones registradas</CardDescription>
            </div>
            <Link href="/sesiones">
              <Button variant="ghost" size="sm">
                Ver todas <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Cargando…</span>
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay sesiones.{isStudent ? ' Tu profesor te asignará una.' : ' Crea un perfil y empieza a practicar.'}
              </p>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 4).map((s) => {
                  const isActive = !s.ended_at
                  return (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-lg',
                          isActive ? 'bg-success/10' : 'bg-muted'
                        )}>
                          <Play className={cn('h-4 w-4', isActive ? 'text-success' : 'text-muted-foreground')} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{s.perfilName}</p>
                          <p className="truncate text-xs text-muted-foreground">{s.escenarioName}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <SeverityGauge level={s.current_severity} size="sm" />
                        <Badge variant={isActive ? 'default' : 'secondary'}>
                          {isActive ? 'Activa' : 'Cerrada'}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Acciones rápidas</CardTitle>
            <CardDescription>Flujos principales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickActions.map((a) => (
                <Link key={a.title} href={a.href}>
                  <div className="group flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <a.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen de uso */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Resumen de uso</CardTitle>
          <CardDescription>Calculado sobre las sesiones registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              icon={<TrendingUp className="h-5 w-5 text-success" />}
              label="Sesiones cerradas"
              value={loading ? '…' : String(completedSessions)}
            />
            <Metric
              icon={<Activity className="h-5 w-5 text-info" />}
              label="Sesiones activas"
              value={loading ? '…' : String(activeSessions)}
            />
            <Metric
              icon={<Clock className="h-5 w-5 text-warning" />}
              label="Duración media"
              value={loading ? '…' : avgDurationMin != null ? `${avgDurationMin} min` : 'sin datos'}
            />
            {isAdmin && (
              <Metric
                icon={<MessageSquare className="h-5 w-5 text-primary" />}
                label="Llamadas a IA"
                value={loading ? '…' : metrics ? String(metrics.totals.total_calls) : 'sin datos'}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
