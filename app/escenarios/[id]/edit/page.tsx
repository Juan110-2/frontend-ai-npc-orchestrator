'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ErrorState } from '@/components/ui-states';
import { mockEscenarios } from '@/lib/mock-data';
import type { SeverityLevel } from '@/lib/types';
import { toast } from 'sonner';

export default function EditEscenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const escenario = mockEscenarios.find((item) => item.id === id);

  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(escenario?.name || '');
  const [description, setDescription] = useState(escenario?.description || '');
  const [situationContext, setSituationContext] = useState(escenario?.situationContext || '');
  const [initialSeverity, setInitialSeverity] = useState<SeverityLevel>(escenario?.initialSeverity || 3);
  const [timeLimit, setTimeLimit] = useState(escenario?.timeLimit ? String(escenario.timeLimit) : '');

  if (!escenario) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <ErrorState
          title="Escenario no encontrado"
          message="No se puede editar porque el escenario ya no existe."
          onRetry={() => router.push('/escenarios')}
        />
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !description.trim() || !situationContext.trim()) {
      toast.error('Completa nombre, descripcion y contexto para continuar.');
      return;
    }

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 350));
    toast.success('Escenario actualizado (modo demo).');
    router.push(`/escenarios/${id}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link href={`/escenarios/${id}`} className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Volver al detalle
      </Link>

      <PageHeader title="Editar Escenario" description="Actualiza configuracion y contexto del escenario." />

      <form onSubmit={handleSubmit} className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos del escenario</CardTitle>
            <CardDescription>Los cambios se aplican en modo demo para pruebas de interfaz.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripcion *</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Contexto de la situacion *</Label>
              <Textarea id="context" value={situationContext} onChange={(e) => setSituationContext(e.target.value)} rows={4} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Severidad inicial</Label>
                <Select value={String(initialSeverity)} onValueChange={(value) => setInitialSeverity(Number(value) as SeverityLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Nivel 1</SelectItem>
                    <SelectItem value="2">Nivel 2</SelectItem>
                    <SelectItem value="3">Nivel 3</SelectItem>
                    <SelectItem value="4">Nivel 4</SelectItem>
                    <SelectItem value="5">Nivel 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time-limit">Limite de tiempo (minutos)</Label>
                <Input id="time-limit" type="number" min={0} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push(`/escenarios/${id}`)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
