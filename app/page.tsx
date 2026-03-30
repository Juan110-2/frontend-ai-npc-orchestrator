'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Brain, 
  UserCircle, 
  Map, 
  Play, 
  MessageSquare, 
  ClipboardCheck,
  ArrowRight,
  TrendingUp,
  Clock,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { SeverityBadge } from '@/components/severity-badge';
import { mockDashboardStats, mockSesiones, mockProtopersonas } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const statCards = [
  {
    title: 'Protopersonas',
    value: mockDashboardStats.protopersonasCount,
    description: 'Moldes conductuales',
    icon: Brain,
    href: '/protopersonas',
    color: 'text-chart-1',
    bgColor: 'bg-chart-1/10',
  },
  {
    title: 'Perfiles',
    value: mockDashboardStats.perfilesCount,
    description: 'Instancias activas',
    icon: UserCircle,
    href: '/perfiles',
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/10',
  },
  {
    title: 'Escenarios',
    value: mockDashboardStats.escenariosCount,
    description: 'Contextos de simulacion',
    icon: Map,
    href: '/escenarios',
    color: 'text-chart-3',
    bgColor: 'bg-chart-3/10',
  },
  {
    title: 'Sesiones Activas',
    value: mockDashboardStats.activeSessions,
    description: 'En progreso',
    icon: Play,
    href: '/sesiones',
    color: 'text-chart-4',
    bgColor: 'bg-chart-4/10',
  },
];

const quickActions = [
  { 
    title: 'Nueva Protopersona', 
    description: 'Crear molde conductual', 
    href: '/protopersonas/new',
    icon: Brain,
  },
  { 
    title: 'Iniciar Sesion', 
    description: 'Comenzar simulacion', 
    href: '/chat',
    icon: MessageSquare,
  },
  { 
    title: 'Ver Evaluaciones', 
    description: 'Analizar resultados', 
    href: '/evaluacion',
    icon: ClipboardCheck,
  },
];

function formatTimeAgo(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `hace ${days} dia${days > 1 ? 's' : ''}`;
  if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
  return 'hace un momento';
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min`;
}

const activityIcons = {
  protopersona: Brain,
  perfil: UserCircle,
  escenario: Map,
  session: Play,
  evaluation: ClipboardCheck,
};

const activityLabels = {
  created: 'Creado',
  updated: 'Actualizado',
  cloned: 'Clonado',
  completed: 'Completado',
  evaluated: 'Evaluado',
};

export default function DashboardPage() {
  return (
    <div className="p-8">
      <PageHeader
        title="Dashboard"
        description="Vista general de la plataforma de simulacion conversacional"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="transition-all hover:border-border/80 hover:shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight">{stat.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                  <div className={cn('rounded-lg p-3', stat.bgColor)}>
                    <stat.icon className={cn('h-5 w-5', stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Active Sessions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium">Sesiones Recientes</CardTitle>
              <CardDescription>Ultimas sesiones de simulacion</CardDescription>
            </div>
            <Link href="/sesiones">
              <Button variant="ghost" size="sm">
                Ver todas
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSesiones.slice(0, 3).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      session.status === 'active' ? 'bg-success/10' : 'bg-muted'
                    )}>
                      <Play className={cn(
                        'h-5 w-5',
                        session.status === 'active' ? 'text-success' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{session.perfilName}</p>
                      <p className="text-sm text-muted-foreground">{session.escenarioName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <SeverityBadge level={session.state.currentSeverity} size="sm" />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {session.state.turnCount} turnos
                      </p>
                    </div>
                    <Badge
                      variant={session.status === 'active' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {session.status === 'active' ? 'Activa' : 
                       session.status === 'completed' ? 'Completada' : 
                       session.status === 'paused' ? 'Pausada' : 'Terminada'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Acciones Rapidas</CardTitle>
            <CardDescription>Accesos directos frecuentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href}>
                  <div className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <action.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Actividad Reciente</CardTitle>
            <CardDescription>Ultimas acciones en la plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockDashboardStats.recentActivity.slice(0, 5).map((activity) => {
                const Icon = activityIcons[activity.type];
                return (
                  <div key={activity.id} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {activity.entityName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activityLabels[activity.action]}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Protopersonas Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium">Protopersonas</CardTitle>
              <CardDescription>Moldes conductuales disponibles</CardDescription>
            </div>
            <Link href="/protopersonas">
              <Button variant="ghost" size="sm">
                Ver todas
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockProtopersonas.slice(0, 3).map((proto) => (
                <Link key={proto.id} href={`/protopersonas/${proto.id}`}>
                  <div className="rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{proto.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                          {proto.pedagogicalObjective}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2 shrink-0">
                        v{proto.version}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{proto.triggers.length} disparadores</span>
                      <span>{proto.regulators.length} reguladores</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Resumen de Rendimiento</CardTitle>
          <CardDescription>Metricas clave de la plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{mockDashboardStats.averageEvaluationScore}%</p>
                <p className="text-sm text-muted-foreground">Puntuacion promedio</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
                <Activity className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{mockDashboardStats.completedSessions}</p>
                <p className="text-sm text-muted-foreground">Sesiones completadas</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-semibold">38 min</p>
                <p className="text-sm text-muted-foreground">Duracion promedio</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-5/10">
                <MessageSquare className="h-6 w-6 text-chart-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">156</p>
                <p className="text-sm text-muted-foreground">Total de mensajes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
