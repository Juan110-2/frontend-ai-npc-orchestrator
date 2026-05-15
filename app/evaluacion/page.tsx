"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ClipboardCheck, Search, ArrowRight, CheckCircle, Clock, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { listEvaluations, type EvaluationListItem } from "@/lib/backend-api"
import { useAuth } from "@/lib/auth-context"
import { Paginator, paginate } from "@/components/paginator"
import { PageLoader, LoadingState } from "@/components/ui-states"
import { cn } from "@/lib/utils"
import EvaluationDetail from "./detail"

function EvaluacionRouter() {
  const params = useSearchParams()
  const sessionId = params.get("sesion")
  return sessionId ? <EvaluationDetail sessionId={sessionId} /> : <EvaluationList />
}

function EvaluationList() {
  const router = useRouter()
  const { user, userRole } = useAuth()
  const isStaff = userRole === "teacher" || userRole === "admin"
  const currentUserId = user?.id ?? null

  const [items, setItems] = useState<EvaluationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<"mine" | "students">("mine")

  const [mySearch, setMySearch] = useState("")
  const [myDraftPage, setMyDraftPage] = useState(1)
  const [mySubmittedPage, setMySubmittedPage] = useState(1)

  const [studentSearch, setStudentSearch] = useState("")
  const [studentDraftPage, setStudentDraftPage] = useState(1)
  const [studentSubmittedPage, setStudentSubmittedPage] = useState(1)

  useEffect(() => {
    void (async () => {
      try {
        setItems(await listEvaluations())
      } catch (err) {
        toast.error("No se pudo cargar la lista de evaluaciones: " + String(err))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => { setMyDraftPage(1); setMySubmittedPage(1) }, [mySearch])
  useEffect(() => { setStudentDraftPage(1); setStudentSubmittedPage(1) }, [studentSearch])

  const rawMine = items.filter(e => !e.student_id || e.student_id === currentUserId)
  const rawStudents = items.filter(e => !!e.student_id && e.student_id !== currentUserId)

  const isMine = activeSection === "mine"
  const currentSearch = isMine ? mySearch : studentSearch
  const setCurrentSearch = isMine ? setMySearch : setStudentSearch
  const draftPage = isMine ? myDraftPage : studentDraftPage
  const setDraftPage = isMine ? setMyDraftPage : setStudentDraftPage
  const submittedPage = isMine ? mySubmittedPage : studentSubmittedPage
  const setSubmittedPage = isMine ? setMySubmittedPage : setStudentSubmittedPage
  const rawCurrent = isMine ? rawMine : rawStudents

  const filtered = !currentSearch.trim()
    ? rawCurrent
    : rawCurrent.filter(e =>
      (e.patient_name ?? "").toLowerCase().includes(currentSearch.toLowerCase()) ||
      (e.student_name ?? "").toLowerCase().includes(currentSearch.toLowerCase())
    )

  const drafts = filtered.filter(e => e.status === "draft")
  const submitted = filtered.filter(e => e.status !== "draft")

  const openDetail = (sessionId: string) => router.push(`/evaluacion?sesion=${sessionId}`)

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Evaluaciones"
        description={
          isStaff
            ? "Todas las sesiones evaluables del sistema"
            : "Tus sesiones de práctica y su retroalimentación"
        }
      />

      {/* Tabs primarios — solo para staff cuando hay evaluaciones de estudiantes */}
      {isStaff && rawStudents.length > 0 && (
        <div className="mb-5 flex border-b">
          <button
            onClick={() => setActiveSection("mine")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              isMine
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Mis evaluaciones ({rawMine.length})
          </button>
          <button
            onClick={() => setActiveSection("students")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              !isMine
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            De mis estudiantes ({rawStudents.length})
          </button>
        </div>
      )}

      <div className="mb-4 mt-4 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={isMine ? "Buscar por perfil…" : "Buscar por perfil o estudiante…"}
            value={currentSearch}
            onChange={(e) => setCurrentSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <Card><CardContent><LoadingState className="py-8" /></CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ClipboardCheck className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {items.length === 0
                ? "Aún no hay evaluaciones. Realiza una sesión y se crearán automáticamente al cerrarla."
                : "No hay resultados para tu búsqueda."}
            </p>
            {items.length === 0 && (
              <Link href="/sesiones">
                <Button className="mt-3" size="sm">
                  Ir a sesiones <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {isStaff && drafts.length > 0 && (
            <section className="mb-6">
              <p className="mb-2 text-sm font-medium">
                Pendientes de revisar
                <Badge variant="secondary" className="ml-1">{drafts.length}</Badge>
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {paginate(drafts, draftPage).map(e => (
                  <EvaluationCard key={e.id} ev={e} onOpen={() => openDetail(e.session_id)} />
                ))}
              </div>
              <Paginator total={drafts.length} page={draftPage} onPageChange={setDraftPage} />
            </section>
          )}

          <section>
            <p className="mb-2 text-sm font-medium">
              Evaluadas
              <Badge variant="secondary" className="ml-1">{submitted.length}</Badge>
            </p>
            {submitted.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún ninguna evaluación enviada.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {paginate(submitted, submittedPage).map(e => (
                    <EvaluationCard key={e.id} ev={e} onOpen={() => openDetail(e.session_id)} />
                  ))}
                </div>
                <Paginator total={submitted.length} page={submittedPage} onPageChange={setSubmittedPage} />
              </>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function EvaluationCard({ ev, onOpen }: { ev: EvaluationListItem; onOpen: () => void }) {
  const metrics = ev.automatic_metrics as Record<string, unknown>
  const turns = (metrics?.turns_trainee as number | undefined) ?? 0
  const dur = (metrics?.duration_minutes as number | undefined) ?? null
  const sevFinal = (metrics?.severity_final as number | undefined) ?? null

  return (
    <Card
      className="cursor-pointer transition hover:border-primary/60 hover:shadow-sm"
      onClick={onOpen}
    >
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium">{ev.patient_name ?? "Paciente"}</p>
            {ev.student_name && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <UserCheck className="h-3 w-3 shrink-0" />
                {ev.student_name}
              </p>
            )}
          </div>
          {ev.status === "submitted" || ev.status === "reviewed" ? (
            <Badge variant="default" className="gap-1 text-xs">
              <CheckCircle className="h-3 w-3" /> Evaluada
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Clock className="h-3 w-3" /> Pendiente
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 border-t pt-3 text-xs">
          <div>
            <p className="text-muted-foreground">Turnos</p>
            <p className="font-medium">{turns}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Duración</p>
            <p className="font-medium">{dur != null ? `${dur.toFixed(1)} min` : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Sev. final</p>
            <p className="font-medium">{sevFinal ?? "—"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function EvaluacionPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <EvaluacionRouter />
    </Suspense>
  )
}
