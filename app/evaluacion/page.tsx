"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ClipboardCheck, Search, ArrowRight, CheckCircle, Clock } from "lucide-react"
import { toast } from "sonner"
import { listEvaluations, type EvaluationListItem } from "@/lib/backend-api"
import { useAuth } from "@/lib/auth-context"
import EvaluationDetail from "./detail"

function EvaluacionRouter() {
  const params = useSearchParams()
  const sessionId = params.get("sesion")
  return sessionId ? <EvaluationDetail sessionId={sessionId} /> : <EvaluationList />
}

function EvaluationList() {
  const router = useRouter()
  const { userRole } = useAuth()
  const isStaff = userRole === "teacher" || userRole === "admin"

  const [items, setItems] = useState<EvaluationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

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

  const filtered = !search.trim()
    ? items
    : items.filter((e) =>
        (e.patient_name ?? "").toLowerCase().includes(search.toLowerCase())
      )

  const submitted = filtered.filter((e) => e.status !== "draft")
  const drafts = filtered.filter((e) => e.status === "draft")

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

      <div className="mb-4 mt-4 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre del paciente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Cargando…</CardContent></Card>
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
                <Button className="mt-3" size="sm">Ir a sesiones <ArrowRight className="ml-1 h-4 w-4" /></Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {isStaff && drafts.length > 0 && (
            <div className="mb-6">
              <p className="mb-2 text-sm font-medium">
                Pendientes de revisar <Badge variant="secondary" className="ml-1">{drafts.length}</Badge>
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {drafts.map((e) => <EvaluationCard key={e.id} ev={e} onOpen={() => router.push(`/evaluacion?sesion=${e.session_id}`)} />)}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-medium">
              {isStaff ? "Evaluadas" : "Mis evaluaciones"}
              <Badge variant="secondary" className="ml-1">{submitted.length}</Badge>
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {submitted.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún ninguna evaluación enviada.</p>
              ) : submitted.map((e) => <EvaluationCard key={e.id} ev={e} onOpen={() => router.push(`/evaluacion?sesion=${e.session_id}`)} />)}
            </div>
          </div>
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
    <Card className="cursor-pointer transition hover:border-primary/60 hover:shadow-sm" onClick={onOpen}>
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <p className="font-medium">{ev.patient_name ?? "Paciente"}</p>
          {ev.status === "submitted" || ev.status === "reviewed" ? (
            <Badge variant="default" className="gap-1 text-xs"><CheckCircle className="h-3 w-3" /> Evaluada</Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 text-xs"><Clock className="h-3 w-3" /> Pendiente</Badge>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 border-t pt-3 text-xs">
          <div><p className="text-muted-foreground">Turnos</p><p className="font-medium">{turns}</p></div>
          <div><p className="text-muted-foreground">Duración</p><p className="font-medium">{dur != null ? `${dur.toFixed(1)} min` : "—"}</p></div>
          <div><p className="text-muted-foreground">Sev. final</p><p className="font-medium">{sevFinal ?? "—"}</p></div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function EvaluacionPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted-foreground">Cargando…</div>}>
      <EvaluacionRouter />
    </Suspense>
  )
}
