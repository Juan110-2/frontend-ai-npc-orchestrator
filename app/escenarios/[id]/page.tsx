'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SeverityGauge } from '@/components/severity-gauge';
import { ErrorState, LoadingState } from '@/components/ui-states';
import { getScenario } from '@/lib/api';
import type { Escenario } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export default function EscenarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { userRole, isLoading: authLoading } = useAuth();
  const [escenario, setEscenario] = useState<Escenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && userRole === 'student') {
      router.push('/sesiones');
      return;
    }
    void (async () => {
      try {
        setIsLoading(true);
        const item = await getScenario(id);

        const mappedScenario: Escenario = {
          id: item.id,
          name: item.name,
          description: item.context,
          situationContext: item.context,
          initialSeverity: Math.max(1, Math.min(5, item.severity)) as 1 | 2 | 3 | 4 | 5,
          riskFlags: (item.risk_flags || []).map((flag, index) => ({
            id: `${item.id}-risk-${index}`,
            type: 'custom',
            description: flag,
            severity: Math.max(1, Math.min(5, item.severity)) as 1 | 2 | 3 | 4 | 5,
            active: true,
          })),
          restrictions: [],
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.created_at),
        };

        setEscenario(mappedScenario);
      } catch {
        setEscenario(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (authLoading || userRole === 'student') return null;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card><CardContent><LoadingState message="Cargando escenario..." className="py-8" /></CardContent></Card>
      </div>
    );
  }

  if (!escenario) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <ErrorState
          title="Escenario no encontrado"
          message="El escenario solicitado no existe o fue eliminado."
          onRetry={() => router.push('/escenarios')}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link href="/escenarios" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Volver a escenarios
      </Link>

      <PageHeader
        title={escenario.name}
        description={escenario.description}
        action={{
          label: 'Editar',
          onClick: () => router.push(`/escenarios/${id}/edit`),
          icon: <Pencil className="mr-2 h-4 w-4" />,
        }}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contexto situacional</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{escenario.situationContext}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Banderas de riesgo</CardTitle>
              <CardDescription>
                Rasgos permanentes del personaje: se agregan como información de contexto en su
                prompt ("Indicadores presentes: ..."), no son un estado que cambie durante la
                conversación.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {escenario.riskFlags.length === 0 ? (
                <p className="text-sm text-muted-foreground">Este escenario no tiene banderas de riesgo configuradas.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {escenario.riskFlags.map((flag) => (
                    <Badge key={flag.id} variant="outline">{flag.description}</Badge>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Mejora futura propuesta: usar estas banderas también para activar el sistema de
                alertas de riesgo durante la conversación, en vez de ser solo información de
                contexto para el personaje.
              </p>
            </CardContent>
          </Card>

        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Severidad inicial</p>
                <div className="mt-1">
                  <SeverityGauge level={escenario.initialSeverity} size="sm" showLabel showValue />
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Última actualización</p>
                <p className="text-sm">{formatDate(escenario.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
