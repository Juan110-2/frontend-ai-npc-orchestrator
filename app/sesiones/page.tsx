'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Play, 
  Pause, 
  Square, 
  MoreHorizontal, 
  Eye, 
  MessageSquare,
  ClipboardCheck,
  Filter,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/ui-states';
import { SeverityBadge, SeverityIndicator } from '@/components/severity-badge';
import { mockSesiones } from '@/lib/mock-data';
import type { Sesion, SessionStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

const statusConfig: Record<SessionStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: typeof Play }> = {
  active: { label: 'Activa', variant: 'default', icon: Play },
  paused: { label: 'Pausada', variant: 'secondary', icon: Pause },
  completed: { label: 'Completada', variant: 'outline', icon: Square },
  terminated: { label: 'Terminada', variant: 'destructive', icon: Square },
};

function SesionCard({ sesion }: { sesion: Sesion }) {
  const router = useRouter();
  const config = statusConfig[sesion.status];
  const StatusIcon = config.icon;

  return (
    <Card className="group transition-all hover:border-border/80 hover:shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              sesion.status === 'active' && 'bg-success/10',
              sesion.status === 'paused' && 'bg-warning/10',
              sesion.status === 'completed' && 'bg-muted',
              sesion.status === 'terminated' && 'bg-destructive/10'
            )}>
              <StatusIcon className={cn(
                'h-5 w-5',
                sesion.status === 'active' && 'text-success',
                sesion.status === 'paused' && 'text-warning',
                sesion.status === 'completed' && 'text-muted-foreground',
                sesion.status === 'terminated' && 'text-destructive'
              )} />
            </div>
            <div>
              <Link 
                href={`/sesiones/${sesion.id}`}
                className="font-medium text-foreground hover:underline"
              >
                {sesion.perfilName}
              </Link>
              <p className="text-sm text-muted-foreground">{sesion.escenarioName}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/sesiones/${sesion.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle
              </DropdownMenuItem>
              {sesion.status === 'active' && (
                <DropdownMenuItem onClick={() => router.push(`/chat?session=${sesion.id}`)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Continuar chat
                </DropdownMenuItem>
              )}
              {sesion.status === 'paused' && (
                <DropdownMenuItem onClick={() => router.push(`/chat?session=${sesion.id}`)}>
                  <Play className="mr-2 h-4 w-4" />
                  Reanudar sesion
                </DropdownMenuItem>
              )}
              {sesion.status === 'completed' && (
                <DropdownMenuItem onClick={() => router.push(`/evaluacion/new?session=${sesion.id}`)}>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Evaluar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SeverityBadge level={sesion.state.currentSeverity} size="sm" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDuration(sesion.state.totalDuration)}
            </div>
          </div>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>

        {/* Progress indicators */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold">{sesion.state.turnCount}</p>
            <p className="text-xs text-muted-foreground">Turnos</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{sesion.state.coherenceScore}%</p>
            <p className="text-xs text-muted-foreground">Coherencia</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{sesion.state.activeRiskFlags.length}</p>
            <p className="text-xs text-muted-foreground">Flags</p>
          </div>
        </div>

        {/* Model info */}
        {sesion.modelName && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Modelo:</span>
            <Badge variant="secondary" className="text-xs">{sesion.modelName}</Badge>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatDate(sesion.startedAt)}
          </span>
          <Button variant="ghost" size="sm" asChild>
            <Link href={sesion.status === 'active' ? `/chat?session=${sesion.id}` : `/sesiones/${sesion.id}`}>
              {sesion.status === 'active' ? 'Continuar' : 'Ver detalle'}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SesionesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');

  const filteredSesiones = mockSesiones.filter((s) => {
    const matchesSearch = s.perfilName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.escenarioName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || s.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const counts = {
    all: mockSesiones.length,
    active: mockSesiones.filter(s => s.status === 'active').length,
    paused: mockSesiones.filter(s => s.status === 'paused').length,
    completed: mockSesiones.filter(s => s.status === 'completed').length,
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Sesiones"
        description="Historial de sesiones de simulacion y chat activas"
        action={{
          label: 'Nueva Sesion',
          onClick: () => router.push('/chat'),
          icon: <Plus className="mr-2 h-4 w-4" />,
        }}
      />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">{counts.active}</p>
                <p className="text-xs text-muted-foreground">Activas</p>
              </div>
              <div className="rounded-lg bg-success/10 p-2">
                <Play className="h-4 w-4 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">{counts.paused}</p>
                <p className="text-xs text-muted-foreground">Pausadas</p>
              </div>
              <div className="rounded-lg bg-warning/10 p-2">
                <Pause className="h-4 w-4 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">{counts.completed}</p>
                <p className="text-xs text-muted-foreground">Completadas</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <Square className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">{counts.all}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todas ({counts.all})</TabsTrigger>
            <TabsTrigger value="active">Activas ({counts.active})</TabsTrigger>
            <TabsTrigger value="paused">Pausadas ({counts.paused})</TabsTrigger>
            <TabsTrigger value="completed">Completadas ({counts.completed})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar sesiones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      {filteredSesiones.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-6 w-6 text-muted-foreground" />}
          title="No hay sesiones"
          description={searchQuery 
            ? "No se encontraron sesiones con ese criterio de busqueda" 
            : "Inicia una nueva sesion para comenzar a simular"
          }
          action={!searchQuery ? {
            label: 'Nueva Sesion',
            onClick: () => router.push('/chat'),
            icon: <Plus className="mr-2 h-4 w-4" />,
          } : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSesiones.map((sesion) => (
            <SesionCard key={sesion.id} sesion={sesion} />
          ))}
        </div>
      )}
    </div>
  );
}
