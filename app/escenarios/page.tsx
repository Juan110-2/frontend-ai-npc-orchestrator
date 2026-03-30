'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Map, MoreHorizontal, Eye, Pencil, Trash2, Filter, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/ui-states';
import { SeverityBadge } from '@/components/severity-badge';
import { mockEscenarios } from '@/lib/mock-data';
import type { Escenario } from '@/lib/types';
import { cn } from '@/lib/utils';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function EscenarioCard({ escenario }: { escenario: Escenario }) {
  const router = useRouter();
  const hasRiskFlags = escenario.riskFlags.some(f => f.active);

  return (
    <Card className="group transition-all hover:border-border/80 hover:shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              hasRiskFlags ? 'bg-destructive/10' : 'bg-chart-3/10'
            )}>
              <Map className={cn('h-5 w-5', hasRiskFlags ? 'text-destructive' : 'text-chart-3')} />
            </div>
            <div>
              <Link 
                href={`/escenarios/${escenario.id}`}
                className="font-medium text-foreground hover:underline"
              >
                {escenario.name}
              </Link>
              <div className="mt-0.5 flex items-center gap-2">
                <SeverityBadge level={escenario.initialSeverity} size="sm" />
                {escenario.timeLimit && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    {escenario.timeLimit} min
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/escenarios/${escenario.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/escenarios/${escenario.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/chat?escenario=${escenario.id}`)}>
                <Map className="mr-2 h-4 w-4" />
                Usar en sesion
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {escenario.description}
        </p>

        <div className="mt-3 text-xs text-muted-foreground line-clamp-2">
          <span className="font-medium">Contexto:</span> {escenario.situationContext}
        </div>

        {/* Risk Flags */}
        {hasRiskFlags && (
          <div className="mt-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-xs font-medium text-destructive">
              {escenario.riskFlags.filter(f => f.active).length} flag(s) de riesgo activo(s)
            </span>
          </div>
        )}

        {/* Restrictions */}
        {escenario.restrictions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {escenario.restrictions.slice(0, 2).map((restriction) => (
              <Badge key={restriction.id} variant="secondary" className="text-xs">
                {restriction.type}
              </Badge>
            ))}
            {escenario.restrictions.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{escenario.restrictions.length - 2} mas
              </Badge>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatDate(escenario.updatedAt)}
          </span>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/escenarios/${escenario.id}`}>
              Ver detalle
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EscenariosPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEscenarios = mockEscenarios.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Escenarios"
        description="Contextos de situacion para simulaciones e interacciones conductuales"
        action={{
          label: 'Nuevo Escenario',
          onClick: () => router.push('/escenarios/new'),
          icon: <Plus className="mr-2 h-4 w-4" />,
        }}
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar escenarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon" className="self-start sm:self-auto">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid */}
      {filteredEscenarios.length === 0 ? (
        <EmptyState
          icon={<Map className="h-6 w-6 text-muted-foreground" />}
          title="No hay escenarios"
          description={searchQuery 
            ? "No se encontraron escenarios con ese criterio de busqueda" 
            : "Crea tu primer escenario para definir contextos de simulacion"
          }
          action={!searchQuery ? {
            label: 'Crear Escenario',
            onClick: () => router.push('/escenarios/new'),
            icon: <Plus className="mr-2 h-4 w-4" />,
          } : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredEscenarios.map((escenario) => (
            <EscenarioCard key={escenario.id} escenario={escenario} />
          ))}
        </div>
      )}
    </div>
  );
}
