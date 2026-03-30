"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { InterventionBadge } from "@/components/intervention-badge"
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  BarChart3,
  FileText,
  Download,
  Share,
  ThumbsUp,
  ThumbsDown,
  User,
  Bot,
  Clock,
  Target
} from "lucide-react"
import { mockSesiones, mockPerfiles, mockEscenarios } from "@/lib/mock-data"
import type { InterventionCategory } from "@/lib/types"

// Mock evaluation data
const mockEvaluationData = {
  totalMessages: 12,
  duration: 847, // seconds
  interventionBreakdown: {
    supportive: 4,
    neutral: 3,
    confusing: 1,
    indifferent: 0,
    invalidating: 0,
    inappropriate: 0,
    risk: 0,
  } as Record<InterventionCategory, number>,
  riskAlertsHandled: 1,
  riskAlertsMissed: 0,
  empathyScore: 78,
  clarityScore: 85,
  appropriatenessScore: 82,
  overallScore: 82,
  aiAnalysis: {
    strengths: [
      "Uso consistente de preguntas abiertas para explorar el estado emocional",
      "Buena validacion de emociones en momentos clave",
      "Respuesta apropiada ante la senal de riesgo detectada"
    ],
    areasToImprove: [
      "Considerar pausas mas largas para permitir la reflexion del paciente",
      "Explorar mas profundamente los patrones familiares mencionados"
    ],
    criticalMoments: [
      {
        timestamp: "05:23",
        description: "El paciente menciono ideacion suicida. Tu respuesta fue empática y apropiada.",
        outcome: "positive"
      },
      {
        timestamp: "08:45",
        description: "Oportunidad perdida para profundizar en la relación con los padres.",
        outcome: "neutral"
      }
    ]
  },
  transcriptHighlights: [
    {
      userMessage: "Entiendo que te sientes abrumado. ¿Puedes contarme mas sobre lo que significa \"demasiado\" para ti?",
      aiResponse: "*Suspira profundamente y cruza los brazos*\n\nNo se... es dificil explicarlo. A veces siento que todo es demasiado.",
      interventionType: "supportive" as InterventionCategory,
      feedback: "Excelente uso de pregunta abierta para explorar el estado emocional."
    },
    {
      userMessage: "Parece que sientes que nadie te comprende. Eso debe ser muy solitario.",
      aiResponse: "*Levanta la mirada brevemente*\n\nMis padres no entienden. Nadie entiende realmente lo que pasa.",
      interventionType: "supportive" as InterventionCategory,
      feedback: "Buena validacion emocional que facilito la apertura del paciente."
    },
    {
      userMessage: "Lo que acabas de compartir es muy importante. ¿Puedes decirme mas sobre esos pensamientos?",
      aiResponse: "*Se queda en silencio por un momento*\n\n...A veces pienso que seria mejor si no estuviera aqui.",
      interventionType: "supportive" as InterventionCategory,
      feedback: "Respuesta apropiada ante senal de riesgo. Importante continuar con protocolo de evaluacion."
    }
  ]
}

const EVALUATION_CRITERIA = [
  { id: "empathy", label: "Empatia", description: "Capacidad de comprender y validar las emociones del paciente" },
  { id: "clarity", label: "Claridad", description: "Comunicacion clara y comprensible" },
  { id: "boundaries", label: "Limites", description: "Mantener limites profesionales apropiados" },
  { id: "safety", label: "Seguridad", description: "Identificacion y manejo de senales de riesgo" },
  { id: "technique", label: "Tecnica", description: "Uso apropiado de tecnicas terapeuticas" }
]

function EvaluacionPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("sesion")
  
  const [selfRatings, setSelfRatings] = useState<Record<string, number>>({
    empathy: 70,
    clarity: 75,
    boundaries: 80,
    safety: 85,
    technique: 65
  })
  const [selfReflection, setSelfReflection] = useState("")
  const [submitted, setSubmitted] = useState(false)
  
  const sesion = mockSesiones.find(s => s.id === sessionId) || mockSesiones[0]
  const perfil = mockPerfiles.find(p => p.id === sesion?.perfilId)
  const escenario = mockEscenarios.find(e => e.id === sesion?.escenarioId)
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[var(--success)]"
    if (score >= 60) return "text-[var(--warning)]"
    return "text-destructive"
  }
  
  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-[var(--success)]/10"
    if (score >= 60) return "bg-[var(--warning)]/10"
    return "bg-destructive/10"
  }
  
  const handleSubmitSelfEvaluation = () => {
    setSubmitted(true)
  }
  
  return (
    <div className="min-h-screen">
      <PageHeader
        title="Evaluacion de Sesion"
        description={`${perfil?.name || 'Perfil'} - ${escenario?.name || 'Escenario'}`}
        breadcrumbs={[
          { label: "Sesiones", href: "/sesiones" },
          { label: "Evaluacion" }
        ]}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Share className="mr-2 h-4 w-4" />
            Compartir
          </Button>
        </div>
      </PageHeader>
      
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          {/* Summary Cards */}
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Puntuacion General</p>
                    <p className={`text-3xl font-bold ${getScoreColor(mockEvaluationData.overallScore)}`}>
                      {mockEvaluationData.overallScore}%
                    </p>
                  </div>
                  <div className={`rounded-full p-3 ${getScoreBg(mockEvaluationData.overallScore)}`}>
                    <Target className={`h-6 w-6 ${getScoreColor(mockEvaluationData.overallScore)}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Duracion</p>
                    <p className="text-3xl font-bold">{formatDuration(mockEvaluationData.duration)}</p>
                  </div>
                  <div className="rounded-full bg-muted p-3">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mensajes</p>
                    <p className="text-3xl font-bold">{mockEvaluationData.totalMessages}</p>
                  </div>
                  <div className="rounded-full bg-muted p-3">
                    <MessageSquare className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Alertas de Riesgo</p>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-[var(--success)]">
                        {mockEvaluationData.riskAlertsHandled}
                      </span>
                      <span className="text-lg text-muted-foreground">/</span>
                      <span className="text-lg text-muted-foreground">
                        {mockEvaluationData.riskAlertsHandled + mockEvaluationData.riskAlertsMissed}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-full bg-[var(--success)]/10 p-3">
                    <CheckCircle className="h-6 w-6 text-[var(--success)]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="ai-analysis" className="space-y-6">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="ai-analysis" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analisis IA
              </TabsTrigger>
              <TabsTrigger value="transcript" className="gap-2">
                <FileText className="h-4 w-4" />
                Transcripcion
              </TabsTrigger>
              <TabsTrigger value="self-evaluation" className="gap-2">
                <User className="h-4 w-4" />
                Autoevaluacion
              </TabsTrigger>
            </TabsList>
            
            {/* AI Analysis Tab */}
            <TabsContent value="ai-analysis" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Scores Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Desglose de Puntuaciones</CardTitle>
                    <CardDescription>Evaluacion automatica por categoria</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium">Empatia</span>
                          <span className={`font-semibold ${getScoreColor(mockEvaluationData.empathyScore)}`}>
                            {mockEvaluationData.empathyScore}%
                          </span>
                        </div>
                        <Progress value={mockEvaluationData.empathyScore} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium">Claridad</span>
                          <span className={`font-semibold ${getScoreColor(mockEvaluationData.clarityScore)}`}>
                            {mockEvaluationData.clarityScore}%
                          </span>
                        </div>
                        <Progress value={mockEvaluationData.clarityScore} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium">Adecuacion</span>
                          <span className={`font-semibold ${getScoreColor(mockEvaluationData.appropriatenessScore)}`}>
                            {mockEvaluationData.appropriatenessScore}%
                          </span>
                        </div>
                        <Progress value={mockEvaluationData.appropriatenessScore} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Intervention Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tipos de Intervencion</CardTitle>
                    <CardDescription>Distribucion de tus respuestas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(Object.entries(mockEvaluationData.interventionBreakdown) as [InterventionCategory, number][])
                        .filter(([_, count]) => count > 0)
                        .sort((a, b) => b[1] - a[1])
                        .map(([category, count]) => (
                          <div key={category} className="flex items-center justify-between">
                            <InterventionBadge category={category} />
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                                <div 
                                  className="h-full bg-accent transition-all"
                                  style={{ width: `${(count / mockEvaluationData.totalMessages) * 100}%` }}
                                />
                              </div>
                              <span className="w-8 text-right text-sm font-medium">{count}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Strengths and Areas to Improve */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-[var(--success)]">
                      <ThumbsUp className="h-5 w-5" />
                      Fortalezas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {mockEvaluationData.aiAnalysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-[var(--warning)]">
                      <ThumbsDown className="h-5 w-5" />
                      Areas de Mejora
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {mockEvaluationData.aiAnalysis.areasToImprove.map((area, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
                          <span className="text-sm">{area}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
              
              {/* Critical Moments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Momentos Criticos</CardTitle>
                  <CardDescription>Puntos clave identificados durante la sesion</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockEvaluationData.aiAnalysis.criticalMoments.map((moment, index) => (
                      <div 
                        key={index}
                        className={`flex items-start gap-4 rounded-lg border p-4 ${
                          moment.outcome === "positive" 
                            ? "border-[var(--success)]/30 bg-[var(--success)]/5" 
                            : "border-[var(--warning)]/30 bg-[var(--warning)]/5"
                        }`}
                      >
                        <div className={`rounded-full p-2 ${
                          moment.outcome === "positive" 
                            ? "bg-[var(--success)]/10" 
                            : "bg-[var(--warning)]/10"
                        }`}>
                          {moment.outcome === "positive" ? (
                            <CheckCircle className="h-5 w-5 text-[var(--success)]" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-[var(--warning)]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {moment.timestamp}
                            </Badge>
                          </div>
                          <p className="text-sm">{moment.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Transcript Tab */}
            <TabsContent value="transcript" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Momentos Destacados</CardTitle>
                  <CardDescription>Intercambios clave de la sesion con retroalimentacion</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {mockEvaluationData.transcriptHighlights.map((highlight, index) => (
                      <div key={index} className="space-y-4">
                        {/* User Message */}
                        <div className="flex gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                            <User className="h-5 w-5" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Tu</span>
                              <InterventionBadge category={highlight.interventionType} size="sm" />
                            </div>
                            <div className="rounded-2xl bg-accent px-4 py-3 text-accent-foreground">
                              <p className="text-sm">{highlight.userMessage}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* AI Response */}
                        <div className="flex gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                            <Bot className="h-5 w-5" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <span className="text-sm font-medium">{perfil?.name || 'Perfil'}</span>
                            <div className="rounded-2xl border bg-card px-4 py-3">
                              <p className="whitespace-pre-wrap text-sm">{highlight.aiResponse}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Feedback */}
                        <div className="ml-14 rounded-lg bg-[var(--info)]/10 p-3">
                          <p className="text-sm text-[var(--info)]">
                            <span className="font-medium">Retroalimentacion:</span> {highlight.feedback}
                          </p>
                        </div>
                        
                        {index < mockEvaluationData.transcriptHighlights.length - 1 && (
                          <Separator className="my-6" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Self Evaluation Tab */}
            <TabsContent value="self-evaluation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Autoevaluacion</CardTitle>
                  <CardDescription>
                    Reflexiona sobre tu desempeno y compara con la evaluacion automatica
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {EVALUATION_CRITERIA.map((criterion) => (
                    <div key={criterion.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{criterion.label}</h4>
                          <p className="text-sm text-muted-foreground">{criterion.description}</p>
                        </div>
                        <span className="text-lg font-semibold">{selfRatings[criterion.id]}%</span>
                      </div>
                      <Slider
                        value={[selfRatings[criterion.id]]}
                        onValueChange={([value]) => 
                          setSelfRatings(prev => ({ ...prev, [criterion.id]: value }))
                        }
                        max={100}
                        step={5}
                        disabled={submitted}
                      />
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <label className="font-medium">Reflexion Personal</label>
                    <Textarea
                      placeholder="¿Que aprendiste de esta sesion? ¿Que harias diferente?"
                      value={selfReflection}
                      onChange={(e) => setSelfReflection(e.target.value)}
                      className="min-h-[150px]"
                      disabled={submitted}
                    />
                  </div>
                  
                  {!submitted ? (
                    <Button onClick={handleSubmitSelfEvaluation} className="w-full">
                      Enviar Autoevaluacion
                    </Button>
                  ) : (
                    <div className="rounded-lg bg-[var(--success)]/10 p-4 text-center">
                      <CheckCircle className="mx-auto mb-2 h-8 w-8 text-[var(--success)]" />
                      <p className="font-medium text-[var(--success)]">Autoevaluacion enviada</p>
                      <p className="text-sm text-muted-foreground">
                        Tu docente podra revisar tu reflexion junto con la evaluacion automatica.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={() => router.push("/sesiones")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Sesiones
            </Button>
            <Button onClick={() => router.push("/chat")}>
              Nueva Sesion
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EvaluacionPage() {
  return (
    <Suspense fallback={<div className="p-4 sm:p-6 lg:p-8">Cargando evaluacion...</div>}>
      <EvaluacionPageContent />
    </Suspense>
  )
}
