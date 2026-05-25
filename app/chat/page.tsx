"use client"

import { Suspense, useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { SeverityGauge } from "@/components/severity-gauge"
import {
  Send,
  Clock,
  User,
  Bot,
  AlertTriangle,
  FileText,
  StopCircle,
  Info,
  Eye,
  EyeOff
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { PageLoader } from "@/components/ui-states"
import type { Sesion } from "@/lib/types"
import {
  endSession,
  patchSessionTime,
  getConversationHistory,
  getSession,
  listProfiles,
  listScenarios,
  connectConversationStream,
  startSession,
  type BackendProfile,
  type BackendScenario,
  type BackendSession,
} from "@/lib/backend-api"
import { toast } from "sonner"


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

type TimerCheckpoint = { total: number; ts: number }
const cpKey = (sid: string) => `timer_cp_${sid}`


function SessionContextPanel({
  profile,
  scenario,
}: {
  profile: BackendProfile | null
  scenario: BackendScenario | null
}) {
  const traits = (profile?.traits ?? {}) as Record<string, unknown>
  const behavior = (profile?.behavior ?? {}) as Record<string, unknown>

  const age = typeof traits.age === 'number' ? traits.age : undefined
  const occupation = typeof traits.occupation === 'string' && traits.occupation ? traits.occupation : undefined
  const personality = Array.isArray(traits.personality) ? (traits.personality as string[]) : []
  const commStyle = Array.isArray(traits.communication_style) ? (traits.communication_style as string[]) : []
  const bMax = typeof behavior.behavior_max === 'number' ? behavior.behavior_max : 5
  const triggers = Array.isArray(behavior.triggers)
    ? (behavior.triggers as { name: string; description: string }[])
    : []
  const regulators = Array.isArray(behavior.regulators)
    ? (behavior.regulators as { name: string; description: string }[])
    : []

  const escenarioDescription = typeof scenario?.constraints?.description === 'string'
    ? scenario.constraints.description
    : ''

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
              <h3 className="text-lg font-semibold">{profile?.name ?? 'Perfil'}</h3>
              <p className="text-sm text-muted-foreground">
                {age ? `${age} años` : 'Edad no especificada'}
                {occupation ? ` · ${occupation}` : ''}
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              {profile?.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Descripción</h4>
                  <p className="mt-1 text-sm">{profile.description}</p>
                </div>
              )}

              {personality.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Personalidad</h4>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {personality.map((p) => (
                      <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {commStyle.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Estilo de comunicación</h4>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {commStyle.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Severidad máxima</h4>
                <div className="mt-1">
                  <SeverityGauge level={bMax} size="sm" showValue />
                </div>
              </div>

              {triggers.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Disparadores</h4>
                  <ul className="mt-1 space-y-2">
                    {triggers.map((t) => (
                      <li key={t.name} className="text-sm">
                        <span className="font-medium">{t.name}</span>
                        {t.description && (
                          <span className="text-muted-foreground"> — {t.description}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {regulators.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Reguladores</h4>
                  <ul className="mt-1 space-y-2">
                    {regulators.map((r) => (
                      <li key={r.name} className="text-sm">
                        <span className="font-medium">{r.name}</span>
                        {r.description && (
                          <span className="text-muted-foreground"> — {r.description}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="escenario" className="mt-0 h-[calc(100%-41px)]">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{scenario?.name ?? 'Escenario'}</h3>
              <div className="mt-2">
                <SeverityGauge level={Math.max(0, Math.min(5, scenario?.severity ?? 1))} size="sm" showValue />
              </div>
            </div>

            <Separator />

            {escenarioDescription && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Descripción</h4>
                <p className="mt-1 text-sm">{escenarioDescription}</p>
              </div>
            )}

            {scenario?.context && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Contexto de la situación</h4>
                <p className="mt-1 text-sm">{scenario.context}</p>
              </div>
            )}

            {(scenario?.risk_flags ?? []).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Banderas de riesgo</h4>
                <ul className="mt-2 space-y-2">
                  {(scenario?.risk_flags ?? []).map((flag) => (
                    <li key={flag} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                      <span>{flag}</span>
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

  // ── Timer de práctica efectiva ────────────────────────────────────────────
  const [accSeconds, setAccSeconds] = useState(0)       // consolidado en backend
  const [displaySeconds, setDisplaySeconds] = useState(0) // local, sin requests
  const segmentStartRef = useRef<number | null>(null)  // null = timer pausado
  const accSecondsRef = useRef(0)                    // espejo de accSeconds para callbacks
  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const heartbeatRef = useRef<ReturnType<typeof setInterval>>()
  const lastActivityRef = useRef<number>(0)
  const timerSessionId = useRef<string | null>(null)  // sessionId activo en el timer

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const desktopTextareaRef = useRef<HTMLTextAreaElement>(null)
  const mobileTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Admin puede cambiar entre vistas
  const [teacherViewOverride, setTeacherViewOverride] = useState<boolean | null>(null)
  const [finalizeOpen, setFinalizeOpen] = useState(false)
  const [statusSheetOpen, setStatusSheetOpen] = useState(false)
  const isAdmin = userRole === "admin"
  const effectiveTeacherView = teacherViewOverride ?? (userRole === "teacher" || userRole === "admin")

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
          setSessionStatus(session.status ?? (session.ended_at ? "completed" : "active"))

          const serverAcc = session.accumulated_seconds ?? 0
          let localAcc = serverAcc
          accSecondsRef.current = serverAcc

          // Reconcile localStorage checkpoint vs server value
          const raw = localStorage.getItem(cpKey(sessionId))
          if (raw) {
            try {
              const cp: TimerCheckpoint = JSON.parse(raw)
              if (cp.total > serverAcc) {
                const diff = cp.total - serverAcc
                await patchSessionTime(sessionId, diff)
                localAcc = cp.total
                accSecondsRef.current = cp.total
              }
            } catch { /* ignore malformed checkpoint */ }
            localStorage.removeItem(cpKey(sessionId))
          }

          setAccSeconds(localAcc)
          setDisplaySeconds(localAcc)
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


  // Auto-scroll al último mensaje. El ScrollArea de radix usa un viewport
  // interno [data-radix-scroll-area-viewport]: buscamos ese y le aplicamos
  // scrollTop directo. Si no, fallback a scrollIntoView.
  useEffect(() => {
    const end = messagesEndRef.current
    if (!end) return
    const viewport = end.closest('[data-radix-scroll-area-viewport]') as HTMLElement | null
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' })
    } else {
      end.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, isLoading])

  // Cargar historial de mensajes al iniciar sesión o cambiar de sesión activa.
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // ── Timer: primitivas ─────────────────────────────────────────────────────

  const stopHeartbeat = useCallback(() => {
    clearInterval(heartbeatRef.current)
  }, [])

  const flushDelta = useCallback(async (delta: number, sid: string | null) => {
    if (delta <= 0 || !sid) return
    try { await patchSessionTime(sid, delta) } catch { /* silencioso */ }
  }, [])

  const stopSegment = useCallback((): number => {
    const start = segmentStartRef.current
    if (start === null) return 0
    segmentStartRef.current = null
    clearTimeout(idleTimerRef.current)
    stopHeartbeat()
    const delta = Math.floor((Date.now() - start) / 1000)
    if (delta > 0) {
      accSecondsRef.current += delta
      setAccSeconds(prev => prev + delta)
    }
    return delta
  }, [stopHeartbeat])

  const startHeartbeat = useCallback(() => {
    stopHeartbeat()
    heartbeatRef.current = setInterval(() => {
      const start = segmentStartRef.current
      if (start === null) return
      const delta = Math.floor((Date.now() - start) / 1000)
      if (delta <= 0) return
      segmentStartRef.current = Date.now()
      accSecondsRef.current += delta
      setAccSeconds(prev => prev + delta)
      const sid = timerSessionId.current
      if (sid) {
        localStorage.setItem(cpKey(sid), JSON.stringify({ total: accSecondsRef.current, ts: Date.now() }))
        void flushDelta(delta, sid)
      }
    }, 30_000)
  }, [stopHeartbeat, flushDelta])

  const resetIdle = useCallback(() => {
    clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(async () => {
      const delta = stopSegment()
      const sid = timerSessionId.current
      if (delta > 0 && sid) {
        localStorage.setItem(cpKey(sid), JSON.stringify({ total: accSecondsRef.current, ts: Date.now() }))
      }
      await flushDelta(delta, sid)
    }, 10 * 60 * 1000)          // 10 minutos
  }, [stopSegment, flushDelta])

  const startSegment = useCallback((status: Sesion["status"]) => {
    if (segmentStartRef.current !== null) return  // ya corriendo
    if (status !== 'active') return
    if (document.visibilityState !== 'visible') return
    segmentStartRef.current = Date.now()
    startHeartbeat()
    resetIdle()
  }, [startHeartbeat, resetIdle])

  // ── Timer: iniciar cuando la sesión activa carga ──────────────────────────
  useEffect(() => {
    if (!sessionId || sessionStatus !== 'active') return
    timerSessionId.current = sessionId
    startSegment(sessionStatus)
    return () => {
      const delta = stopSegment()
      const sid = timerSessionId.current
      if (delta > 0 && sid) {
        localStorage.setItem(cpKey(sid), JSON.stringify({ total: accSecondsRef.current, ts: Date.now() }))
      }
      void flushDelta(delta, sid)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, sessionStatus])

  // ── Timer: beacon helper (funciona en visibilitychange + pagehide) ────────
  const sendBeaconFlush = useCallback(() => {
    const delta = stopSegment()
    if (delta <= 0 || !timerSessionId.current) return
    const sid = timerSessionId.current
    // Escribir checkpoint ANTES del beacon (síncrono, nunca falla)
    localStorage.setItem(cpKey(sid), JSON.stringify({ total: accSecondsRef.current, ts: Date.now() }))
    const body = JSON.stringify({ delta_seconds: delta })
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'}/sessions/${sid}/time`
    const sent = navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
    if (!sent) void flushDelta(delta, sid)  // fallback si sendBeacon falla
  }, [stopSegment, flushDelta])

  // ── Timer: visibilitychange ───────────────────────────────────────────────
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        sendBeaconFlush()
      } else {
        startSegment(sessionStatus)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [sessionStatus, startSegment, sendBeaconFlush])

  // ── Timer: pagehide (recarga / cierre de tab; más fiable que beforeunload) ─
  useEffect(() => {
    const onPageHide = () => sendBeaconFlush()
    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [sendBeaconFlush])

  // ── Timer: detección de actividad (throttled, 10 s) ───────────────────────
  useEffect(() => {
    const onActivity = () => {
      const now = Date.now()
      if (now - lastActivityRef.current < 10_000) return
      lastActivityRef.current = now
      if (segmentStartRef.current !== null) {
        resetIdle()
      } else if (sessionStatus === 'active' && document.visibilityState === 'visible') {
        startSegment(sessionStatus)
      }
    }
    document.addEventListener('pointermove', onActivity)
    document.addEventListener('keydown', onActivity)
    return () => {
      document.removeEventListener('pointermove', onActivity)
      document.removeEventListener('keydown', onActivity)
    }
  }, [sessionStatus, startSegment, resetIdle])

  // ── Timer: display en tiempo real (solo UI, 0 requests) ───────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const live = segmentStartRef.current !== null
        ? Math.floor((Date.now() - segmentStartRef.current) / 1000)
        : 0
      setDisplaySeconds(prev => {
        const next = accSeconds + live
        return prev === next ? prev : next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [accSeconds])

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

    // Flush del segmento actual antes de enviar (checkpoint natural)
    const preSendDelta = (() => {
      const start = segmentStartRef.current
      if (start === null) return 0
      const delta = Math.floor((Date.now() - start) / 1000)
      segmentStartRef.current = Date.now()  // reinicia el segmento
      setAccSeconds(prev => prev + delta)
      return delta
    })()
    void flushDelta(preSendDelta, sessionForMessage.id)
    resetIdle()

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
    if (desktopTextareaRef.current) desktopTextareaRef.current.style.height = 'auto'
    if (mobileTextareaRef.current) mobileTextareaRef.current.style.height = 'auto'
    setIsLoading(true)

    const assistantId = `assistant-${Date.now()}`
    let placeholderCreated = false

    try {
      const handle = await connectConversationStream(sessionForMessage.id, messageText)

      handle.onChunk((text) => {
        if (!placeholderCreated) {
          placeholderCreated = true
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
        if (activeSession) {
          setActiveSession({ ...activeSession, current_severity: data.severity })
        }
        if (data.should_close) {
          const kind = data.closing_kind
          setSessionStatus(kind === 'crisis' || kind === 'inappropriate' ? 'terminated' : 'completed')
          // El backend ya cerró la sesión vía SSE — solo detenemos el timer local
          const closeDelta = stopSegment()
          void flushDelta(closeDelta, timerSessionId.current)
          if (timerSessionId.current) localStorage.removeItem(cpKey(timerSessionId.current))
          if (activeSession) {
            setActiveSession({
              ...activeSession,
              ended_at: new Date().toISOString(),
              current_severity: data.severity,
            })
          }
          if (kind === "success") {
            toast.success("Sesión completada con éxito. El paciente se siente mejor.")
          } else if (kind === "crisis") {
            toast.error("Sesión terminada por crisis emocional del paciente.")
          } else if (kind === "inappropriate") {
            toast.warning("Sesión terminada por conducta inadecuada.")
          } else {
            toast("Sesión finalizada.")
          }
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
        const delta = stopSegment()
        await flushDelta(delta, activeSession.id)
        await endSession(activeSession.id, 'success')
        localStorage.removeItem(cpKey(activeSession.id))
        setSessionStatus('completed')
        setActiveSession({ ...activeSession, ended_at: new Date().toISOString() })
        router.push(`/evaluacion?sesion=${activeSession.id}`)
      } catch {
        toast.error("No se pudo finalizar la sesión en el backend.")
      }
    })()
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

  if (isBootstrapping) {
    return <PageLoader message="Cargando sesión..." />
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
        <header className="rounded-2xl border border-border/70 bg-background/90 px-3 py-2.5 shadow-sm backdrop-blur sm:px-4 lg:px-5">
          {/* ── Mobile / Tablet ── */}
          <div className="flex flex-col gap-2.5 xl:hidden">
            <div className="flex items-center gap-2">
              <Link href="/sesiones">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </Button>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-base font-semibold leading-tight text-foreground">Sesión de simulación</h1>
                <p className="truncate text-xs text-muted-foreground">
                  {effectiveTeacherView ? `${perfil?.name || "Perfil"} — ${escenario?.name || "Escenario"}` : "Modo exploración"}
                </p>
              </div>
              {effectiveTeacherView && (
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={() => setStatusSheetOpen(true)}>
                  <Info className="h-4 w-4" />
                </Button>
              )}
            </div>
              <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-xs font-medium tabular-nums">{formatTime(displaySeconds)}</span>
                {sesion && effectiveTeacherView && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <SeverityGauge
                      level={activeSession?.current_severity ?? escenario?.severity ?? 0}
                      size="sm"
                      showValue
                    />
                  </>
                )}
              </div>
              <Badge variant={sessionStatus === "active" ? "default" : sessionStatus === "terminated" ? "destructive" : "outline"} className="hidden text-xs sm:inline-flex">
                {sessionStatus === "active" ? "En curso" : sessionStatus === "terminated" ? "Terminada" : "Finalizada"}
              </Badge>
              <div className="ml-auto flex items-center gap-1.5">
                {isAdmin && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setTeacherViewOverride(prev => !prev)} title={effectiveTeacherView ? "Vista estudiante" : "Vista profesor"}>
                    {effectiveTeacherView ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                )}
                <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full sm:w-auto sm:rounded-full sm:px-3" onClick={() => setFinalizeOpen(true)}>
                  <StopCircle className="h-4 w-4 sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline">Finalizar</span>
                </Button>
              </div>
            </div>
          </div>

          {/* ── Desktop ── */}
          <div className="hidden xl:flex xl:items-start xl:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/sesiones">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </Button>
              </Link>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold leading-tight text-foreground">Sesión de simulación</h1>
                <p className="truncate text-sm text-muted-foreground">
                  {effectiveTeacherView ? `${perfil?.name || "Perfil"} - ${escenario?.name || "Escenario"}` : "Modo estudiante: exploración y percepción del caso en entorno abierto"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm font-medium">{formatTime(displaySeconds)}</span>
                {sesion && effectiveTeacherView && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <SeverityGauge
                      level={activeSession?.current_severity ?? escenario?.severity ?? 0}
                      size="sm"
                      showValue
                    />
                  </>
                )}
              </div>
              <Badge variant={sessionStatus === "active" ? "default" : sessionStatus === "terminated" ? "destructive" : "outline"}>
                {sessionStatus === "active" ? "En curso" : sessionStatus === "terminated" ? "Terminada" : "Finalizada"}
              </Badge>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => setTeacherViewOverride(prev => !prev)}>
                  {effectiveTeacherView ? <><EyeOff className="mr-2 h-4 w-4" />Vista estudiante</> : <><Eye className="mr-2 h-4 w-4" />Vista profesor</>}
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={() => setFinalizeOpen(true)}>
                <StopCircle className="mr-2 h-4 w-4" />
                Finalizar
              </Button>
            </div>
          </div>
        </header>

        {/* Shared: finalizar */}
        <AlertDialog open={finalizeOpen} onOpenChange={setFinalizeOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Finalizar la sesión?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción cerrará la sesión de forma permanente y no podrás seguir enviando mensajes. Se generará la evaluación automáticamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleEndSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Sí, finalizar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Shared: estado panel */}
        {effectiveTeacherView && (
          <Sheet open={statusSheetOpen} onOpenChange={setStatusSheetOpen}>
            <SheetContent side="right" className="w-full max-w-sm p-0 sm:max-w-md">
              <SheetHeader className="p-4">
                <SheetTitle>Estado de la sesión</SheetTitle>
              </SheetHeader>
              <div className="h-[calc(100%-68px)]">
                <SessionContextPanel profile={perfil} scenario={escenario} />
              </div>
            </SheetContent>
          </Sheet>
        )}

        <div className="flex min-h-0 flex-1 gap-3">
          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/85 shadow-sm">
            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
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
                {/* ── Mobile messages ── */}
                <div className="space-y-3 sm:hidden">
                  {messages.map((message) => {
                    const isUser = message.role === "user"
                    return (
                      <div
                        key={message.id}
                        className={`flex w-full items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}
                      >
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                          isUser ? "bg-accent text-accent-foreground" : "bg-muted"
                        }`}>
                          {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                        </div>
                        <div className={`flex min-w-0 flex-1 flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
                          <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                            isUser ? "bg-accent text-accent-foreground" : "border bg-background"
                          }`}>
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed [overflow-wrap:anywhere]">{message.content}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(message.timestamp).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {message.metadata?.riskFlags && message.metadata.riskFlags.length > 0 && (
                              <Badge variant="destructive" className="gap-1 text-[10px]">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                Alerta
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* ── Desktop messages ── */}
                <div className="hidden space-y-4 sm:block">
                  {messages.map((message) => {
                    const isUser = message.role === "user"
                    return (
                      <div
                        key={message.id}
                        className={`flex w-full items-end gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          isUser ? "bg-accent text-accent-foreground" : "bg-muted"
                        }`}>
                          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className={`flex min-w-0 flex-1 flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isUser ? "bg-accent text-accent-foreground" : "border bg-background"
                          }`}>
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed [overflow-wrap:anywhere]">{message.content}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.timestamp).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
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
                    )
                  })}
                </div>
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
            </div>

            {/* Mobile input */}
            <div className="border-t bg-background/95 px-2 py-1.5 sm:hidden">
              <div className="flex items-end gap-2">
                <div className="flex flex-1 items-end rounded-full border border-border/60 bg-muted/40 px-4 py-0.5">
                  <Textarea
                    ref={mobileTextareaRef}
                    placeholder=""
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onInput={(e) => {
                      const el = e.currentTarget
                      el.style.height = 'auto'
                      el.style.height = Math.min(el.scrollHeight, 160) + 'px'
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                    disabled={sessionStatus !== "active"}
                    rows={1}
                    className="flex-1 min-h-[32px] max-h-[160px] min-w-0 resize-none overflow-y-auto overflow-x-hidden border-0 bg-transparent py-[6px] text-left text-[12px] leading-4 shadow-none placeholder:text-left placeholder:text-muted-foreground break-all focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading || sessionStatus !== "active"}
                  className="h-7 w-7 shrink-0 rounded-full bg-slate-700 text-white shadow-sm hover:bg-slate-800 disabled:opacity-30"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Desktop input — barra delgada, elegante y distinguible */}
            <div className="hidden border-t bg-background/95 px-2 py-1.5 sm:block">
              <div className="flex items-end gap-2">
                <div className="flex flex-1 items-end rounded-full border border-border/60 bg-muted/40 px-4 py-0.5">
                  <Textarea
                    ref={desktopTextareaRef}
                    placeholder="Escribe tu intervención…"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onInput={(e) => {
                      const el = e.currentTarget
                      el.style.height = 'auto'
                      el.style.height = Math.min(el.scrollHeight, 160) + 'px'
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                    disabled={sessionStatus !== "active"}
                    rows={1}
                    className="flex-1 min-h-[32px] max-h-[160px] min-w-0 resize-none overflow-y-auto overflow-x-hidden border-0 bg-transparent py-[6px] text-left text-[12px] leading-4 shadow-none placeholder:text-left placeholder:text-muted-foreground break-all focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading || sessionStatus !== "active"}
                  className="h-7 w-7 shrink-0 rounded-full bg-slate-700 text-white shadow-sm hover:bg-slate-800 disabled:opacity-30"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </section>

          {effectiveTeacherView ? (
            <aside className="hidden overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-sm lg:block lg:w-80 xl:w-96">
              <SessionContextPanel profile={perfil} scenario={escenario} />
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
                  <p className="text-sm text-muted-foreground">
                    Identificar señales emocionales y responder con preguntas
                    abiertas y lenguaje de apoyo.
                  </p>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}

function ChatPageInner() {
  return <ChatPageContent />
}

export default function ChatPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ChatPageInner />
    </Suspense>
  )
}
