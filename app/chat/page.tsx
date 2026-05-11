"use client"

import { Suspense, useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SeverityBadge } from "@/components/severity-badge"
import { 
  Send, 
  Clock, 
  User, 
  Bot, 
  AlertTriangle,
  FileText,
  ChevronRight,
  PlayCircle,
  PauseCircle,
  StopCircle,
  PanelRightClose
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import type { Sesion } from "@/lib/types"
import {
  endSession,
  getConversationHistory,
  getSession,
  listProfiles,
  listScenarios,
  sendConversationMessage,
  connectConversationStream,
  startSession,
  type BackendProfile,
  type BackendScenario,
  type BackendSession,
} from "@/lib/backend-api"
import { toast } from "sonner"

// Local ChatMessage type for the chat UI
interface ChatMessage {
  id: string
  sessionId: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
  metadata?: {
    emotionalState?: string
    riskFlags?: string[]
  }
}

type DisplaySession = {
  id: string
  perfilId: string
  perfilName: string
  escenarioId: string
  escenarioName: string
  currentSeverity: number
  endedAt?: string | null
}

const QUICK_STARTERS = [
  "Quiero entender mejor cómo te has sentido hoy.",
  "Gracias por compartir esto conmigo.",
  "Podemos ir paso a paso, sin prisa.",
]

function SessionContextPanel({
  perfilName,
  age,
  protoName,
  pedagogicalObjective,
  behaviorMin,
  behaviorMax,
  triggerLabels,
  escenarioName,
  initialSeverity,
  escenarioDescription,
  situationContext,
  riskItems,
  restrictionItems,
}: {
  perfilName: string
  age?: number
  protoName: string
  pedagogicalObjective: string
  behaviorMin: number
  behaviorMax: number
  triggerLabels: string[]
  escenarioName: string
  initialSeverity: number
  escenarioDescription: string
  situationContext: string
  riskItems: string[]
  restrictionItems: string[]
}) {
  return (
    <Tabs defaultValue="perfil" className="h-full">
      <TabsList className="w-full justify-start gap-1 rounded-t-xl border-b bg-muted/30 p-1">
        <TabsTrigger
          value="perfil"
          className="rounded-lg border border-transparent data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <User className="mr-2 h-4 w-4" />
          Perfil
        </TabsTrigger>
        <TabsTrigger
          value="escenario"
          className="rounded-lg border border-transparent data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <FileText className="mr-2 h-4 w-4" />
          Escenario
        </TabsTrigger>
      </TabsList>

      <TabsContent value="perfil" className="mt-0 h-[calc(100%-41px)]">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{perfilName}</h3>
              <p className="text-sm text-muted-foreground">{age ? `${age} años` : "Edad no especificada"}</p>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Molde base</h4>
                <p className="text-sm">{protoName}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Objetivo de simulación</h4>
                <p className="text-sm">{pedagogicalObjective}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Rango de severidad</h4>
                <div className="flex items-center gap-2">
                  <SeverityBadge level={behaviorMin as 1 | 2 | 3 | 4 | 5} size="sm" />
                  <span className="text-xs text-muted-foreground">a</span>
                  <SeverityBadge level={behaviorMax as 1 | 2 | 3 | 4 | 5} size="sm" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Disparadores</h4>
                <div className="mt-1 flex flex-wrap gap-1">
                  {triggerLabels.length > 0 ? (
                    triggerLabels.slice(0, 4).map((trigger) => (
                      <Badge key={trigger} variant="secondary" className="text-xs">
                        {trigger}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No disponible</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="escenario" className="mt-0 h-[calc(100%-41px)]">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{escenarioName}</h3>
              <Badge variant="outline" className="mt-1">
                Severidad inicial: {initialSeverity}
              </Badge>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Descripción</h4>
              <p className="mt-1 text-sm">{escenarioDescription}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Contexto de la situación</h4>
              <p className="mt-1 text-sm">{situationContext}</p>
            </div>

            {riskItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Banderas de riesgo</h4>
                <ul className="mt-2 space-y-2">
                  {riskItems.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {restrictionItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Restricciones</h4>
                <ul className="mt-2 space-y-2">
                  {restrictionItems.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  )
}

function ChatPageContent() {
  const router = useRouter()
  const { userRole } = useAuth()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("sesion") || searchParams.get("session")
  const perfilParam = searchParams.get("perfil")
  const escenarioParam = searchParams.get("escenario")
  const setupMode = searchParams.get("setup") === "1"

  const [selectedPerfilId, setSelectedPerfilId] = useState(perfilParam || "")
  const [selectedEscenarioId, setSelectedEscenarioId] = useState(escenarioParam || "")
  const [availablePerfiles, setAvailablePerfiles] = useState<BackendProfile[]>([])
  const [availableEscenarios, setAvailableEscenarios] = useState<BackendScenario[]>([])
  const [activeSession, setActiveSession] = useState<BackendSession | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<Sesion["status"]>("active")
  const [elapsedTime, setElapsedTime] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    void (async () => {
      try {
        setIsBootstrapping(true)
        const [profiles, scenarios] = await Promise.all([listProfiles(), listScenarios()])
        setAvailablePerfiles(profiles)
        setAvailableEscenarios(scenarios)

        if (sessionId) {
          const session = await getSession(sessionId)
          setActiveSession(session)
          setSelectedPerfilId(session.profile_id)
          setSelectedEscenarioId(session.scenario_id)
          setSessionStatus(session.ended_at ? "completed" : "active")

          const startedAt = new Date(session.started_at)
          const endedAt = session.ended_at ? new Date(session.ended_at) : new Date()
          setElapsedTime(Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)))
        }
      } catch {
        toast.error("No se pudo conectar con el backend del chat.")
      } finally {
        setIsBootstrapping(false)
      }
    })()
  }, [sessionId])

  const perfil = availablePerfiles.find((p) => p.id === selectedPerfilId) || null
  const escenario = availableEscenarios.find((e) => e.id === selectedEscenarioId) || null

  const sesion: DisplaySession | null = activeSession
    ? {
        id: activeSession.id,
        perfilId: activeSession.profile_id,
        perfilName: perfil?.name || "Perfil",
        escenarioId: activeSession.scenario_id,
        escenarioName: escenario?.name || "Escenario",
        currentSeverity: activeSession.current_severity,
        endedAt: activeSession.ended_at,
      }
    : perfil && escenario
      ? {
          id: `draft-${perfil.id}-${escenario.id}`,
          perfilId: perfil.id,
          perfilName: perfil.name,
          escenarioId: escenario.id,
          escenarioName: escenario.name,
          currentSeverity: escenario.severity,
          endedAt: null,
        }
      : null

  const canStartChat = Boolean(sesion && perfil && escenario)
  const isTeacher = userRole === "teacher"
  
  // Timer effect
  useEffect(() => {
    if (sessionStatus === "active") {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [sessionStatus])
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
  // Load conversation history when opening an existing session
  useEffect(() => {
    if (!activeSession?.id) return

    void (async () => {
      try {
        const history = await getConversationHistory(activeSession.id)
        const mapped: ChatMessage[] = history.map((item) => ({
          id: item.id,
          sessionId: item.session_id,
          role: item.role === "trainee" ? "user" : item.role === "patient" ? "assistant" : "system",
          content: item.content,
          timestamp: item.created_at,
          metadata: {
            riskFlags: item.risk_flags,
          },
        }))
        setMessages(mapped)
      } catch {
        toast.error("No se pudo cargar el historial de la sesión.")
      }
    })()
  }, [activeSession?.id])

  // Nota: el chat NO inserta un mensaje pregrabado del paciente.
  // En una simulacion clinica es el estudiante quien aborda al paciente,
  // no al reves. La conversacion empieza vacia hasta que el estudiante envia
  // su primer turno.
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  
  const handleSendMessage = async () => {
    if (!canStartChat || !inputValue.trim() || isLoading) return

    let sessionForMessage = activeSession

    if (!sessionForMessage && perfil && escenario) {
      try {
        sessionForMessage = await startSession({
          profile_id: perfil.id,
          scenario_id: escenario.id,
        })
        setActiveSession(sessionForMessage)
        setSessionStatus("active")
        router.replace(`/chat?sesion=${sessionForMessage.id}`)
      } catch {
        toast.error("No se pudo iniciar la sesión en el backend.")
        return
      }
    }

    if (!sessionForMessage) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sessionId: sessionForMessage.id,
      role: "user",
      content: inputValue,
      timestamp: new Date().toISOString(),
    }

    const messageText = inputValue
    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    // El placeholder del NPC se inserta SOLO cuando llega el primer chunk,
    // asi mientras tanto solo se ve el indicador "escribiendo" (tres puntos).
    const assistantId = `assistant-${Date.now()}`
    let placeholderCreated = false

    try {
      const handle = await connectConversationStream(sessionForMessage.id, messageText)

      handle.onChunk((text) => {
        if (!placeholderCreated) {
          placeholderCreated = true
          // Al insertar el placeholder ya con el primer chunk, ocultamos el indicador
          setIsLoading(false)
          setMessages(prev => [
            ...prev,
            {
              id: assistantId,
              sessionId: sessionForMessage!.id,
              role: "assistant",
              content: text,
              timestamp: new Date().toISOString(),
            },
          ])
        } else {
          setMessages(prev =>
            prev.map(m => (m.id === assistantId ? { ...m, content: m.content + text } : m))
          )
        }
      })

      handle.onDone((data) => {
        setIsLoading(false)
        // Actualizar severidad localmente
        if (activeSession) {
          setActiveSession({ ...activeSession, current_severity: data.severity })
        }
        // Si la sesion se cerro, mostrar mensaje y bloquear input
        if (data.should_close) {
          setSessionStatus("completed")
          if (activeSession) {
            setActiveSession({
              ...activeSession,
              ended_at: new Date().toISOString(),
              current_severity: data.severity,
            })
          }
          const kind = data.closing_kind
          if (kind === "success") {
            toast.success("Sesión completada con éxito. El paciente se siente mejor.")
          } else if (kind === "crisis") {
            toast.error("Sesión terminada por crisis emocional del paciente.")
          } else if (kind === "inappropriate") {
            toast.warning("Sesión terminada por conducta inadecuada.")
          } else {
            toast("Sesión finalizada.")
          }
          // Redirigir a evaluación tras 2.5s
          setTimeout(() => {
            router.push(`/evaluacion?sesion=${sessionForMessage!.id}`)
          }, 2500)
        }
      })

      handle.onError((err) => {
        toast.error("Error en la conexión: " + err.message)
        setIsLoading(false)
      })

      handle.start()
    } catch (err) {
      toast.error("No se pudo enviar el mensaje: " + String(err))
      setIsLoading(false)
    }
  }
  
  const handleEndSession = () => {
    if (!activeSession?.id) return

    void (async () => {
      try {
        await endSession(activeSession.id)
        setSessionStatus("completed")
        setActiveSession({ ...activeSession, ended_at: new Date().toISOString() })
        router.push(`/evaluacion?sesion=${activeSession.id}`)
      } catch {
        toast.error("No se pudo finalizar la sesión en el backend.")
      }
    })()
  }
  
  const handlePauseSession = () => {
    setSessionStatus(sessionStatus === "paused" ? "active" : "paused")
  }

  const handleStartFromSetup = () => {
    if (!selectedPerfilId || !selectedEscenarioId) return

    void (async () => {
      try {
        const started = await startSession({
          profile_id: selectedPerfilId,
          scenario_id: selectedEscenarioId,
        })
        router.push(`/chat?sesion=${started.id}`)
      } catch {
        toast.error("No se pudo crear la sesión de chat.")
      }
    })()
  }

  const handleUseStarter = (starter: string) => {
    setInputValue((prev) => (prev.trim() ? `${prev.trim()} ${starter}` : starter))
  }

  if (isBootstrapping) {
    return <div className="p-4 sm:p-6 lg:p-8">Cargando sesión...</div>
  }

  if (!canStartChat || setupMode) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Configurar sesión"
          description="Selecciona personaje y escenario antes de entrar al chat."
        />

        <Card className="mt-6 max-w-2xl">
          <CardHeader>
            <CardTitle>Datos de la simulación</CardTitle>
            <CardDescription>
              Aquí defines manualmente la información base de la sesión.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Personaje simulado</p>
              <Select value={selectedPerfilId} onValueChange={setSelectedPerfilId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un perfil" />
                </SelectTrigger>
                <SelectContent>
                  {availablePerfiles.map((perfilOption) => (
                    <SelectItem key={perfilOption.id} value={perfilOption.id}>
                      {perfilOption.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Escenario</p>
              <Select value={selectedEscenarioId} onValueChange={setSelectedEscenarioId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un escenario" />
                </SelectTrigger>
                <SelectContent>
                  {availableEscenarios.map((escenarioOption) => (
                    <SelectItem key={escenarioOption.id} value={escenarioOption.id}>
                      {escenarioOption.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={handleStartFromSetup} disabled={!selectedPerfilId || !selectedEscenarioId}>
                Iniciar chat
              </Button>
              <Button variant="outline" onClick={() => router.push('/sesiones')}>
                Volver a sesiones
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="h-[calc(100dvh-3.5rem)] w-full bg-gradient-to-b from-muted/35 via-background to-background p-2 sm:p-3 lg:h-screen lg:p-4">
      <div className="flex h-full min-w-0 flex-col gap-3">
        <header className="rounded-2xl border border-border/70 bg-background/90 px-3 py-3 shadow-sm backdrop-blur sm:px-4 lg:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold leading-tight text-foreground sm:text-2xl">Sesión de simulación</h1>
              <p className="truncate text-sm text-muted-foreground">
                {isTeacher
                  ? `${perfil?.name || "Perfil"} - ${escenario?.name || "Escenario"}`
                  : "Modo estudiante: exploración y percepción del caso en entorno abierto"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm font-medium">{formatTime(elapsedTime)}</span>
              </div>
              <Badge variant={sessionStatus === "active" ? "default" : sessionStatus === "paused" ? "secondary" : "outline"}>
                {sessionStatus === "active" ? "En curso" : sessionStatus === "paused" ? "Pausada" : "Finalizada"}
              </Badge>
              <Button variant="outline" size="sm" onClick={handlePauseSession}>
                {sessionStatus === "paused" ? (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Reanudar
                  </>
                ) : (
                  <>
                    <PauseCircle className="mr-2 h-4 w-4" />
                    Pausar
                  </>
                )}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleEndSession}>
                <StopCircle className="mr-2 h-4 w-4" />
                Finalizar
              </Button>
              {isTeacher && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <PanelRightClose className="mr-2 h-4 w-4" />
                      Estado
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full max-w-sm p-0 sm:max-w-md">
                    <SheetHeader className="p-4">
                      <SheetTitle>Estado de la sesión</SheetTitle>
                    </SheetHeader>
                    <div className="h-[calc(100%-68px)]">
                      <SessionContextPanel
                        perfilName={perfil?.name || 'Perfil no encontrado'}
                        age={typeof perfil?.traits?.age === 'number' ? (perfil?.traits?.age as number) : undefined}
                        protoName={String(perfil?.traits?.protopersonaName || 'No especificado')}
                        pedagogicalObjective={perfil?.description || 'No especificado'}
                        behaviorMin={1}
                        behaviorMax={5}
                        triggerLabels={Array.isArray(perfil?.traits?.triggers) ? (perfil?.traits?.triggers as string[]) : []}
                        escenarioName={escenario?.name || 'Escenario'}
                        initialSeverity={Math.max(1, Math.min(5, escenario?.severity || 1))}
                        escenarioDescription={escenario?.context || 'No disponible'}
                        situationContext={escenario?.context || 'No disponible'}
                        riskItems={escenario?.risk_flags || []}
                        restrictionItems={Object.entries(escenario?.constraints || {}).map(([key, value]) => `${key}: ${String(value)}`)}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 gap-3">
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/85 shadow-sm">
            <ScrollArea className="flex-1 p-3 sm:p-4 lg:p-5">
              <div className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">
                {messages.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Bot className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium">
                      {perfil ? `${perfil.name.split(' ')[0]} te espera para conversar.` : "Selecciona perfil y escenario para comenzar."}
                    </p>
                    <p className="mt-1 text-xs">
                      Tú diriges la sesión. Inicia con un saludo o una pregunta abierta.
                    </p>
                  </div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 sm:gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${
                      message.role === "user"
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted"
                    }`}>
                      {message.role === "user" ? (
                        <User className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </div>
                    <div className={`flex max-w-[94%] flex-col gap-2 md:max-w-[84%] xl:max-w-[72%] ${message.role === "user" ? "items-end" : ""}`}>
                      <div className={`rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-accent text-accent-foreground"
                          : "border bg-background"
                      }`}>
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                          {message.role === 'user' ? 'Estudiante' : 'Personaje'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                        {message.metadata?.riskFlags && message.metadata.riskFlags.length > 0 && (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            Alerta
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 sm:gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted sm:h-10 sm:w-10">
                      <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex items-center rounded-2xl border bg-background px-4 py-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t bg-background/95 p-3 sm:p-4">
              <div className="mx-auto w-full max-w-5xl space-y-3">
                <div className="flex flex-wrap gap-2">
                  {QUICK_STARTERS.map((starter) => (
                    <Button
                      key={starter}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-full border border-border/80 bg-muted/40 px-3 text-xs"
                      onClick={() => handleUseStarter(starter)}
                    >
                      {starter}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    placeholder="Escribe tu intervención..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    disabled={sessionStatus !== "active"}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading || sessionStatus !== "active"}
                    className="sm:w-auto"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {isTeacher ? (
            <aside className="hidden overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-sm lg:block lg:w-80 xl:w-96">
              <SessionContextPanel
                perfilName={perfil?.name || 'Perfil no encontrado'}
                age={typeof perfil?.traits?.age === 'number' ? (perfil?.traits?.age as number) : undefined}
                protoName={String(perfil?.traits?.protopersonaName || 'No especificado')}
                pedagogicalObjective={perfil?.description || 'No especificado'}
                behaviorMin={1}
                behaviorMax={5}
                triggerLabels={Array.isArray(perfil?.traits?.triggers) ? (perfil?.traits?.triggers as string[]) : []}
                escenarioName={escenario?.name || 'Escenario'}
                initialSeverity={Math.max(1, Math.min(5, escenario?.severity || 1))}
                escenarioDescription={escenario?.context || 'No disponible'}
                situationContext={escenario?.context || 'No disponible'}
                riskItems={escenario?.risk_flags || []}
                restrictionItems={Object.entries(escenario?.constraints || {}).map(([key, value]) => `${key}: ${String(value)}`)}
              />
            </aside>
          ) : (
            <aside className="hidden overflow-hidden rounded-2xl border border-border/70 bg-card/90 p-4 shadow-sm lg:block lg:w-80 xl:w-96">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">Modo estudiante</Badge>
                <h2 className="text-lg font-semibold leading-tight">Exploración guiada de la conversación</h2>
                <p className="text-sm text-muted-foreground">
                  En este modo, el foco es observar, escuchar y practicar intervenciones sin ver detalles internos del escenario.
                </p>
                <div className="space-y-2 rounded-xl border bg-background p-3">
                  <p className="text-sm font-medium">Objetivo sugerido</p>
                  <p className="text-sm text-muted-foreground">Identificar señales emocionales y responder con preguntas abiertas y lenguaje de apoyo.</p>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-4 sm:p-6 lg:p-8">Cargando simulación...</div>}>
      <ChatPageContent />
    </Suspense>
  )
}
