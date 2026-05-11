'use client';

import { useState } from 'react';
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
import { toast } from 'sonner';
import type { SeverityLevel } from '@/lib/types';
import { createScenario } from '@/lib/backend-api';

export default function NewEscenarioPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [situationContext, setSituationContext] = useState('');
  const [initialSeverity, setInitialSeverity] = useState<SeverityLevel>(3);
  const [timeLimit, setTimeLimit] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !description.trim() || !situationContext.trim()) {
      toast.error('Completa nombre, descripción y contexto para continuar.');
      return;
    }

    setIsSaving(true);

    try {
      await createScenario({
        name,
        context: situationContext,
        severity: initialSeverity,
        risk_flags: [],
        constraints: {
          timeLimit: timeLimit ? Number(timeLimit) : null,
          description,
        },
      });
      toast.success('Escenario creado.');
      router.push('/escenarios');
    } catch {
      toast.error('No se pudo crear el escenario en el backend.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link href="/escenarios" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Volver a escenarios
      </Link>

      <PageHeader title="Nuevo Escenario" description="Define un contexto situacional para usar en simulaciones." />

      <form onSubmit={handleSubmit} className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuración del escenario</CardTitle>
            <CardDescription>Los datos se guardan directamente en el backend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ej. Inicio de simulación - conflicto familiar" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe brevemente el objetivo del escenario." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Contexto de la situación *</Label>
              <Textarea id="context" value={situationContext} onChange={(e) => setSituationContext(e.target.value)} rows={4} placeholder="Contexto narrativo que enmarca la interacción." />
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
                <Label htmlFor="time-limit">Límite de tiempo (minutos)</Label>
                <Input id="time-limit" type="number" min={0} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} placeholder="ej. 20" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push('/escenarios')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Guardando...' : 'Crear escenario'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
