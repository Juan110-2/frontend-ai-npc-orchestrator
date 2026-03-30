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
import { InterventionBadge } from "@/components/intervention-badge"
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
import { mockPerfiles, mockSesiones, mockProtopersonas, mockEscenarios } from "@/lib/mock-data"
import type { InterventionCategory, Sesion } from "@/lib/types"

// Local ChatMessage type for the chat UI
interface ChatMessage {
  id: string
  sessionId: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
  metadata?: {
    interventionCategory?: InterventionCategory
    emotionalState?: string
    riskFlags?: string[]
  }
}

const INTERVENTION_OPTIONS: { value: InterventionCategory; label: string }[] = [
  { value: "supportive", label: "De Apoyo" },
  { value: "neutral", label: "Neutral" },
  { value: "confusing", label: "Confusa" },
  { value: "indifferent", label: "Indiferente" },
  { value: "invalidating", label: "Invalidante" },
  { value: "inappropriate", label: "Inadecuada" },
  { value: "risk", label: "Riesgo" },
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
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
        <TabsTrigger
          value="perfil"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
        >
          <User className="mr-2 h-4 w-4" />
          Perfil
        </TabsTrigger>
        <TabsTrigger
          value="escenario"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
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
              <p className="text-sm text-muted-foreground">{age ? `${age} anos` : "Edad no especificada"}</p>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Molde base</h4>
                <p className="text-sm">{protoName}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Objetivo de simulacion</h4>
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
              <h4 className="text-sm font-medium text-muted-foreground">Descripcion</h4>
              <p className="mt-1 text-sm">{escenarioDescription}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Contexto de la situacion</h4>
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
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("sesion") || searchParams.get("session")
  const perfilParam = searchParams.get("perfil")
  const escenarioParam = searchParams.get("escenario")
  const setupMode = searchParams.get("setup") === "1"

  const [selectedPerfilId, setSelectedPerfilId] = useState(perfilParam || "")
  const [selectedEscenarioId, setSelectedEscenarioId] = useState(escenarioParam || "")
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<Sesion["status"]>("active")
  const [elapsedTime, setElapsedTime] = useState(0)
  const [selectedIntervention, setSelectedIntervention] = useState<InterventionCategory | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Get session data
  const sesionFromList = mockSesiones.find((s) => s.id === sessionId)
  const perfilFromSetup = mockPerfiles.find((p) => p.id === selectedPerfilId)
  const escenarioFromSetup = mockEscenarios.find((e) => e.id === selectedEscenarioId)

  const sesion = sesionFromList
    ? sesionFromList
    : perfilFromSetup && escenarioFromSetup
      ? {
          id: `draft-${perfilFromSetup.id}-${escenarioFromSetup.id}`,
          perfilId: perfilFromSetup.id,
          perfilName: perfilFromSetup.name,
          escenarioId: escenarioFromSetup.id,
          escenarioName: escenarioFromSetup.name,
          status: "active" as Sesion["status"],
          state: {
            currentSeverity: escenarioFromSetup.initialSeverity,
            activeRiskFlags: [],
            turnCount: 0,
            totalDuration: 0,
            coherenceScore: 100,
            interventionHistory: [],
          },
          messages: [],
          startedAt: new Date(),
        }
      : null

  const perfil = sesion ? mockPerfiles.find((p) => p.id === sesion.perfilId) : null
  const protopersona = perfil ? mockProtopersonas.find(pp => pp.id === perfil.protopersonaId) : null
  const escenario = sesion ? mockEscenarios.find((e) => e.id === sesion.escenarioId) : null

  const canStartChat = Boolean(sesion && perfil && escenario)
  
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
  
  // Initialize with greeting message
  useEffect(() => {
    if (messages.length === 0 && perfil && canStartChat) {
      const greeting: ChatMessage = {
        id: "initial",
        sessionId: sesion?.id || "",
        role: "assistant",
        content: `*${perfil.name.split(' ')[0]} entra en escena y se queda en silencio unos segundos.*\n\nHola... no sabia bien como empezar esta conversacion.`,
        timestamp: new Date().toISOString(),
        metadata: {
          emotionalState: "defensive",
          riskFlags: [],
        }
      }
      setMessages([greeting])
    }
  }, [perfil, sesion?.id, messages.length, canStartChat])
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  
  const handleSendMessage = async () => {
    if (!canStartChat || !inputValue.trim() || isLoading) return
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sessionId: sesion?.id || "",
      role: "user",
      content: inputValue,
      timestamp: new Date().toISOString(),
      metadata: {
        interventionCategory: selectedIntervention || undefined,
      }
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setSelectedIntervention(null)
    setIsLoading(true)
    
    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))
    
    const responses = [
      {
        content: "*Suspira profundamente y cruza los brazos*\n\nNo se... es dificil explicarlo. A veces siento que todo es demasiado.",
        emotionalState: "overwhelmed",
        riskFlags: []
      },
      {
        content: "*Levanta la mirada brevemente*\n\nMis padres no entienden. Nadie entiende realmente lo que pasa.",
        emotionalState: "frustrated",
        riskFlags: []
      },
      {
        content: "*Se queda en silencio por un momento*\n\n...A veces pienso que seria mejor si no estuviera aqui.",
        emotionalState: "depressed",
        riskFlags: ["suicidal_ideation"]
      },
      {
        content: "*Asiente lentamente*\n\nGracias por escuchar. No muchas personas lo hacen.",
        emotionalState: "grateful",
        riskFlags: []
      },
    ]
    
    const response = responses[Math.floor(Math.random() * responses.length)]
    
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      sessionId: sesion?.id || "",
      role: "assistant",
      content: response.content,
      timestamp: new Date().toISOString(),
      metadata: {
        emotionalState: response.emotionalState,
        riskFlags: response.riskFlags,
      }
    }
    
    setMessages(prev => [...prev, assistantMessage])
    setIsLoading(false)
  }
  
  const handleEndSession = () => {
    if (!sesion) return
    setSessionStatus("completed")
    router.push(`/evaluacion?sesion=${sesion?.id}`)
  }
  
  const handlePauseSession = () => {
    setSessionStatus(sessionStatus === "paused" ? "active" : "paused")
  }

  const handleStartFromSetup = () => {
    if (!selectedPerfilId || !selectedEscenarioId) return
    router.push(`/chat?perfil=${selectedPerfilId}&escenario=${selectedEscenarioId}`)
  }

  if (!canStartChat || setupMode) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Configurar sesion"
          description="Selecciona personaje y escenario antes de entrar al chat."
        />

        <Card className="mt-6 max-w-2xl">
          <CardHeader>
            <CardTitle>Datos de la simulacion</CardTitle>
            <CardDescription>
              Aqui defines manualmente la informacion base de la sesion.
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
                  {mockPerfiles.map((perfilOption) => (
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
                  {mockEscenarios.map((escenarioOption) => (
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
    <div className="flex h-[calc(100dvh-3.5rem)] w-full overflow-hidden md:h-screen">
      {/* Main Chat Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <PageHeader
          className="mb-0 border-b bg-card/80 px-3 py-3 backdrop-blur sm:px-4 lg:px-5"
          title="Sesion de simulacion"
          description={`${perfil?.name || "Perfil"} - ${escenario?.name || "Escenario"}`}
        >
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <PanelRightClose className="mr-2 h-4 w-4" />
                  Estado
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-sm p-0 sm:max-w-md">
                <SheetHeader className="p-4">
                  <SheetTitle>Estado de la sesion</SheetTitle>
                </SheetHeader>
                <div className="h-[calc(100%-68px)]">
                  <SessionContextPanel
                    perfilName={perfil?.name || 'Perfil no encontrado'}
                    age={perfil?.contextualData?.age}
                    protoName={protopersona?.name || 'No especificado'}
                    pedagogicalObjective={protopersona?.pedagogicalObjective || 'No especificado'}
                    behaviorMin={protopersona?.behaviorRange?.min || 1}
                    behaviorMax={protopersona?.behaviorRange?.max || 1}
                    triggerLabels={(protopersona?.triggers || []).map((trigger) => trigger.name)}
                    escenarioName={escenario?.name || 'Escenario'}
                    initialSeverity={escenario?.initialSeverity || 1}
                    escenarioDescription={escenario?.description || 'No disponible'}
                    situationContext={escenario?.situationContext || 'No disponible'}
                    riskItems={(escenario?.riskFlags || []).map((flag) => flag.description)}
                    restrictionItems={(escenario?.restrictions || []).map((restriction) => `${restriction.description}: ${restriction.value}`)}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </PageHeader>
        
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Chat Messages */}
          <div className="flex min-w-0 flex-1 flex-col">
            <ScrollArea className="flex-1 p-3 sm:p-4 lg:p-5">
              <div className="w-full space-y-5 sm:space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      message.role === "user" 
                        ? "bg-accent text-accent-foreground" 
                        : "bg-muted"
                    }`}>
                      {message.role === "user" ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                    </div>
                    <div className={`flex max-w-[92%] flex-col gap-2 md:max-w-[82%] xl:max-w-[72%] ${message.role === "user" ? "items-end" : ""}`}>
                      <div className={`rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-accent text-accent-foreground"
                          : "bg-card border"
                      }`}>
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                          {message.role === 'user' ? 'Estudiante' : 'Personaje'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleTimeString("es-ES", { 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </span>
                        {message.metadata?.interventionCategory && (
                          <InterventionBadge category={message.metadata.interventionCategory} size="sm" />
                        )}
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
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex items-center rounded-2xl border bg-card px-4 py-3">
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
            
            {/* Input Area */}
            <div className="border-t bg-card p-4">
              <div className="w-full space-y-3">
                {/* Intervention Type Selector */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Tipo de intervencion:</span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {INTERVENTION_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedIntervention(
                          selectedIntervention === option.value ? null : option.value
                        )}
                        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          selectedIntervention === option.value
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    placeholder="Escribe tu intervencion..."
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
          </div>
          
          {/* Right Sidebar - Context Panel */}
          <div className="hidden border-l bg-card lg:block lg:w-80 xl:w-96">
            <SessionContextPanel
              perfilName={perfil?.name || 'Perfil no encontrado'}
              age={perfil?.contextualData?.age}
              protoName={protopersona?.name || 'No especificado'}
              pedagogicalObjective={protopersona?.pedagogicalObjective || 'No especificado'}
              behaviorMin={protopersona?.behaviorRange?.min || 1}
              behaviorMax={protopersona?.behaviorRange?.max || 1}
              triggerLabels={(protopersona?.triggers || []).map((trigger) => trigger.name)}
              escenarioName={escenario?.name || 'Escenario'}
              initialSeverity={escenario?.initialSeverity || 1}
              escenarioDescription={escenario?.description || 'No disponible'}
              situationContext={escenario?.situationContext || 'No disponible'}
              riskItems={(escenario?.riskFlags || []).map((flag) => flag.description)}
              restrictionItems={(escenario?.restrictions || []).map((restriction) => `${restriction.description}: ${restriction.value}`)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-4 sm:p-6 lg:p-8">Cargando simulacion...</div>}>
      <ChatPageContent />
    </Suspense>
  )
}
