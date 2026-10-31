"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowLeft, CheckCircle, Clock, MessageSquare, Save, Send, AlertTriangle,
  User, Bot, ShieldAlert,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { LoadingState } from "@/components/ui-states"
import {
  ApiError,
  getActiveRubric,
  getConversationHistory,
  getEvaluation,
  runAutoEvaluation,
  submitEvaluation,
  type ActiveRubric,
  type BackendConversationMessage,
  type EvaluationResponse,
} from "@/lib/api"

export default function EvaluationDetail({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const { userRole } = useAuth()
  const canEvaluate = userRole === "teacher" || userRole === "admin"

  const [rubric, setRubric] = useState<ActiveRubric | null>(null)
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null)
  const [transcript, setTranscript] = useState<BackendConversationMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [feedback, setFeedback] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }
    void (async () => {
      setLoading(true)
      let redirecting = false
      try {
        const [r, e, h] = await Promise.all([
          getActiveRubric(),
          getEvaluation(sessionId).catch((err) => {
            // Sin acceso a la sesión no hay nada que mostrar; cualquier otro fallo se trata como "sin evaluación todavía"
            if (err instanceof ApiError && err.status === 403) throw err
            return null
          }),
          getConversationHistory(sessionId).catch(() => []),
        ])
        setRubric(r)
        setTranscript(h)
        if (e) {
          setEvaluation(e)
          setScores(e.scores ?? {})
          setFeedback(e.teacher_feedback ?? "")
        } else {
          const created = await runAutoEvaluation(sessionId)
          setEvaluation(created)
        }
      } catch (err) {
        if (err instanceof ApiError && (err.status === 403 || err.status === 404)) {
          // Sin acceso o inexistente: se vuelve a la lista en lugar de mostrar la página vacía
          toast.error(
            err.status === 404
              ? "La sesión no existe."
              : err.message && !/^Error \d+$/.test(err.message)
                ? err.message
                : "No tienes acceso a esta evaluación.",
          )
          redirecting = true
          router.replace("/evaluacion")
          return
        }
        toast.error("No se pudo cargar la evaluación: " + (err instanceof Error ? err.message : String(err)))
      } finally {
        if (!redirecting) setLoading(false)
        setLoading(false)
      }
    })()
  }, [sessionId, router])

  const handleScoreChange = (key: string, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }))
  }

  const handleRecalculate = async () => {
    if (!sessionId) return
    setSaving(true)
    try {
      const updated = await runAutoEvaluation(sessionId)
      setEvaluation(updated)
      toast.success("Métricas pedagógicas recalculadas")
    } catch (err) {
      toast.error("Error al recalcular: " + String(err))
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (status: "draft" | "submitted") => {
    if (!sessionId) return
    setSaving(true)
    try {
      const updated = await submitEvaluation(sessionId, {
        scores,
        teacher_feedback: feedback,
        status,
      })
      setEvaluation(updated)
      toast.success(
        status === "submitted" ? "Evaluación enviada al estudiante" : "Borrador guardado",
      )
    } catch (err) {
      toast.error("Error al guardar: " + String(err))
    } finally {
      setSaving(false)
    }
  }

  if (!sessionId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Falta el parámetro <code>?sesion=&lt;id&gt;</code> en la URL.
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card><CardContent><LoadingState message="Cargando evaluación..." className="py-8" /></CardContent></Card>
      </div>
    )
  }

  const metrics = evaluation?.automatic_metrics ?? {}
  const overall = evaluation?.overall_score ?? null
  const submitted = evaluation?.status === "submitted" || evaluation?.status === "reviewed"
  // El estudiante no ve calificación mientras el docente no la envíe (el backend devuelve scores vacíos).
  const awaitingGrade = !canEvaluate && !submitted

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title="Evaluación de la sesión"
          description={`Sesión: ${sessionId.slice(0, 8)}…`}
        />
        {evaluation && (
          <Badge variant={submitted ? "default" : "secondary"} className="ml-auto">
            {awaitingGrade ? "Pendiente" : evaluation.status}
          </Badge>
        )}
      </div>

      {/* Métricas pedagógicas (sin latencia técnica) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Resumen de la sesión</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecalculate}
              disabled={saving}
            >
              Recalcular
            </Button>
          </CardTitle>
          <CardDescription>
            Métricas pedagógicas calculadas automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricBox label="Turnos del estudiante" value={metrics.turns_trainee ?? "—"} icon={<MessageSquare className="h-4 w-4" />} />
            <MetricBox label="Turnos del NPC" value={metrics.turns_patient ?? "—"} icon={<MessageSquare className="h-4 w-4" />} />
            <MetricBox
              label="Duración"
              value={
                metrics.duration_minutes != null
                  ? `${metrics.duration_source === "estimated" ? "~" : ""}${(metrics.duration_minutes as number).toFixed(1)} min`
                  : "—"
              }
              icon={<Clock className="h-4 w-4" />}
            />
            <MetricBox label="Pico de severidad" value={metrics.severity_peak != null ? Number(metrics.severity_peak).toFixed(1) : "—"} />
            <MetricBox label="Severidad final" value={metrics.severity_final != null ? Number(metrics.severity_final).toFixed(1) : "—"} />
            <MetricBox label="Alertas de riesgo" value={metrics.risk_alerts_detected ?? 0} icon={<AlertTriangle className="h-4 w-4 text-destructive" />} />
            <MetricBox
              label="Preguntas sobre riesgo"
              value={metrics.risk_check_alerts_detected ?? 0}
              icon={<ShieldAlert className="h-4 w-4 text-amber-500" />}
            />
            {!awaitingGrade && (
              <MetricBox label="Puntaje global" value={overall != null ? `${overall} / 5` : "—"} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transcripción de la conversación */}
      <Card>
        <CardHeader>
          <CardTitle>Transcripción de la sesión</CardTitle>
          <CardDescription>
            Todo lo que conversaron el estudiante y el NPC simulado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transcript.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Sin turnos registrados.
            </p>
          ) : (
            <ScrollArea className="h-96 pr-3">
              <div className="space-y-3">
                {transcript.map((m, i) => {
                  const isStudent = m.role === "trainee"
                  // La marca se guarda en la respuesta del NPC, pero la provoca el mensaje del estudiante
                  const marcas = isStudent ? transcript[i + 1]?.risk_flags ?? [] : []
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-3 ${isStudent ? "flex-row" : "flex-row-reverse"}`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          isStudent
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {isStudent ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div
                        className={`flex-1 max-w-[80%] rounded-lg border p-3 ${
                          isStudent ? "bg-primary/5" : "bg-muted/40"
                        }`}
                      >
                        <div className="flex items-baseline justify-between gap-3 mb-1">
                          <p className="text-xs font-semibold">
                            {isStudent ? "Estudiante" : "NPC"}
                          </p>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            sev: {typeof m.severity === 'number' ? m.severity.toFixed(1) : m.severity}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(m.created_at).toLocaleTimeString()}
                          </p>
                          {marcas.includes("risk") && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-destructive">
                              <AlertTriangle className="h-3 w-3" />
                              Alerta de riesgo
                            </span>
                          )}
                          {marcas.includes("risk_check") && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                              <ShieldAlert className="h-3 w-3" />
                              Pregunta sobre riesgo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Estudiante con evaluación en borrador: aún no hay calificación */}
      {awaitingGrade && (
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <Clock className="h-5 w-5 shrink-0" />
            Tu docente aún no ha enviado la calificación.
          </CardContent>
        </Card>
      )}

      {/* Rúbrica del docente */}
      {rubric && !awaitingGrade && (
        <Card>
          <CardHeader>
            <CardTitle>Rúbrica del docente</CardTitle>
            <CardDescription>
              {rubric.name} · versión {rubric.version}
              {!canEvaluate && (
                <>
                  {" "}
                  · <Badge variant="outline">Solo lectura</Badge>
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rubric.criteria.map((c) => (
              <div key={c.key} className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="font-medium">{c.label}</p>
                    {c.description && (
                      <p className="text-sm text-muted-foreground">{c.description}</p>
                    )}
                  </div>
                  <div className="text-sm font-semibold">
                    {scores[c.key] ?? 0} / {c.max_score}
                    <span className="ml-2 text-xs text-muted-foreground">
                      (peso {Math.round(c.weight * 100)}%)
                    </span>
                  </div>
                </div>
                <Slider
                  value={[scores[c.key] ?? 0]}
                  min={0}
                  max={c.max_score}
                  step={1}
                  disabled={!canEvaluate || submitted}
                  onValueChange={(v) => handleScoreChange(c.key, v[0])}
                />
              </div>
            ))}

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">Retroalimentación al estudiante</label>
              <Textarea
                placeholder="Observaciones cualitativas, sugerencias, momentos destacados…"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={!canEvaluate || submitted}
                rows={4}
              />
            </div>

            {canEvaluate && !submitted && (
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar borrador
                </Button>
                <Button onClick={() => handleSubmit("submitted")} disabled={saving}>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar evaluación
                </Button>
              </div>
            )}

            {submitted && (
              <div className="flex items-center gap-2 text-sm text-green-600 pt-2">
                <CheckCircle className="h-4 w-4" />
                Evaluación enviada
                {evaluation?.submitted_at && (
                  <span className="text-muted-foreground">
                    · {new Date(evaluation.submitted_at).toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MetricBox({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border p-3 space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}

