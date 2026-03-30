'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Brain, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { mockProtopersonas } from '@/lib/mock-data';
import type { Protopersona } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function NewPerfilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromProtopersona = searchParams.get('from');
  
  const [selectedProtopersona, setSelectedProtopersona] = useState<Protopersona | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [occupation, setOccupation] = useState('');
  const [familyContext, setFamilyContext] = useState('');
  const [socialContext, setSocialContext] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [notes, setNotes] = useState('');
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([
    { key: '', value: '' }
  ]);

  useEffect(() => {
    if (fromProtopersona) {
      const proto = mockProtopersonas.find(p => p.id === fromProtopersona);
      if (proto) {
        setSelectedProtopersona(proto);
      }
    }
  }, [fromProtopersona]);

  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], [field]: value };
    setCustomFields(updated);
  };

  const handleSubmit = async () => {
    if (!selectedProtopersona) {
      toast.error('Por favor selecciona una protopersona');
      return;
    }
    if (!name) {
      toast.error('El nombre es requerido');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Perfil creado exitosamente');
    router.push('/perfiles');
  };

  return (
    <div className="p-8">
      {/* Back link */}
      <Link 
        href="/perfiles" 
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Volver a perfiles
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Nuevo Perfil</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Crea una instancia de paciente a partir de una protopersona
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Protopersona Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Seleccionar Protopersona</CardTitle>
              <CardDescription>
                Elige el molde conductual que servira como base para este perfil
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedProtopersona ? (
                <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Brain className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{selectedProtopersona.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {selectedProtopersona.pedagogicalObjective}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedProtopersona(null)}
                    >
                      Cambiar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {mockProtopersonas.map((proto) => (
                    <button
                      key={proto.id}
                      onClick={() => setSelectedProtopersona(proto)}
                      className={cn(
                        'w-full rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent/50',
                        selectedProtopersona?.id === proto.id && 'border-primary bg-primary/5'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <Brain className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{proto.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {proto.pedagogicalObjective}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">v{proto.version}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informacion del Perfil</CardTitle>
              <CardDescription>
                Define los datos identificatorios de este paciente simulado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Perfil *</Label>
                <Input
                  id="name"
                  placeholder="ej. Maria Garcia - Ansiedad Laboral"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="age">Edad</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="ej. 34"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Genero</Label>
                  <Input
                    id="gender"
                    placeholder="ej. Femenino"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Ocupacion</Label>
                <Input
                  id="occupation"
                  placeholder="ej. Gerente de proyectos en empresa tecnologica"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contextual Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contexto</CardTitle>
              <CardDescription>
                Informacion contextual que influye en el comportamiento del paciente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="family">Contexto Familiar</Label>
                <Textarea
                  id="family"
                  placeholder="ej. Casada, dos hijos pequenos..."
                  value={familyContext}
                  onChange={(e) => setFamilyContext(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="social">Contexto Social</Label>
                <Textarea
                  id="social"
                  placeholder="ej. Red de apoyo limitada, familia extendida en otra ciudad..."
                  value={socialContext}
                  onChange={(e) => setSocialContext(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medical">Historia Medica</Label>
                <Textarea
                  id="medical"
                  placeholder="ej. Sin antecedentes psiquiatricos previos..."
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Custom Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campos Personalizados</CardTitle>
              <CardDescription>
                Agrega informacion adicional especifica para este perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {customFields.map((field, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Nombre del campo"
                      value={field.key}
                      onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Valor"
                      value={field.value}
                      onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                    />
                  </div>
                  {customFields.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeCustomField(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button variant="outline" onClick={addCustomField} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Campo
              </Button>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notas</CardTitle>
              <CardDescription>
                Observaciones adicionales sobre este perfil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Notas clinicas, consideraciones especiales, etc..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Protopersona</span>
                  {selectedProtopersona ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <span className="text-muted-foreground">Pendiente</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Nombre</span>
                  {name ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <span className="text-muted-foreground">Pendiente</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Datos contextuales</span>
                  {(age || gender || occupation) ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <span className="text-muted-foreground">Opcional</span>
                  )}
                </div>
              </div>

              <Separator />

              <Button 
                className="w-full" 
                onClick={handleSubmit}
                disabled={!selectedProtopersona || !name || isSubmitting}
              >
                {isSubmitting ? 'Creando...' : 'Crear Perfil'}
              </Button>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ayuda</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                Un <strong>Perfil</strong> es una instancia especifica de una protopersona 
                con datos contextuales que personalizan la simulacion.
              </p>
              <p>
                Los datos que agregues aqui se utilizaran para dar contexto 
                al modelo durante las sesiones de chat.
              </p>
              <p>
                Puedes clonar perfiles existentes para crear variaciones 
                sin perder la trazabilidad.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function NewPerfilPage() {
  return (
    <Suspense fallback={<div className="p-8">Cargando...</div>}>
      <NewPerfilContent />
    </Suspense>
  );
}
