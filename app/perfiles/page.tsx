'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, UserCircle, MoreHorizontal, Eye, Pencil, Copy, Trash2, Filter, GitBranch } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/ui-states';
import { mockPerfiles, mockProtopersonas } from '@/lib/mock-data';
import type { Perfil } from '@/lib/types';
import { toast } from 'sonner';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function PerfilCard({ 
  perfil, 
  onClone 
}: { 
  perfil: Perfil; 
  onClone: (perfil: Perfil) => void;
}) {
  const router = useRouter();

  return (
    <Card className="group transition-all hover:border-border/80 hover:shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <UserCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Link 
                href={`/perfiles/${perfil.id}`}
                className="font-medium text-foreground hover:underline"
              >
                {perfil.name}
              </Link>
              <div className="mt-0.5 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {perfil.protopersonaName}
                </Badge>
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
              <DropdownMenuItem onClick={() => router.push(`/perfiles/${perfil.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/perfiles/${perfil.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onClone(perfil)}>
                <Copy className="mr-2 h-4 w-4" />
                Clonar perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/chat?perfil=${perfil.id}`)}>
                <UserCircle className="mr-2 h-4 w-4" />
                Iniciar sesion
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Contextual Data Preview */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {perfil.contextualData.age && (
            <div>
              <span className="text-muted-foreground">Edad:</span>{' '}
              <span className="font-medium">{perfil.contextualData.age} anos</span>
            </div>
          )}
          {perfil.contextualData.gender && (
            <div>
              <span className="text-muted-foreground">Genero:</span>{' '}
              <span className="font-medium">{perfil.contextualData.gender}</span>
            </div>
          )}
          {perfil.contextualData.occupation && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Ocupacion:</span>{' '}
              <span className="font-medium">{perfil.contextualData.occupation}</span>
            </div>
          )}
        </div>

        {perfil.notes && (
          <p className="mt-3 text-xs text-muted-foreground line-clamp-2">
            {perfil.notes}
          </p>
        )}

        {/* Clone indicator */}
        {perfil.clonedFromName && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <GitBranch className="h-3 w-3" />
            Clonado de: {perfil.clonedFromName}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatDate(perfil.updatedAt)}
          </span>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/perfiles/${perfil.id}`}>
              Ver detalle
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PerfilesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [perfilToClone, setPerfilToClone] = useState<Perfil | null>(null);
  const [cloneName, setCloneName] = useState('');

  const filteredPerfiles = mockPerfiles.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.protopersonaName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCloneClick = (perfil: Perfil) => {
    setPerfilToClone(perfil);
    setCloneName(`${perfil.name} - Copia`);
    setCloneDialogOpen(true);
  };

  const handleClone = () => {
    if (!perfilToClone) return;
    
    toast.success(`Perfil "${cloneName}" clonado exitosamente`);
    setCloneDialogOpen(false);
    setPerfilToClone(null);
    setCloneName('');
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Perfiles"
        description="Instancias de protopersonas con datos contextuales especificos"
        action={{
          label: 'Nuevo Perfil',
          onClick: () => router.push('/perfiles/new'),
          icon: <Plus className="mr-2 h-4 w-4" />,
        }}
      />

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar perfiles..."
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
      {filteredPerfiles.length === 0 ? (
        <EmptyState
          icon={<UserCircle className="h-6 w-6 text-muted-foreground" />}
          title="No hay perfiles"
          description={searchQuery 
            ? "No se encontraron perfiles con ese criterio de busqueda" 
            : "Crea tu primer perfil seleccionando una protopersona como base"
          }
          action={!searchQuery ? {
            label: 'Crear Perfil',
            onClick: () => router.push('/perfiles/new'),
            icon: <Plus className="mr-2 h-4 w-4" />,
          } : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPerfiles.map((perfil) => (
            <PerfilCard 
              key={perfil.id} 
              perfil={perfil} 
              onClone={handleCloneClick}
            />
          ))}
        </div>
      )}

      {/* Clone Dialog */}
      <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clonar Perfil</DialogTitle>
            <DialogDescription>
              Crea una copia de este perfil para modificar sin afectar el original.
              El nuevo perfil mantendrá trazabilidad con el perfil de origen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clone-name">Nombre del nuevo perfil</Label>
              <Input
                id="clone-name"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
              />
            </div>
            {perfilToClone && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="text-muted-foreground">
                  Se clonara desde: <span className="font-medium text-foreground">{perfilToClone.name}</span>
                </p>
                <p className="mt-1 text-muted-foreground">
                  Basado en: <span className="font-medium text-foreground">{perfilToClone.protopersonaName}</span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleClone}>
              <Copy className="mr-2 h-4 w-4" />
              Clonar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
