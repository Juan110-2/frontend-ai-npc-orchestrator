'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiStepForm, StepContent, StepActions } from '@/components/multi-step-form';
import { SeverityBadge } from '@/components/severity-badge';
import { InterventionBadge } from '@/components/intervention-badge';
import { INTERVENTION_LABELS, SEVERITY_LABELS } from '@/lib/types';
import type { SeverityLevel, InterventionCategory, Trigger, Regulator, InterventionReaction, ClosureRule } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const steps = [
  { id: 'basic', title: 'Informacion Basica', description: 'Nombre y objetivo' },
  { id: 'triggers', title: 'Disparadores', description: 'Activadores emocionales' },
  { id: 'regulators', title: 'Reguladores', description: 'Tecnicas de regulacion' },
  { id: 'behavior', title: 'Comportamiento', description: 'Rango y reacciones' },
  { id: 'closure', title: 'Cierre', description: 'Criterios de finalizacion' },
];

const interventionCategories: InterventionCategory[] = [
  'supportive', 'neutral', 'confusing', 'indifferent', 'invalidating', 'inappropriate', 'risk'
];

export default function NewProtopersonaPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [pedagogicalObjective, setPedagogicalObjective] = useState('');
  const [description, setDescription] = useState('');
  
  const [triggers, setTriggers] = useState<Omit<Trigger, 'id'>[]>([
    { name: '', description: '', severityImpact: 1 }
  ]);
  
  const [regulators, setRegulators] = useState<Omit<Regulator, 'id'>[]>([
    { name: '', description: '', effectiveness: 0.5 }
  ]);
  
  const [behaviorMin, setBehaviorMin] = useState<SeverityLevel>(1);
  const [behaviorMax, setBehaviorMax] = useState<SeverityLevel>(4);
  const [behaviorDescription, setBehaviorDescription] = useState('');
  
  const [reactions, setReactions] = useState<Omit<InterventionReaction, 'examples'>[]>(
    interventionCategories.map(cat => ({
      category: cat,
      severityChange: cat === 'supportive' ? -1 : cat === 'neutral' ? 0 : 1,
      responsePattern: '',
    }))
  );
  
  const [closureRules, setClosureRules] = useState<Omit<ClosureRule, 'id'>[]>([
    { criteria: 'improvement', threshold: 2, description: '' },
    { criteria: 'deterioration', threshold: 4, description: '' },
    { criteria: 'risk', threshold: 1, description: '' },
  ]);

  const addTrigger = () => {
    setTriggers([...triggers, { name: '', description: '', severityImpact: 1 }]);
  };

  const removeTrigger = (index: number) => {
    setTriggers(triggers.filter((_, i) => i !== index));
  };

  const updateTrigger = (index: number, field: keyof Omit<Trigger, 'id'>, value: string | number) => {
    const updated = [...triggers];
    updated[index] = { ...updated[index], [field]: value };
    setTriggers(updated);
  };

  const addRegulator = () => {
    setRegulators([...regulators, { name: '', description: '', effectiveness: 0.5 }]);
  };

  const removeRegulator = (index: number) => {
    setRegulators(regulators.filter((_, i) => i !== index));
  };

  const updateRegulator = (index: number, field: keyof Omit<Regulator, 'id'>, value: string | number) => {
    const updated = [...regulators];
    updated[index] = { ...updated[index], [field]: value };
    setRegulators(updated);
  };

  const updateReaction = (category: InterventionCategory, field: 'severityChange' | 'responsePattern', value: number | string) => {
    setReactions(reactions.map(r => 
      r.category === category ? { ...r, [field]: value } : r
    ));
  };

  const updateClosureRule = (criteria: string, field: 'threshold' | 'description', value: number | string) => {
    setClosureRules(closureRules.map(r =>
      r.criteria === criteria ? { ...r, [field]: value } : r
    ));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Protopersona creada exitosamente');
    router.push('/protopersonas');
  };

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

      <h1 className="text-2xl font-semibold tracking-tight">Nueva Protopersona</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Define un molde conductual para simulaciones de pacientes
      </p>

      <div className="mt-8">
        <MultiStepForm steps={steps} currentStep={currentStep}>
          {/* Step 1: Basic Info */}
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Informacion Basica</CardTitle>
                <CardDescription>
                  Define el nombre y objetivo pedagogico de esta protopersona
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StepContent>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      placeholder="ej. Paciente Ansioso"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Un nombre descriptivo que identifique el tipo de paciente simulado
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="objective">Objetivo Pedagogico *</Label>
                    <Textarea
                      id="objective"
                      placeholder="ej. Entrenar la identificacion de patrones de ansiedad generalizada..."
                      value={pedagogicalObjective}
                      onChange={(e) => setPedagogicalObjective(e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Que habilidades o competencias se busca desarrollar con esta simulacion
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripcion (opcional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Descripcion adicional del perfil conductual..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <StepActions 
                    onNext={handleNext} 
                    isFirstStep 
                  />
                </StepContent>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Triggers */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Disparadores</CardTitle>
                <CardDescription>
                  Situaciones que activan o intensifican la respuesta emocional del paciente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StepContent>
                  <div className="space-y-4">
                    {triggers.map((trigger, index) => (
                      <div key={index} className="rounded-lg border border-border p-4">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-sm font-medium">Disparador {index + 1}</span>
                          {triggers.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => removeTrigger(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label>Nombre</Label>
                            <Input
                              placeholder="ej. Incertidumbre"
                              value={trigger.name}
                              onChange={(e) => updateTrigger(index, 'name', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Descripcion</Label>
                            <Textarea
                              placeholder="Describe la situacion disparadora..."
                              value={trigger.description}
                              onChange={(e) => updateTrigger(index, 'description', e.target.value)}
                              rows={2}
                            />
                          </div>
                          <div>
                            <Label>Impacto en Severidad (+1 a +3)</Label>
                            <Select
                              value={String(trigger.severityImpact)}
                              onValueChange={(v) => updateTrigger(index, 'severityImpact', Number(v))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">+1 (Leve)</SelectItem>
                                <SelectItem value="2">+2 (Moderado)</SelectItem>
                                <SelectItem value="3">+3 (Severo)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" onClick={addTrigger} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Disparador
                  </Button>

                  <StepActions onBack={handleBack} onNext={handleNext} />
                </StepContent>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Regulators */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Reguladores</CardTitle>
                <CardDescription>
                  Tecnicas y recursos que ayudan a reducir la intensidad emocional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StepContent>
                  <div className="space-y-4">
                    {regulators.map((regulator, index) => (
                      <div key={index} className="rounded-lg border border-border p-4">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-sm font-medium">Regulador {index + 1}</span>
                          {regulators.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => removeRegulator(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label>Nombre</Label>
                            <Input
                              placeholder="ej. Respiracion consciente"
                              value={regulator.name}
                              onChange={(e) => updateRegulator(index, 'name', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Descripcion</Label>
                            <Textarea
                              placeholder="Describe la tecnica de regulacion..."
                              value={regulator.description}
                              onChange={(e) => updateRegulator(index, 'description', e.target.value)}
                              rows={2}
                            />
                          </div>
                          <div>
                            <Label>Efectividad: {Math.round(regulator.effectiveness * 100)}%</Label>
                            <Slider
                              value={[regulator.effectiveness * 100]}
                              onValueChange={(v) => updateRegulator(index, 'effectiveness', v[0] / 100)}
                              max={100}
                              step={5}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" onClick={addRegulator} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Regulador
                  </Button>

                  <StepActions onBack={handleBack} onNext={handleNext} />
                </StepContent>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Behavior & Reactions */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Comportamiento y Reacciones</CardTitle>
                <CardDescription>
                  Define el rango de severidad y como reacciona a diferentes intervenciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StepContent>
                  {/* Behavior Range */}
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-medium mb-4">Rango de Comportamiento</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Severidad Minima</Label>
                        <Select
                          value={String(behaviorMin)}
                          onValueChange={(v) => setBehaviorMin(Number(v) as SeverityLevel)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {([1, 2, 3, 4, 5] as SeverityLevel[]).map((level) => (
                              <SelectItem key={level} value={String(level)}>
                                {level} - {SEVERITY_LABELS[level]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Severidad Maxima</Label>
                        <Select
                          value={String(behaviorMax)}
                          onValueChange={(v) => setBehaviorMax(Number(v) as SeverityLevel)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {([1, 2, 3, 4, 5] as SeverityLevel[]).map((level) => (
                              <SelectItem key={level} value={String(level)}>
                                {level} - {SEVERITY_LABELS[level]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>Descripcion del Rango</Label>
                      <Textarea
                        placeholder="Describe el rango de comportamiento esperado..."
                        value={behaviorDescription}
                        onChange={(e) => setBehaviorDescription(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Vista previa:</span>
                      <SeverityBadge level={behaviorMin} size="sm" />
                      <span className="text-muted-foreground">a</span>
                      <SeverityBadge level={behaviorMax} size="sm" />
                    </div>
                  </div>

                  {/* Intervention Reactions */}
                  <div>
                    <h4 className="font-medium mb-4">Reacciones por Tipo de Intervencion</h4>
                    <div className="space-y-3">
                      {reactions.map((reaction) => (
                        <div key={reaction.category} className="rounded-lg border border-border p-4">
                          <div className="flex items-center justify-between mb-3">
                            <InterventionBadge category={reaction.category} />
                            <Select
                              value={String(reaction.severityChange)}
                              onValueChange={(v) => updateReaction(reaction.category, 'severityChange', Number(v))}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="-2">-2 (Mejora mucho)</SelectItem>
                                <SelectItem value="-1">-1 (Mejora)</SelectItem>
                                <SelectItem value="0">0 (Sin cambio)</SelectItem>
                                <SelectItem value="1">+1 (Empeora)</SelectItem>
                                <SelectItem value="2">+2 (Empeora mucho)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Input
                            placeholder="Patron de respuesta esperado..."
                            value={reaction.responsePattern}
                            onChange={(e) => updateReaction(reaction.category, 'responsePattern', e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <StepActions onBack={handleBack} onNext={handleNext} />
                </StepContent>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Closure Rules */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Criterios de Cierre</CardTitle>
                <CardDescription>
                  Condiciones que determinan cuando debe finalizar una sesion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StepContent>
                  <div className="rounded-lg bg-muted/50 p-4 flex gap-3">
                    <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Importante</p>
                      <p className="text-muted-foreground">
                        Estos criterios ayudan al sistema a determinar automaticamente cuando una sesion 
                        ha alcanzado un punto de cierre apropiado.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {closureRules.map((rule) => (
                      <div key={rule.criteria} className="rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className={cn(
                            'text-sm font-medium capitalize',
                            rule.criteria === 'improvement' && 'text-success',
                            rule.criteria === 'deterioration' && 'text-warning',
                            rule.criteria === 'risk' && 'text-destructive'
                          )}>
                            {rule.criteria === 'improvement' && 'Mejoria'}
                            {rule.criteria === 'deterioration' && 'Deterioro'}
                            {rule.criteria === 'risk' && 'Riesgo'}
                          </span>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Umbral:</Label>
                            <Input
                              type="number"
                              className="w-20"
                              value={rule.threshold}
                              onChange={(e) => updateClosureRule(rule.criteria, 'threshold', Number(e.target.value))}
                              min={1}
                              max={5}
                            />
                          </div>
                        </div>
                        <Textarea
                          placeholder={`Describe cuando se considera ${
                            rule.criteria === 'improvement' ? 'mejoria' :
                            rule.criteria === 'deterioration' ? 'deterioro' : 'riesgo'
                          }...`}
                          value={rule.description}
                          onChange={(e) => updateClosureRule(rule.criteria, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>

                  <StepActions 
                    onBack={handleBack} 
                    onSubmit={handleSubmit}
                    isLastStep
                    isSubmitting={isSubmitting}
                    submitLabel="Crear Protopersona"
                  />
                </StepContent>
              </CardContent>
            </Card>
          )}
        </MultiStepForm>
      </div>
    </div>
  );
}
