'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertTriangle, Plus } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { SeverityGauge } from '@/components/severity-gauge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import type { SeverityLevel } from '@/lib/types';
import { createScenario } from '@/lib/backend-api';
import { useAuth } from '@/lib/auth-context';

export default function NewEscenarioPage() {
  const router = useRouter();
  const { userRole, isLoading: authLoading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
    useEffect(() => {
      if (!authLoading && userRole === 'student') {
        router.push('/sesiones');
      }
    }, [authLoading, userRole, router]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [situationContext, setSituationContext] = useState('');
  const [initialSeverity, setInitialSeverity] = useState<SeverityLevel>(3);
  const [riskFlags, setRiskFlags] = useState<string[]>([]);
  const [draftFlag, setDraftFlag] = useState('');

  const addFlag = () => {
    const v = draftFlag.trim();
    if (!v || riskFlags.includes(v)) return;
    setRiskFlags([...riskFlags, v]);
    setDraftFlag('');
  };

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
        risk_flags: riskFlags,
        constraints: { description },
      });
      toast.success('Escenario creado.');
      router.push('/escenarios');
    } catch {
      toast.error('No se pudo crear el escenario en el backend.');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || userRole === 'student') return null;

  return (
    <div className="container mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
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
          <CardContent className="space-y-6">
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
                <Label>Severidad inicial · {initialSeverity} / 5</Label>
                <Slider
                  value={[initialSeverity]}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={(value) => setInitialSeverity(value[0] as SeverityLevel)}
                />
                <div className="pt-1">
                  <SeverityGauge level={initialSeverity} size="md" showLabel />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Banderas de riesgo</Label>
                <span className="text-xs text-muted-foreground">{riskFlags.length} activas</span>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex flex-wrap gap-2">
                  {riskFlags.length === 0
                    ? <span className="text-xs text-muted-foreground">Sin banderas.</span>
                    : riskFlags.map((flag, index) => (
                      <span key={`${flag}-${index}`} className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs">
                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                        {flag}
                        <button
                          type="button"
                          onClick={() => setRiskFlags(riskFlags.filter((_, i) => i !== index))}
                          className="hover:text-destructive"
                          aria-label="Quitar"
                        >×</button>
                      </span>
                    ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Input
                    value={draftFlag}
                    onChange={(e) => setDraftFlag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFlag(); } }}
                    placeholder="ej. insomnio"
                    className="h-10"
                  />
                  <Button type="button" variant="outline" onClick={addFlag} className="h-10 w-10 p-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push('/escenarios')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Crear escenario'}
          </Button>
        </div>
      </form>
    </div>
  );
}
