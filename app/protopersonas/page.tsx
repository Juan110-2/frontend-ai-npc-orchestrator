'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Brain, MoreHorizontal, Eye, Pencil, Copy, Trash2, Filter } from 'lucide-react';
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
import { SeverityIndicator } from '@/components/severity-badge';
import { mockProtopersonas } from '@/lib/mock-data';
import type { Protopersona } from '@/lib/types';
import { cn } from '@/lib/utils';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function ProtopersonaCard({ protopersona }: { protopersona: Protopersona }) {
  const router = useRouter();

  return (
    <Card className="group transition-all hover:border-border/80 hover:shadow-sm">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Link 
                  href={`/protopersonas/${protopersona.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {protopersona.name}
                </Link>
                <div className="mt-0.5 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">v{protopersona.version}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(protopersona.updatedAt)}
                  </span>
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
                <DropdownMenuItem onClick={() => router.push(`/protopersonas/${protopersona.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/protopersonas/${protopersona.id}/edit`)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/perfiles/new?from=${protopersona.id}`)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Crear perfil
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
            {protopersona.pedagogicalObjective}
          </p>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-xs">
                <span className="text-muted-foreground">Rango: </span>
                <span className="font-medium">{protopersona.behaviorRange.min}-{protopersona.behaviorRange.max}</span>
              </div>
              <SeverityIndicator level={protopersona.behaviorRange.max} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
              <span className="text-muted-foreground">Disparadores:</span>
              <span className="font-medium">{protopersona.triggers.length}</span>
            </div>
            <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
              <span className="text-muted-foreground">Reguladores:</span>
              <span className="font-medium">{protopersona.regulators.length}</span>
            </div>
            <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
              <span className="text-muted-foreground">Reacciones:</span>
              <span className="font-medium">{protopersona.interventionReactions.length}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-border bg-muted/30 px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex -space-x-1">
              {protopersona.interventionReactions.slice(0, 4).map((reaction, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-6 w-6 rounded-full border-2 border-card text-[10px] font-medium flex items-center justify-center',
                    reaction.category === 'supportive' && 'bg-intervention-supportive text-white',
                    reaction.category === 'neutral' && 'bg-intervention-neutral text-white',
                    reaction.category === 'confusing' && 'bg-intervention-confusing text-white',
                    reaction.category === 'invalidating' && 'bg-intervention-invalidating text-white',
                    reaction.category === 'risk' && 'bg-intervention-risk text-white',
                  )}
                  title={reaction.category}
                >
                  {reaction.severityChange > 0 ? '+' : ''}{reaction.severityChange}
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/protopersonas/${protopersona.id}`}>
                Ver detalle
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProtopersonasPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProtopersonas = mockProtopersonas.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.pedagogicalObjective.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <PageHeader
        title="Protopersonas"
        description="Moldes conductuales que definen patrones de comportamiento para simulaciones"
        action={{
          label: 'Nueva Protopersona',
          onClick: () => router.push('/protopersonas/new'),
          icon: <Plus className="mr-2 h-4 w-4" />,
        }}
      />

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar protopersonas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid */}
      {filteredProtopersonas.length === 0 ? (
        <EmptyState
          icon={<Brain className="h-6 w-6 text-muted-foreground" />}
          title="No hay protopersonas"
          description={searchQuery 
            ? "No se encontraron protopersonas con ese criterio de busqueda" 
            : "Crea tu primera protopersona para comenzar a definir moldes conductuales"
          }
          action={!searchQuery ? {
            label: 'Crear Protopersona',
            onClick: () => router.push('/protopersonas/new'),
            icon: <Plus className="mr-2 h-4 w-4" />,
          } : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProtopersonas.map((protopersona) => (
            <ProtopersonaCard key={protopersona.id} protopersona={protopersona} />
          ))}
        </div>
      )}
    </div>
  );
}
