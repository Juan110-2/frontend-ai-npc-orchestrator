'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Play, Square, MoreHorizontal, Eye, MessageSquare,
  ClipboardCheck, Clock, Download, FileText, Loader2, CheckCircle2, PlayCircle,
  UserCheck, UsersRound, Check,
} from 'lucide-react';
import { buildConversationHTML } from '@/lib/export-html';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageHeader } from '@/components/page-header';
import { LoadingState } from '@/components/ui-states';
import { SeverityGauge, SeverityRange } from '@/components/severity-gauge';
import type { Sesion, SessionStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  listProfiles, listScenarios, listSessions, listEvaluations,
  exportConversationJSON, startSession, listStudents, adminListUsers,
  type BackendProfile, type BackendScenario, type BackendSession, type BackendUserProfile,
  type EvaluationListItem, type TimeSource,
} from '@/lib/backend-api';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { Paginator, PAGE_SIZE } from '@/components/paginator';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(date);
}

function formatDurationSecs(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function formatDuration(seconds: number, source: TimeSource): string {
  if (source === 'unavailable') return '—';
  if (source === 'none') return '—';
  if (source === 'estimated') return `~${formatDurationSecs(seconds)}`;
  return formatDurationSecs(seconds);
}

const statusConfig: Record<SessionStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: typeof Play }> = {
  active: { label: 'Activa', variant: 'default', icon: Play },
  completed: { label: 'Completada', variant: 'outline', icon: Square },
  terminated: { label: 'Terminada', variant: 'destructive', icon: Square },
};

// ─── Dialog nueva sesión ─────────────────────────────────────────────────────

type AssignMode = 'self' | 'students'

