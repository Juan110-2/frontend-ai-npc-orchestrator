'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Pencil, 
  Copy, 
  Trash2, 
  Brain,
  Zap,
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/page-header';
import { SeverityBadge, SeverityIndicator } from '@/components/severity-badge';
import { InterventionBadge } from '@/components/intervention-badge';
import { ErrorState } from '@/components/ui-states';
import { mockProtopersonas } from '@/lib/mock-data';
import { INTERVENTION_LABELS } from '@/lib/types';
import type { InterventionCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function SeverityChangeIcon({ change }: { change: number }) {
  if (change > 0) return <TrendingUp className="h-4 w-4 text-destructive" />;
  if (change < 0) return <TrendingDown className="h-4 w-4 text-success" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export default function ProtopersonaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const protopersona = mockProtopersonas.find((p) => p.id === id);

  if (!protopersona) {
    return (
      <div className="p-8">
        <ErrorState
          title="Protopersona no encontrada"
          message="La protopersona que buscas no existe o ha sido eliminada."
          onRetry={() => router.push('/protopersonas')}
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Back link */}
      <Link 
        href="/protopersonas" 
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Volver a protopersonas
      </Link>

      <PageHeader
        title={protopersona.name}
        description={protopersona.pedagogicalObjective}
        action={{
          label: 'Editar',
          onClick: () => router.push(`/protopersonas/${id}/edit`),
          icon: <Pencil className="mr-2 h-4 w-4" />,
        }}
        secondaryAction={{
          label: 'Crear Perfil',
          onClick: () => router.push(`/perfiles/new?from=${id}`),
          icon: <Copy className="mr-2 h-4 w-4" />,
        }}
      />

      {/* Meta info */}
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <Badge variant="outline" className="gap-1">
          <Brain className="h-3 w-3" />
          Version {protopersona.version}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          Actualizado {formatDate(protopersona.updatedAt)}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Behavior Range */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rango de Comportamiento</CardTitle>
              <CardDescription>Niveles de severidad que puede alcanzar esta protopersona</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Mínimo:</span>
                  <SeverityBadge level={protopersona.behaviorRange.min} />
                </div>
                <div className="flex-1">
                  <SeverityIndicator level={protopersona.behaviorRange.max} />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Máximo:</span>
                  <SeverityBadge level={protopersona.behaviorRange.max} />
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {protopersona.behaviorRange.description}
              </p>
            </CardContent>
          </Card>

          {/* Triggers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-warning" />
                Disparadores
              </CardTitle>
              <CardDescription>Situaciones que activan o intensifican la respuesta emocional</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {protopersona.triggers.map((trigger) => (
                  <div
                    key={trigger.id}
                    className="flex items-start justify-between rounded-lg border border-border bg-card p-4"
                  >
                    <div>
                      <p className="font-medium text-foreground">{trigger.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{trigger.description}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'shrink-0 ml-4',
                        trigger.severityImpact >= 2 && 'border-destructive/50 text-destructive'
                      )}
                    >
                      +{trigger.severityImpact} severidad
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Regulators */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-success" />
                Reguladores
              </CardTitle>
              <CardDescription>Técnicas y recursos que ayudan a reducir la intensidad emocional</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {protopersona.regulators.map((regulator) => (
                  <div
                    key={regulator.id}
                    className="flex items-start justify-between rounded-lg border border-border bg-card p-4"
                  >
                    <div>
                      <p className="font-medium text-foreground">{regulator.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{regulator.description}</p>
                    </div>
                    <div className="shrink-0 ml-4">
                      <div className="text-right">
                        <span className="text-sm font-medium text-success">
                          {Math.round(regulator.effectiveness * 100)}%
                        </span>
                        <p className="text-xs text-muted-foreground">efectividad</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Intervention Reactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reacciones a Intervenciones</CardTitle>
              <CardDescription>Cómo responde la protopersona a diferentes tipos de intervención terapéutica</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {protopersona.interventionReactions.map((reaction, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-center justify-between">
                      <InterventionBadge category={reaction.category} />
                      <div className="flex items-center gap-2">
                        <SeverityChangeIcon change={reaction.severityChange} />
                        <span className={cn(
                          'text-sm font-medium',
                          reaction.severityChange > 0 && 'text-destructive',
                          reaction.severityChange < 0 && 'text-success',
                          reaction.severityChange === 0 && 'text-muted-foreground'
                        )}>
                          {reaction.severityChange > 0 ? '+' : ''}{reaction.severityChange} severidad
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-foreground">{reaction.responsePattern}</p>
                    {reaction.examples.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Ejemplos de respuesta:</p>
                        <div className="flex flex-wrap gap-2">
                          {reaction.examples.map((example, i) => (
                            <span key={i} className="rounded-md bg-muted px-2 py-1 text-xs italic">
                              &ldquo;{example}&rdquo;
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Closure Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Criterios de Cierre
              </CardTitle>
              <CardDescription>Condiciones para finalizar la sesión</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {protopersona.closureRules.map((rule, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {rule.criteria === 'improvement' && (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-success shrink-0" />
                    )}
                    {rule.criteria === 'deterioration' && (
                      <TrendingDown className="mt-0.5 h-4 w-4 text-warning shrink-0" />
                    )}
                    {rule.criteria === 'risk' && (
                      <XCircle className="mt-0.5 h-4 w-4 text-destructive shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {rule.criteria === 'improvement' && 'Mejoría'}
                        {rule.criteria === 'deterioration' && 'Deterioro'}
                        {rule.criteria === 'risk' && 'Riesgo'}
                      </p>
                      <p className="text-xs text-muted-foreground">{rule.description}</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        Umbral: {rule.threshold}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Perfiles creados</span>
                  <span className="font-medium">3</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sesiones totales</span>
                  <span className="font-medium">12</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Puntuación promedio</span>
                  <span className="font-medium text-success">87%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push(`/perfiles/new?from=${id}`)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Crear perfil desde esta protopersona
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar protopersona
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
