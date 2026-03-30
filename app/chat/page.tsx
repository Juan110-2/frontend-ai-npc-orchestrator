"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { SeverityBadge } from "@/components/severity-badge"
import { InterventionBadge } from "@/components/intervention-badge"
import { 
  Send, 
  Square, 
  Clock, 
  User, 
  Bot, 
  AlertTriangle,
  FileText,
  MessageSquare,
  Info,
  ChevronRight,
  PlayCircle,
  PauseCircle,
  StopCircle
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

export default function ChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("sesion")
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<Sesion["status"]>("active")
  const [elapsedTime, setElapsedTime] = useState(0)
  const [selectedIntervention, setSelectedIntervention] = useState<InterventionCategory | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Get session data
  const sesion = mockSesiones.find(s => s.id === sessionId) || mockSesiones[0]
  const perfil = mockPerfiles.find(p => p.id === sesion?.perfilId)
  const protopersona = perfil ? mockProtopersonas.find(pp => pp.id === perfil.protopersonaId) : null
  const escenario = mockEscenarios.find(e => e.id === sesion?.escenarioId)
  
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
    if (messages.length === 0 && perfil) {
      const greeting: ChatMessage = {
        id: "initial",
        sessionId: sesion?.id || "",
        role: "assistant",
        content: `*${perfil.name.split(' ')[0]} entra al consultorio y se sienta lentamente. Mira hacia el suelo sin hacer contacto visual.*\n\nHola... supongo que tengo que estar aqui.`,
        timestamp: new Date().toISOString(),
        metadata: {
          emotionalState: "defensive",
          riskFlags: [],
        }
      }
      setMessages([greeting])
    }
  }, [perfil, sesion?.id, messages.length])
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return
    
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
    setSessionStatus("completed")
    router.push(`/evaluacion?sesion=${sesion?.id}`)
  }
  
  const handlePauseSession = () => {
    setSessionStatus(sessionStatus === "paused" ? "active" : "paused")
  }
  
  return (
    <div className="flex h-screen">
      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="Sesion de Practica"
          description={`${perfil?.name || "Perfil"} - ${escenario?.name || "Escenario"}`}
        >
          <div className="flex items-center gap-4">
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
          </div>
        </PageHeader>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Chat Messages */}
          <div className="flex flex-1 flex-col">
            <ScrollArea className="flex-1 p-6">
              <div className="mx-auto max-w-3xl space-y-6">
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
                    <div className={`flex max-w-[70%] flex-col gap-2 ${message.role === "user" ? "items-end" : ""}`}>
                      <div className={`rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-accent text-accent-foreground"
                          : "bg-card border"
                      }`}>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                      </div>
                      <div className="flex items-center gap-2">
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
              <div className="mx-auto max-w-3xl space-y-3">
                {/* Intervention Type Selector */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Tipo de intervencion:</span>
                  {INTERVENTION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedIntervention(
                        selectedIntervention === option.value ? null : option.value
                      )}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                        selectedIntervention === option.value
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-3">
                  <Input
                    placeholder="Escribe tu respuesta como terapeuta..."
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
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Sidebar - Context Panel */}
          <div className="hidden w-80 border-l bg-card lg:block">
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
                <TabsTrigger 
                  value="notas" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Notas
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="perfil" className="mt-0 h-[calc(100%-41px)]">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{perfil?.name || "Perfil no encontrado"}</h3>
                      <p className="text-sm text-muted-foreground">{perfil?.contextualData?.age ? `${perfil.contextualData.age} anos` : "Edad no especificada"}</p>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Protopersona Base</h4>
                        <p className="text-sm">{protopersona?.name || "No especificado"}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Objetivo Pedagogico</h4>
                        <p className="text-sm">{protopersona?.pedagogicalObjective || "No especificado"}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Rango de Severidad</h4>
                        <div className="flex items-center gap-2">
                          <SeverityBadge level={protopersona?.behaviorRange?.min || 1} size="sm" />
                          <span className="text-xs text-muted-foreground">a</span>
                          <SeverityBadge level={protopersona?.behaviorRange?.max || 1} size="sm" />
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Disparadores</h4>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {protopersona?.triggers?.slice(0, 3).map((trigger) => (
                            <Badge key={trigger.id} variant="secondary" className="text-xs">
                              {trigger.name}
                            </Badge>
                          )) || <span className="text-xs text-muted-foreground">No disponible</span>}
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-medium">Recordatorio</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Esta es una simulacion educativa. Los perfiles son ficticios y 
                        sirven para practicar habilidades terapeuticas en un entorno seguro.
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="escenario" className="mt-0 h-[calc(100%-41px)]">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{escenario?.name || "Escenario"}</h3>
                      <Badge variant="outline" className="mt-1">
                        Severidad inicial: {escenario?.initialSeverity || "N/A"}
                      </Badge>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Descripcion</h4>
                      <p className="mt-1 text-sm">{escenario?.description || "No disponible"}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Contexto de la Situacion</h4>
                      <p className="mt-1 text-sm">{escenario?.situationContext || "No disponible"}</p>
                    </div>
                    
                    {escenario?.riskFlags && escenario.riskFlags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Banderas de Riesgo</h4>
                        <ul className="mt-2 space-y-2">
                          {escenario.riskFlags.map((flag) => (
                            <li key={flag.id} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                              <span>{flag.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {escenario?.restrictions && escenario.restrictions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Restricciones</h4>
                        <ul className="mt-2 space-y-2">
                          {escenario.restrictions.map((restriction) => (
                            <li key={restriction.id} className="flex items-start gap-2 text-sm">
                              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                              <span>{restriction.description}: {restriction.value}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="notas" className="mt-0 h-[calc(100%-41px)]">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Toma notas durante la sesion para revisar despues.
                    </p>
                    <textarea
                      className="min-h-[200px] w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Escribe tus observaciones aqui..."
                    />
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
