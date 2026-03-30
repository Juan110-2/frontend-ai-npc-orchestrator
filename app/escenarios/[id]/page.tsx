'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SeverityBadge } from '@/components/severity-badge';
import { ErrorState } from '@/components/ui-states';
import { mockEscenarios } from '@/lib/mock-data';

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
  const escenario = mockEscenarios.find((item) => item.id === id);

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
              <CardDescription>Se activan segun la evolucion de la interaccion.</CardDescription>
            </CardHeader>
            <CardContent>
              {escenario.riskFlags.length === 0 ? (
                <p className="text-sm text-muted-foreground">Este escenario no tiene banderas de riesgo configuradas.</p>
              ) : (
                <div className="space-y-2">
                  {escenario.riskFlags.map((flag) => (
                    <div key={flag.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{flag.description}</p>
                        <Badge variant={flag.active ? 'destructive' : 'outline'}>{flag.active ? 'Activa' : 'Inactiva'}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Tipo: {flag.type} | Severidad: {flag.severity}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Restricciones</CardTitle>
            </CardHeader>
            <CardContent>
              {escenario.restrictions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay restricciones configuradas.</p>
              ) : (
                <ul className="space-y-2">
                  {escenario.restrictions.map((item) => (
                    <li key={item.id} className="rounded-lg border p-3 text-sm">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-xs text-muted-foreground">Tipo: {item.type} | Valor: {item.value}</p>
                    </li>
                  ))}
                </ul>
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
              <div>
                <p className="text-xs text-muted-foreground">Severidad inicial</p>
                <div className="mt-1">
                  <SeverityBadge level={escenario.initialSeverity} />
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Ultima actualizacion</p>
                <p className="text-sm">{formatDate(escenario.updatedAt)}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Tiempo limite</p>
                <p className="text-sm">{escenario.timeLimit ? `${escenario.timeLimit} min` : 'No definido'}</p>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" onClick={() => router.push(`/chat?escenario=${escenario.id}`)}>
            Usar en sesion
          </Button>
        </div>
      </div>
    </div>
  );
}