function NuevaSesionDialog({
  profiles,
  scenarios,
  onSessionCreated,
}: {
  profiles: BackendProfile[]
  scenarios: BackendScenario[]
  onSessionCreated?: () => void
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profileSearch, setProfileSearch] = useState('');
  const [scenarioSearch, setScenarioSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<BackendProfile | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<BackendScenario | null>(null);
  const [assignMode, setAssignMode] = useState<AssignMode>('self');
  const [students, setStudents] = useState<BackendUserProfile[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentQuery, setStudentQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createdSession, setCreatedSession] = useState<BackendSession | null>(null);

  const reset = () => {
    setSelectedProfile(null);
    setSelectedScenario(null);
    setProfileSearch('');
    setScenarioSearch('');
    setAssignMode('self');
    setStudents([]);
    setStudentQuery('');
    setSelectedStudentIds([]);
    setCreatedSession(null);
  };

  useEffect(() => {
    if (!open || assignMode !== 'students') return;
    if (students.length > 0 || studentsLoading) return;
    void (async () => {
      try {
        setStudentsLoading(true);
        setStudents(await listStudents());
      } catch {
        toast.error('No se pudieron cargar los estudiantes.');
      } finally {
        setStudentsLoading(false);
      }
    })();
  }, [open, assignMode, students.length, studentsLoading]);

  const filteredProfiles = profiles.filter(p =>
    !profileSearch.trim() ||
    p.name.toLowerCase().includes(profileSearch.toLowerCase()) ||
    p.description.toLowerCase().includes(profileSearch.toLowerCase())
  );

  const filteredScenarios = scenarios.filter(s =>
    !scenarioSearch.trim() ||
    s.name.toLowerCase().includes(scenarioSearch.toLowerCase())
  );

  const filteredStudents = students.filter(s => {
    if (!studentQuery.trim()) return true;
    const q = studentQuery.toLowerCase();
    return s.full_name?.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  const toggleStudent = (id: string) =>
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const canCreate = !!selectedProfile && !!selectedScenario &&
    (assignMode === 'self' || selectedStudentIds.length > 0);

  const handleCreate = async () => {
    if (!selectedProfile || !selectedScenario) return;
    setCreating(true);
    try {
      if (assignMode === 'self') {
        const session = await startSession({
          profile_id: selectedProfile.id,
          scenario_id: selectedScenario.id,
        });
        setCreatedSession(session);
        onSessionCreated?.();
      } else {
        await Promise.all(
          selectedStudentIds.map(studentId =>
            startSession({ profile_id: selectedProfile.id, scenario_id: selectedScenario.id, user_id: studentId })
          )
        );
        toast.success(`Sesiones asignadas a ${selectedStudentIds.length} estudiante(s).`);
        setOpen(false);
        reset();
        onSessionCreated?.();
      }
    } catch (err) {
      toast.error('No se pudo iniciar la sesión: ' + String(err));
    } finally {
      setCreating(false);
    }
  };

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nueva sesión
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full !max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {createdSession ? '¡Sesión creada!' : 'Nueva sesión de simulación'}
          </DialogTitle>
          <DialogDescription>
            {createdSession
              ? '¿Quieres abrirla ahora o la guardas para después?'
              : 'Selecciona un perfil y un escenario para iniciar la práctica.'}
          </DialogDescription>
        </DialogHeader>

        {createdSession ? (
          <>
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">
                Perfil <strong>{selectedProfile?.name}</strong> · Escenario <strong>{selectedScenario?.name}</strong>
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>
                Guardar y cerrar
              </Button>
              <Button onClick={() => router.push(`/chat?sesion=${createdSession.id}`)}>
                <PlayCircle className="mr-2 h-4 w-4" /> Abrir chat ahora
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Perfil */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Perfil</p>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar perfil..."
                    value={profileSearch}
                    onChange={e => setProfileSearch(e.target.value)}
                    className="h-8 pl-8 text-sm"
                  />
                </div>
                <ScrollArea className="h-56 rounded-md border">
                  <div className="space-y-0.5 p-1">
                    {filteredProfiles.length === 0 ? (
                      <p className="py-8 text-center text-xs text-muted-foreground">Sin resultados</p>
                    ) : filteredProfiles.map(p => {
                      const traits = (p.traits ?? {}) as Record<string, unknown>;
                      const age = traits.age as number | undefined;
                      const behavior = (p.behavior ?? {}) as Record<string, unknown>;
                      const bMin = behavior.behavior_min as number | undefined;
                      const bMax = behavior.behavior_max as number | undefined;
                      const personality = (traits.personality as string[]) ?? [];
                      const commStyle = (traits.communication_style as string[]) ?? [];
                      const isSelected = selectedProfile?.id === p.id;

                      const MAX_TAGS = 3;
                      const persShown = personality.slice(0, MAX_TAGS);
                      const persExtra = personality.length - persShown.length;
                      const commShown = commStyle.slice(0, MAX_TAGS);
                      const commExtra = commStyle.length - commShown.length;

                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedProfile(isSelected ? null : p)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-md border border-transparent p-2.5 text-left transition-colors hover:border-border hover:bg-muted/40',
                            isSelected && 'border-primary/40 bg-primary/5'
                          )}
                        >
                          <div className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          )}>
                            {initials(p.name) || '·'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {age ? `${age} años` : 'Edad sin definir'}
                            </p>
                            {persShown.length > 0 && (
                              <div className="mt-0.5 flex items-center gap-1">
                                <div className="flex min-w-0 flex-1 gap-1 overflow-hidden">
                                  {persShown.map(t => (
                                    <span key={t} className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                                  ))}
                                </div>
                                {persExtra > 0 && (
                                  <span className="shrink-0 rounded border border-muted-foreground/30 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">+{persExtra}</span>
                                )}
                              </div>
                            )}
                            {commShown.length > 0 && (
                              <div className="mt-0.5 flex items-center gap-1">
                                <div className="flex min-w-0 flex-1 gap-1 overflow-hidden">
                                  {commShown.map(t => (
                                    <span key={t} className="shrink-0 rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-700 dark:text-sky-400">{t}</span>
                                  ))}
                                </div>
                                {commExtra > 0 && (
                                  <span className="shrink-0 rounded border border-sky-400/40 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-400">+{commExtra}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col items-end justify-center gap-1">
                            {bMin != null && bMax != null && (
                              <SeverityRange min={bMin} max={bMax} size="sm" showLabel />
                            )}
                          </div>
                          {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Escenario */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Escenario</p>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar escenario..."
                    value={scenarioSearch}
                    onChange={e => setScenarioSearch(e.target.value)}
                    className="h-8 pl-8 text-sm"
                  />
                </div>
                <ScrollArea className="h-56 rounded-md border">
                  <div className="space-y-0.5 p-1">
                    {filteredScenarios.length === 0 ? (
                      <p className="py-8 text-center text-xs text-muted-foreground">Sin resultados</p>
                    ) : filteredScenarios.map(s => {
                      const isSelected = selectedScenario?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelectedScenario(isSelected ? null : s)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-md border border-transparent p-2.5 text-left transition-colors hover:border-border hover:bg-muted/40',
                            isSelected && 'border-primary/40 bg-primary/5'
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-snug">{s.name}</p>
                            {s.context && (
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{s.context}</p>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col items-end justify-center gap-0.5">
                            <span className="text-[10px] text-muted-foreground/60">Sev · {s.severity}</span>
                            <SeverityGauge level={s.severity} size="sm" />
                          </div>
                          {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Asignación */}
            <div className="space-y-3">
              <p className="text-sm font-medium">¿Para quién es esta sesión?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAssignMode('self')}
                  className={cn(
                    'flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-colors',
                    assignMode === 'self' ? 'border-primary bg-primary/5' : 'hover:border-primary/50 hover:bg-muted/40'
                  )}
                >
                  <UserCheck className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Probar yo mismo</p>
                  <p className="text-xs text-muted-foreground">Crea la sesión para tu propio uso.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setAssignMode('students')}
                  className={cn(
                    'flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-colors',
                    assignMode === 'students' ? 'border-primary bg-primary/5' : 'hover:border-primary/50 hover:bg-muted/40'
                  )}
                >
                  <UsersRound className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Asignar a estudiantes</p>
                  <p className="text-xs text-muted-foreground">Se crea una sesión por cada estudiante.</p>
                </button>
              </div>

              {assignMode === 'students' && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre o correo..."
                      value={studentQuery}
                      onChange={e => setStudentQuery(e.target.value)}
                      className="h-8 pl-8 text-sm"
                    />
                  </div>
                  <ScrollArea className="h-44 rounded-md border">
                    <div className="divide-y">
                      {studentsLoading ? (
                        <div className="flex items-center justify-center gap-2 p-4 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Cargando estudiantes...</span>
                        </div>
                      ) : filteredStudents.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground">No se encontraron estudiantes.</p>
                      ) : filteredStudents.map(s => {
                        const selected = selectedStudentIds.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleStudent(s.id)}
                            className={cn(
                              'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40',
                              selected && 'bg-primary/5'
                            )}
                          >
                            <div className={cn(
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                              selected ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
                            )}>
                              {selected && <Check className="h-3 w-3" />}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{s.full_name ?? '—'}</p>
                              <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  {selectedStudentIds.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {selectedStudentIds.length} estudiante(s) seleccionado(s)
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button disabled={!canCreate || creating} onClick={handleCreate}>
                {creating
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <PlayCircle className="mr-2 h-4 w-4" />}
                {assignMode === 'students'
                  ? `Asignar a ${selectedStudentIds.length || ''} estudiante(s)`
                  : 'Iniciar sesión'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Tarjeta de sesión ────────────────────────────────────────────────────────

function SesionCard({ sesion }: { sesion: SesionWithOwner }) {
  const router = useRouter();
  const { userRole } = useAuth();
  const canExport = userRole === 'admin' || userRole === 'teacher';
  const config = statusConfig[sesion.status];
  const StatusIcon = config.icon;

  return (
    <Card className="group transition-all hover:border-border/80 hover:shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              sesion.status === 'active' && 'bg-success/10',
              sesion.status === 'completed' && 'bg-muted',
              sesion.status === 'terminated' && 'bg-destructive/10'
            )}>
              <StatusIcon className={cn(
                'h-5 w-5',
                sesion.status === 'active' && 'text-success',
                sesion.status === 'completed' && 'text-muted-foreground',
                sesion.status === 'terminated' && 'text-destructive'
              )} />
            </div>
            <div>
              <Link
                href={sesion.status === 'active' ? `/chat?sesion=${sesion.id}` : `/evaluacion?sesion=${sesion.id}`}
                className="font-medium text-foreground hover:underline"
              >
                {sesion.perfilName}
              </Link>
              <p className="text-sm text-muted-foreground">{sesion.escenarioName}</p>
              {sesion.assignedToName && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <UserCheck className="h-3 w-3 shrink-0" />
                  {sesion.assignedToName}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(sesion.status === 'active' ? `/chat?sesion=${sesion.id}` : `/evaluacion?sesion=${sesion.id}`)}>
                <Eye className="mr-2 h-4 w-4" /> Ver detalle
              </DropdownMenuItem>
              {sesion.status === 'active' && (
                <DropdownMenuItem onClick={() => router.push(`/chat?sesion=${sesion.id}`)}>
                  <MessageSquare className="mr-2 h-4 w-4" /> Continuar chat
                </DropdownMenuItem>
              )}
              {(sesion.status === 'completed' || sesion.status === 'terminated') && (
                <DropdownMenuItem onClick={() => router.push(`/evaluacion?sesion=${sesion.id}`)}>
                  <ClipboardCheck className="mr-2 h-4 w-4" /> Evaluar
                </DropdownMenuItem>
              )}
              {canExport && (
                <>
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        const { filename, content } = await exportConversationJSON(sesion.id);
                        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = filename; a.click();
                        URL.revokeObjectURL(url);
                      } catch (e) {
                        toast.error('No se pudo exportar: ' + String(e));
                      }
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" /> Exportar (.txt)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        const html = await buildConversationHTML(sesion.id);
                        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const win = window.open(url, '_blank');
                        if (!win) { toast.error('Permite ventanas emergentes para exportar.'); return; }
                        setTimeout(() => URL.revokeObjectURL(url), 30000);
                      } catch (e) {
                        toast.error('No se pudo generar la vista: ' + String(e));
                      }
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" /> Vista previa / PDF
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SeverityGauge level={sesion.state.currentSeverity} size="sm" showValue />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDuration(sesion.state.totalDuration, sesion.timeSource)}
            </div>
          </div>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold">{sesion.state.turnCount}</p>
            <p className="text-xs text-muted-foreground">Turnos</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{sesion.state.coherenceScore}%</p>
            <p className="text-xs text-muted-foreground">Coherencia</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{sesion.state.activeRiskFlags.length}</p>
            <p className="text-xs text-muted-foreground">Alertas</p>
          </div>
        </div>

        {sesion.modelName && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Modelo:</span>
            <Badge variant="secondary" className="text-xs">{sesion.modelName}</Badge>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{formatDate(sesion.startedAt)}</span>
          <Button variant="ghost" size="sm" asChild>
            <Link href={sesion.status === 'active' ? `/chat?sesion=${sesion.id}` : `/evaluacion?sesion=${sesion.id}`}>
              {sesion.status === 'active' ? 'Continuar' : 'Ver detalle'}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

type SesionWithOwner = Sesion & {
  userId: string | null
  assignedBy: string | null
  assignedToName: string | null
  timeSource: TimeSource
}

function mapSession(
  session: BackendSession,
  profileMap: Map<string, BackendProfile>,
  scenarioMap: Map<string, BackendScenario>,
  studentMap: Map<string, BackendUserProfile>,
  evalMap: Map<string, EvaluationListItem>,
): SesionWithOwner {
  const profile = profileMap.get(session.profile_id);
  const scenario = scenarioMap.get(session.scenario_id);
  const startedAt = new Date(session.started_at);
  const endedAt = session.ended_at ? new Date(session.ended_at) : undefined;
  const metrics = evalMap.get(session.id)?.automatic_metrics;
  const riskCount = metrics?.risk_alerts_detected ?? 0;
  return {
    id: session.id,
    perfilId: session.profile_id,
    perfilName: profile?.name || 'Perfil no encontrado',
    escenarioId: session.scenario_id,
    escenarioName: scenario?.name || 'Escenario no encontrado',
    status: session.status,
    modelName: session.last_ai_model ?? metrics?.last_ai_model ?? undefined,
    state: {
      currentSeverity: Math.max(0, Math.min(5, session.current_severity)),
      activeRiskFlags: Array(riskCount).fill('risk'),
      turnCount: metrics?.turns_trainee ?? 0,
      totalDuration: session.accumulated_seconds ?? 0,
      coherenceScore: 100,
      interventionHistory: [],
    },
    messages: [],
    startedAt,
    endedAt,
    userId: session.user_id,
    assignedBy: session.assigned_by,
    assignedToName: session.user_id
      ? (studentMap.get(session.user_id)?.full_name ?? studentMap.get(session.user_id)?.email ?? null)
      : null,
    timeSource: session.time_source,
  };
}

export default function SesionesPage() {
  const { userRole, user } = useAuth();
  const currentUserId = user?.id ?? null;

  // ── datos de referencia (cargados una vez) ─────────────────────────────────
  const [availableProfiles, setAvailableProfiles] = useState<BackendProfile[]>([]);
  const [availableScenarios, setAvailableScenarios] = useState<BackendScenario[]>([]);
  const [profileMap, setProfileMap] = useState<Map<string, BackendProfile>>(new Map());
  const [scenarioMap, setScenarioMap] = useState<Map<string, BackendScenario>>(new Map());
  const [studentMap, setStudentMap] = useState<Map<string, BackendUserProfile>>(new Map());
  const [refLoaded, setRefLoaded] = useState(false);

  // ── sección "mis sesiones" ─────────────────────────────────────────────────
  const [mySessions, setMySessions] = useState<SesionWithOwner[]>([]);
  const [myTotal, setMyTotal] = useState(0);
  const [myIsLoading, setMyIsLoading] = useState(true);

  // ── sección "asignadas por mí" ─────────────────────────────────────────────
  const [assignedSessions, setAssignedSessions] = useState<SesionWithOwner[]>([]);
  const [assignedTotal, setAssignedTotal] = useState(0);
  const [assignedIsLoading, setAssignedIsLoading] = useState(false);

  // ── sección "todas" (solo admin) ───────────────────────────────────────────
  const [allSessions, setAllSessions] = useState<SesionWithOwner[]>([]);
  const [allTotal, setAllTotal] = useState(0);
  const [allIsLoading, setAllIsLoading] = useState(false);
  const [allSearch, setAllSearch] = useState('');
  const [allTab, setAllTab] = useState('all');
  const [allPage, setAllPage] = useState(1);
  const [assignerFilter, setAssignerFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [staffMap, setStaffMap] = useState<Map<string, BackendUserProfile>>(new Map());

  const [activeSection, setActiveSection] = useState<'mine' | 'assigned' | 'all'>('mine');

  const [mySearch, setMySearch] = useState('');
  const [myTab, setMyTab] = useState('all');
  const [myPage, setMyPage] = useState(1);

  const [assignedSearch, setAssignedSearch] = useState('');
  const [assignedTab, setAssignedTab] = useState('all');
  const [assignedPage, setAssignedPage] = useState(1);

  // ── carga de referencia ────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      listProfiles(),
      listScenarios(),
      listStudents().catch(() => [] as BackendUserProfile[]),
    ]).then(([profiles, scenarios, students]) => {
      setAvailableProfiles(profiles);
      setAvailableScenarios(scenarios);
      setProfileMap(new Map(profiles.map(p => [p.id, p])));
      setScenarioMap(new Map(scenarios.map(s => [s.id, s])));
      setStudentMap(new Map(students.map(u => [u.id, u])));
      setRefLoaded(true);
    }).catch(() => toast.error('Error cargando datos de referencia.'));
  }, []);

  // ── carga paginada ─────────────────────────────────────────────────────────
  const loadMySessions = async (
    page: number,
    tab: string,
    pMap: Map<string, BackendProfile>,
    sMap: Map<string, BackendScenario>,
    stMap: Map<string, BackendUserProfile>,
  ) => {
    setMyIsLoading(true);
    try {
      const status = (tab === 'active' || tab === 'completed' || tab === 'terminated') ? tab : undefined;
      const { items, total } = await listSessions({ view: 'mine', page, limit: PAGE_SIZE, status });
      const evals = await listEvaluations({ session_ids: items.map(s => s.id) }).catch(() => []);
      const evalMap = new Map(evals.map(e => [e.session_id, e]));
      setMySessions(items.map(s => mapSession(s, pMap, sMap, stMap, evalMap)));
      setMyTotal(total);
    } catch {
      toast.error('No se pudieron cargar las sesiones.');
    } finally {
      setMyIsLoading(false);
    }
  };

  const loadAssignedSessions = async (
    page: number,
    tab: string,
    pMap: Map<string, BackendProfile>,
    sMap: Map<string, BackendScenario>,
    stMap: Map<string, BackendUserProfile>,
  ) => {
    setAssignedIsLoading(true);
    try {
      const status = (tab === 'active' || tab === 'completed' || tab === 'terminated') ? tab : undefined;
      const { items, total } = await listSessions({ view: 'assigned', page, limit: PAGE_SIZE, status });
      const evals = await listEvaluations({ session_ids: items.map(s => s.id) }).catch(() => []);
      const evalMap = new Map(evals.map(e => [e.session_id, e]));
      setAssignedSessions(items.map(s => mapSession(s, pMap, sMap, stMap, evalMap)));
      setAssignedTotal(total);
    } catch {
      toast.error('No se pudieron cargar las sesiones asignadas.');
    } finally {
      setAssignedIsLoading(false);
    }
  };

  const loadAllSessions = async (
    page: number,
    tab: string,
    pMap: Map<string, BackendProfile>,
    sMap: Map<string, BackendScenario>,
    stMap: Map<string, BackendUserProfile>,
  ) => {
    setAllIsLoading(true);
    try {
      const status = (tab === 'active' || tab === 'completed' || tab === 'terminated') ? tab : undefined;
      const { items, total } = await listSessions({ page, limit: PAGE_SIZE, status });
      const evals = await listEvaluations({ session_ids: items.map(s => s.id) }).catch(() => []);
      const evalMap = new Map(evals.map(e => [e.session_id, e]));
      setAllSessions(items.map(s => mapSession(s, pMap, sMap, stMap, evalMap)));
      setAllTotal(total);
    } catch {
      toast.error('No se pudieron cargar todas las sesiones.');
    } finally {
      setAllIsLoading(false);
    }
  };

  // ── efectos ────────────────────────────────────────────────────────────────
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!refLoaded) return;
    void loadMySessions(myPage, myTab, profileMap, scenarioMap, studentMap);
  }, [refLoaded, myPage, myTab, reloadKey, profileMap, scenarioMap, studentMap]);

  useEffect(() => {
    if (!refLoaded || activeSection !== 'assigned') return;
    void loadAssignedSessions(assignedPage, assignedTab, profileMap, scenarioMap, studentMap);
  }, [refLoaded, activeSection, assignedPage, assignedTab, reloadKey, profileMap, scenarioMap, studentMap]);

  useEffect(() => {
    if (!refLoaded || activeSection !== 'all') return;
    if (staffMap.size === 0) {
      adminListUsers()
        .then(users => setStaffMap(new Map(users.map(u => [u.id, u]))))
        .catch(() => {});
    }
    void loadAllSessions(allPage, allTab, profileMap, scenarioMap, studentMap);
  }, [refLoaded, activeSection, allPage, allTab, reloadKey, profileMap, scenarioMap, studentMap]);

  useEffect(() => { setMyPage(1); }, [myTab]);
  useEffect(() => { setAssignedPage(1); }, [assignedTab]);
  useEffect(() => { setAllPage(1); }, [allTab]);
  useEffect(() => { setAssignerFilter('all'); setAssigneeFilter('all'); }, [activeSection]);

  const refreshAll = () => {
    setReloadKey(k => k + 1);
  };

  const isMine = activeSection === 'mine';
  const isAll = activeSection === 'all';
  const currentSearch = isMine ? mySearch : isAll ? allSearch : assignedSearch;
  const setCurrentSearch = isMine ? setMySearch : isAll ? setAllSearch : setAssignedSearch;
  const currentTab = isMine ? myTab : isAll ? allTab : assignedTab;
  const setCurrentTab = isMine ? setMyTab : isAll ? setAllTab : setAssignedTab;
  const currentPage = isMine ? myPage : isAll ? allPage : assignedPage;
  const setCurrentPage = isMine ? setMyPage : isAll ? setAllPage : setAssignedPage;
  const currentTotal = isMine ? myTotal : isAll ? allTotal : assignedTotal;
  const currentSessions = isMine ? mySessions : isAll ? allSessions : assignedSessions;
  const currentIsLoading = isMine ? myIsLoading : isAll ? allIsLoading : assignedIsLoading;
  const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  // Build assigner/assignee option lists from currently loaded sessions
  const uniqueAssigners = isAll ? (() => {
    const map = new Map<string, string>();
    allSessions.forEach(s => {
      if (s.assignedBy && s.assignedBy !== currentUserId) {
        const u = staffMap.get(s.assignedBy);
        map.set(s.assignedBy, u?.full_name ?? u?.email ?? s.assignedBy.slice(0, 8));
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  })() : [];

  const uniqueAssignees = isAll ? (() => {
    const map = new Map<string, string>();
    allSessions.forEach(s => {
      if (s.userId && s.userId !== currentUserId) {
        const u = studentMap.get(s.userId) ?? staffMap.get(s.userId);
        map.set(s.userId, u?.full_name ?? u?.email ?? s.userId.slice(0, 8));
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  })() : [];

  const filteredSessions = currentSessions.filter(s => {
    const q = currentSearch.toLowerCase();
    const matchesSearch = !currentSearch.trim() ||
      s.perfilName.toLowerCase().includes(q) ||
      s.escenarioName.toLowerCase().includes(q) ||
      (s.assignedToName?.toLowerCase().includes(q) ?? false);
    const matchesAssigner = !isAll || assignerFilter === 'all' || s.assignedBy === assignerFilter;
    const matchesAssignee = !isAll || assigneeFilter === 'all' || s.userId === assigneeFilter;
    return matchesSearch && matchesAssigner && matchesAssignee;
  });

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Sesiones"
        description="Historial de sesiones de simulación y chats activos"
      >
        <NuevaSesionDialog profiles={availableProfiles} scenarios={availableScenarios} onSessionCreated={refreshAll} />
      </PageHeader>

      {/* Stats */}
      <div className={`mb-6 grid gap-4 ${isTeacherOrAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">{myTotal}</p>
                <p className="text-xs text-muted-foreground">Mis sesiones</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        {isTeacherOrAdmin && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-semibold">{assignedTotal}</p>
                  <p className="text-xs text-muted-foreground">Asignadas</p>
                </div>
                <div className="rounded-lg bg-success/10 p-2">
                  <UserCheck className="h-4 w-4 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">{myTotal + assignedTotal}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <Square className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs primarios de sección */}
      {isTeacherOrAdmin && (
        <div className="mb-5 flex border-b">
          <button
            onClick={() => setActiveSection('mine')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              isMine
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Mis sesiones ({myTotal})
          </button>
          <button
            onClick={() => setActiveSection('assigned')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeSection === 'assigned'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Asignadas por mí ({assignedTotal})
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveSection('all')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                isAll
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Todas ({isAll ? allTotal : '…'})
            </button>
          )}
        </div>
      )}

      {/* Sub-tabs + filtros + búsqueda */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full sm:w-auto">
          <TabsList className="w-full overflow-x-auto whitespace-nowrap sm:w-auto">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="active">Activas</TabsTrigger>
            <TabsTrigger value="completed">Completadas</TabsTrigger>
            <TabsTrigger value="terminated">Terminadas</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-center gap-3">
          {isAll && (
            <>
              <Select value={assignerFilter} onValueChange={setAssignerFilter}>
                <SelectTrigger className="min-w-36">
                  <SelectValue placeholder="Todos los asignadores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los asignadores</SelectItem>
                  {uniqueAssigners.map(({ id, name }) => (
                    <SelectItem key={id} value={id}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="min-w-36">
                  <SelectValue placeholder="Todos los estudiantes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estudiantes</SelectItem>
                  {uniqueAssignees.map(({ id, name }) => (
                    <SelectItem key={id} value={id}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(assignerFilter !== 'all' || assigneeFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setAssignerFilter('all'); setAssigneeFilter('all'); }}
                  className="text-muted-foreground"
                >
                  Limpiar filtros
                </Button>
              )}
            </>
          )}
          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar en esta página..."
              value={currentSearch}
              onChange={(e) => setCurrentSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      {currentIsLoading ? (
        <Card><CardContent><LoadingState message="Cargando sesiones..." className="py-8" /></CardContent></Card>
      ) : currentTotal === 0 && !currentSearch ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No hay sesiones</p>
            <p className="mt-1 text-sm text-muted-foreground">Inicia una nueva sesión para comenzar a simular.</p>
            <div className="mt-4">
              <NuevaSesionDialog profiles={availableProfiles} scenarios={availableScenarios} onSessionCreated={refreshAll} />
            </div>
          </CardContent>
        </Card>
      ) : filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            {currentSearch ? 'Sin resultados para tu búsqueda en esta página.' : 'No hay sesiones en esta categoría.'}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredSessions.map((s) => (
              <SesionCard key={s.id} sesion={s} />
            ))}
          </div>
          {!currentSearch && (
            <Paginator total={currentTotal} page={currentPage} onPageChange={setCurrentPage} />
          )}
        </>
      )}
    </div>
  );
}
