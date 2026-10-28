"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClipboardCheck, Search, ArrowRight, CheckCircle, Clock, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { listEvaluations, type EvaluationListItem } from "@/lib/api"
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
  const [activeSection, setActiveSection] = useState<"mine" | "students" | "all">("mine")

  const [mySearch, setMySearch] = useState("")
  const [myDraftPage, setMyDraftPage] = useState(1)
  const [mySubmittedPage, setMySubmittedPage] = useState(1)

  const [studentSearch, setStudentSearch] = useState("")
  const [studentDraftPage, setStudentDraftPage] = useState(1)
  const [studentSubmittedPage, setStudentSubmittedPage] = useState(1)

  const [allSearch, setAllSearch] = useState("")
  const [allDraftPage, setAllDraftPage] = useState(1)
  const [allSubmittedPage, setAllSubmittedPage] = useState(1)
  const [assignerFilter, setAssignerFilter] = useState("all")
  const [studentFilter, setStudentFilter] = useState("all")

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
  useEffect(() => { setAllDraftPage(1); setAllSubmittedPage(1) }, [allSearch])
  useEffect(() => { setAssignerFilter("all"); setStudentFilter("all") }, [activeSection])

  // "mine": propias  |  "students": asignadas por mí  |  "all": todo (solo admin)
  const rawMine = items.filter(e => e.student_id === currentUserId)
  const rawStudents = items.filter(e =>
    e.student_id !== currentUserId && e.assigned_by_id === currentUserId
  )
  const rawAll = items.filter(e => e.student_id !== currentUserId)

  const isMine = activeSection === "mine"
  const isAll = activeSection === "all"
  const isAdmin = userRole === "admin"

  const currentSearch = isMine ? mySearch : isAll ? allSearch : studentSearch
  const setCurrentSearch = isMine ? setMySearch : isAll ? setAllSearch : setStudentSearch
  const draftPage = isMine ? myDraftPage : isAll ? allDraftPage : studentDraftPage
  const setDraftPage = isMine ? setMyDraftPage : isAll ? setAllDraftPage : setStudentDraftPage
  const submittedPage = isMine ? mySubmittedPage : isAll ? allSubmittedPage : studentSubmittedPage
  const setSubmittedPage = isMine ? setMySubmittedPage : isAll ? setAllSubmittedPage : setStudentSubmittedPage
  const rawCurrent = isMine ? rawMine : isAll ? rawAll : rawStudents

  const uniqueAssigners = isAll ? (() => {
    const map = new Map<string, string>()
    rawAll.forEach(e => {
      if (e.assigned_by_id && e.assigned_by_id !== currentUserId)
        map.set(e.assigned_by_id, e.assigned_by_name ?? e.assigned_by_id.slice(0, 8))
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  })() : []

  const uniqueStudents = isAll ? (() => {
    const map = new Map<string, string>()
    rawAll.forEach(e => {
      if (e.student_id && e.student_id !== currentUserId)
        map.set(e.student_id, e.student_name ?? e.student_id.slice(0, 8))
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  })() : []

  const filtered = rawCurrent.filter(e => {
    const q = currentSearch.toLowerCase()
    const matchesSearch = !currentSearch.trim() ||
      (e.patient_name ?? "").toLowerCase().includes(q) ||
      (e.student_name ?? "").toLowerCase().includes(q)
    const matchesAssigner = !isAll || assignerFilter === "all" || e.assigned_by_id === assignerFilter
    const matchesStudent = !isAll || studentFilter === "all" || e.student_id === studentFilter
    return matchesSearch && matchesAssigner && matchesStudent
  })

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

      {/* Tabs primarios */}
      {isStaff && (
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
              activeSection === "students"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            De mis estudiantes ({rawStudents.length})
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveSection("all")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                isAll
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Todas ({isAll ? rawAll.length : "…"})
            </button>
          )}
        </div>
      )}

      <div className="mb-4 mt-4 flex flex-wrap items-center gap-3">
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
            <Select value={studentFilter} onValueChange={setStudentFilter}>
              <SelectTrigger className="min-w-36">
                <SelectValue placeholder="Todos los estudiantes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estudiantes</SelectItem>
                {uniqueStudents.map(({ id, name }) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(assignerFilter !== "all" || studentFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setAssignerFilter("all"); setStudentFilter("all") }}
                className="text-muted-foreground"
              >
                Limpiar filtros
              </Button>
            )}
          </>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={isMine ? "Buscar por perfil…" : "Buscar por perfil o estudiante…"}
            value={currentSearch}
            onChange={(e) => setCurrentSearch(e.target.value)}
            className="pl-9 sm:w-64"
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
          {drafts.length > 0 && (
            <section className="mb-6">
              <p className="mb-2 text-sm font-medium">
                {isStaff ? "Pendientes de revisar" : "Esperando la calificación de tu docente"}
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
  const durSource = (metrics?.duration_source as string | undefined) ?? null
  const sevFinal = (metrics?.severity_final as number | undefined) ?? null

  return (
    <Card
      className="cursor-pointer transition hover:border-primary/60 hover:shadow-sm"
      onClick={onOpen}
    >
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium">{ev.patient_name ?? "NPC"}</p>
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
            <p className="font-medium">
              {dur != null ? `${durSource === "estimated" ? "~" : ""}${dur.toFixed(1)} min` : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Sev. final</p>
            <p className="font-medium">{sevFinal != null ? sevFinal.toFixed(1) : "—"}</p>
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
