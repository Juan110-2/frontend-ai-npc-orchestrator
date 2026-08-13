"use client"

import { Fragment, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, RefreshCw, BarChart3, ListTree, ScrollText, ChevronDown, ChevronRight, Search, X } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import {
  getMetricsSummary,
  getProviderMetrics,
  getMetricsCalls,
  type MetricsSummary,
  type ProviderMetricRow,
  type AICallLogRow,
} from "@/lib/api"

const CALLS_PAGE_SIZE = 15

export default function AdminMetricsPage() {
  const router = useRouter()
  const { userRole, isLoading: authLoading } = useAuth()

  // ── datos globales ──────────────────────────────────────────────────────────
  const [summary, setSummary] = useState<MetricsSummary | null>(null)
  const [providers, setProviders] = useState<ProviderMetricRow[]>([])
  const [loading, setLoading] = useState(true)

  // ── filtros tabla "Por proveedor" (server: purpose / client: provider) ──────
  const [purposeFilter, setPurposeFilter] = useState<string>("all")
  const [providerFilter, setProviderFilter] = useState<string>("all")

  // ── estado tabla "Logs crudos" ──────────────────────────────────────────────
  const [calls, setCalls] = useState<AICallLogRow[]>([])
  const [callsTotal, setCallsTotal] = useState(0)
  const [callsPage, setCallsPage] = useState(1)
  const [callsPurpose, setCallsPurpose] = useState<string>("all")
  const [callsProvider, setCallsProvider] = useState<string>("all")
  const [callsSessionInput, setCallsSessionInput] = useState<string>("")   // texto del input
  const [callsSessionId, setCallsSessionId] = useState<string>("")         // valor comprometido
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null)
  const [callsLoading, setCallsLoading] = useState(false)

  // ── carga ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && userRole !== 'admin') router.replace('/')
  }, [authLoading, userRole, router])

  const loadCalls = useCallback(async (
    page: number,
    purpose: string,
    provider: string,
    sessionId: string,
  ) => {
    setCallsLoading(true)
    try {
      const result = await getMetricsCalls({
        limit: CALLS_PAGE_SIZE,
        offset: (page - 1) * CALLS_PAGE_SIZE,
        purpose: purpose === "all" ? undefined : purpose,
        provider: provider === "all" ? undefined : provider,
        session_id: sessionId.trim() || undefined,
      })
      setCalls(result.items)
      setCallsTotal(result.total)
      setExpandedCallId(null)
    } catch (err) {
      toast.error("Error cargando llamadas: " + String(err))
    } finally {
      setCallsLoading(false)
    }
  }, [])

  const loadAll = async (purpose?: string) => {
    setLoading(true)
    try {
      const [s, p] = await Promise.all([
        getMetricsSummary(),
        getProviderMetrics(purpose === "all" ? undefined : purpose),
      ])
      setSummary(s)
      setProviders(p)
    } catch (err) {
      toast.error("Error cargando métricas: " + String(err))
    } finally {
      setLoading(false)
    }
    void loadCalls(1, callsPurpose, callsProvider, callsSessionId)
  }

  // recarga la tabla de proveedores cuando cambia el filtro server-side
  useEffect(() => {
    if (!authLoading && userRole === 'admin') void loadAll(purposeFilter)
  }, [purposeFilter, authLoading, userRole])

  // recarga logs cuando cambian sus filtros
  useEffect(() => {
    if (!authLoading && userRole === 'admin') {
      setCallsPage(1)
      void loadCalls(1, callsPurpose, callsProvider, callsSessionId)
    }
  }, [callsPurpose, callsProvider, callsSessionId, authLoading, userRole, loadCalls])

  // ── handlers ────────────────────────────────────────────────────────────────
  const handleCallsPageChange = (newPage: number) => {
    setCallsPage(newPage)
    void loadCalls(newPage, callsPurpose, callsProvider, callsSessionId)
  }

  const handleSessionSearch = () => {
    setCallsSessionId(callsSessionInput)
    setCallsPage(1)
  }

  const handleClearSession = () => {
    setCallsSessionInput("")
    setCallsSessionId("")
    setCallsPage(1)
  }

  // ── derivados ───────────────────────────────────────────────────────────────
  const uniqueProviders = [...new Set(providers.map(r => r.provider))].sort()
  const filteredProviders = providers.filter(
    r => providerFilter === "all" || r.provider === providerFilter
  )

  if (authLoading || userRole !== 'admin') return null

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title="Métricas técnicas"
          description="Telemetría de llamadas a APIs de IA (Capítulo 3)"
        />
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => loadAll(purposeFilter)} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Recargar
        </Button>
      </div>

      {/* Totales */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Llamadas totales" value={summary.totals.total_calls} />
          <StatCard label="Tasa de éxito" value={`${pct(summary.totals.total_ok, summary.totals.total_calls)} %`} />
          <StatCard label="Errores" value={summary.totals.total_errors} highlight={summary.totals.total_errors > 0 ? "destructive" : undefined} />
          <StatCard label="Tokens totales" value={(summary.totals.total_tokens_in + summary.totals.total_tokens_out).toLocaleString()} />
          <StatCard label="Costo total (USD)" value={`$${(summary.totals.total_cost_usd ?? 0).toFixed(6)}`} />
          <StatCard label="Proveedores activos" value={summary.totals.n_providers} />
          <StatCard label="Sesiones cubiertas" value={summary.totals.n_sessions} />
          <StatCard label="Tokens IN / OUT" value={`${summary.totals.total_tokens_in.toLocaleString()} / ${summary.totals.total_tokens_out.toLocaleString()}`} />
        </div>
      )}

      <Tabs defaultValue="providers">
        <div className="overflow-x-auto">
          <TabsList className="w-max">
            <TabsTrigger value="providers"><BarChart3 className="mr-2 h-4 w-4" /> Por proveedor</TabsTrigger>
            <TabsTrigger value="purposes"><ListTree className="mr-2 h-4 w-4" /> Por propósito</TabsTrigger>
            <TabsTrigger value="calls"><ScrollText className="mr-2 h-4 w-4" /> Logs crudos</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Por proveedor ── */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="space-y-4">
                <div>
                  <CardTitle>Matriz comparativa por proveedor / modelo / propósito</CardTitle>
                  <CardDescription>Fuente: <code>public.v_provider_metrics</code></CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                    <SelectTrigger className="w-56 h-8 text-sm"><SelectValue placeholder="Propósito" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los propósitos</SelectItem>
                      <SelectItem value="orchestrator">Orchestrator</SelectItem>
                      <SelectItem value="classifier">Classifier</SelectItem>
                      <SelectItem value="evaluator">Evaluator</SelectItem>
                      <SelectItem value="bench">Bench</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={providerFilter} onValueChange={setProviderFilter}>
                    <SelectTrigger className="w-56 h-8 text-sm"><SelectValue placeholder="IA" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los proveedores</SelectItem>
                      {uniqueProviders.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Propósito</TableHead>
                      <TableHead className="text-right">N</TableHead>
                      <TableHead className="text-right">% éxito</TableHead>
                      <TableHead className="text-right">p50 ms</TableHead>
                      <TableHead className="text-right">p95 ms</TableHead>
                      <TableHead className="text-right">p99 ms</TableHead>
                      <TableHead className="text-right">Tokens in (μ)</TableHead>
                      <TableHead className="text-right">Tokens out (μ)</TableHead>
                      <TableHead className="text-right">% JSON válido</TableHead>
                      <TableHead className="text-right">Costo USD</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProviders.map((r, i) => (
                      <TableRow key={i} className="hover:bg-muted/30">
                        <TableCell><Badge variant="secondary">{r.provider}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{r.model}</TableCell>
                        <TableCell><Badge variant="outline">{r.purpose}</Badge></TableCell>
                        <TableCell className="text-right">{r.n_calls}</TableCell>
                        <TableCell className="text-right">{r.success_rate_pct ?? "—"}</TableCell>
                        <TableCell className="text-right">{r.p50_latency_ms != null ? Math.round(r.p50_latency_ms) : "—"}</TableCell>
                        <TableCell className="text-right">{r.p95_latency_ms != null ? Math.round(r.p95_latency_ms) : "—"}</TableCell>
                        <TableCell className="text-right">{r.p99_latency_ms != null ? Math.round(r.p99_latency_ms) : "—"}</TableCell>
                        <TableCell className="text-right">{r.mean_tokens_input != null ? Math.round(r.mean_tokens_input) : "—"}</TableCell>
                        <TableCell className="text-right">{r.mean_tokens_output != null ? Math.round(r.mean_tokens_output) : "—"}</TableCell>
                        <TableCell className="text-right">{r.json_valid_rate_pct ?? "—"}</TableCell>
                        <TableCell className="text-right text-xs">{r.total_cost_usd != null ? `$${r.total_cost_usd.toFixed(6)}` : "—"}</TableCell>
                      </TableRow>
                    ))}
                    {filteredProviders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center text-muted-foreground py-10">
                          No hay datos para estos filtros.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Por propósito ── */}
        <TabsContent value="purposes">
          <Card>
            <CardHeader>
              <CardTitle>Resumen por propósito</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Propósito</TableHead>
                      <TableHead className="text-right">N llamadas</TableHead>
                      <TableHead className="text-right">Latencia media (ms)</TableHead>
                      <TableHead className="text-right">% JSON válido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary?.by_purpose.map((p, i) => (
                      <TableRow key={i} className="hover:bg-muted/30">
                        <TableCell><Badge variant="outline">{p.purpose}</Badge></TableCell>
                        <TableCell className="text-right">{p.n_calls}</TableCell>
                        <TableCell className="text-right">{p.mean_latency_ms ?? "—"}</TableCell>
                        <TableCell className="text-right">{p.json_valid_rate_pct ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {(!summary || summary.by_purpose.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-10">Sin datos</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Logs crudos ── */}
        <TabsContent value="calls">
          <Card>
            <CardHeader>
              <div className="space-y-4">
                <div>
                  <CardTitle>Log de llamadas</CardTitle>
                  <CardDescription>
                    {callsTotal > 0
                      ? <><span>{callsTotal} registros · página {callsPage} de {Math.ceil(callsTotal / CALLS_PAGE_SIZE)}</span><span className="hidden sm:inline"> | {Math.floor(CALLS_PAGE_SIZE / 3)} turnos/página</span></>
                      : "Para auditoría y debugging"}
                  </CardDescription>
                </div>
                {/* Filtros */}
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <Select value={callsProvider} onValueChange={setCallsProvider}>
                    <SelectTrigger className="h-8 text-sm sm:w-52"><SelectValue placeholder="IA" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los proveedores</SelectItem>
                      <SelectItem value="gemini">Gemini</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="deepseek">DeepSeek</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={callsPurpose} onValueChange={setCallsPurpose}>
                    <SelectTrigger className="h-8 text-sm sm:w-48"><SelectValue placeholder="Propósito" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los propósitos</SelectItem>
                      <SelectItem value="orchestrator">Orchestrator</SelectItem>
                      <SelectItem value="classifier">Classifier</SelectItem>
                      <SelectItem value="evaluator">Evaluator</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Input
                      placeholder="Buscar por Session ID…"
                      value={callsSessionInput}
                      onChange={(e) => setCallsSessionInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSessionSearch() }}
                      className="h-8 flex-1 text-sm sm:w-72 sm:flex-none"
                    />
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={handleSessionSearch}>
                      <Search className="h-3.5 w-3.5" />
                    </Button>
                    {callsSessionId && (
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleClearSession}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-6" />
                      <TableHead className="w-44">Fecha y hora</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Propósito</TableHead>
                      <TableHead>Modo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">In</TableHead>
                      <TableHead className="text-right">Out</TableHead>
                      <TableHead className="text-right">Latencia</TableHead>
                      <TableHead className="text-right">TTFT</TableHead>
                      <TableHead className="text-center">JSON</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {callsLoading ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-muted-foreground py-10">Cargando…</TableCell>
                      </TableRow>
                    ) : calls.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-muted-foreground py-10">
                          No hay llamadas para estos filtros.
                        </TableCell>
                      </TableRow>
                    ) : calls.map((c) => {
                      const isExpanded = expandedCallId === c.id
                      const hasDetail = !!(c.error_detail || c.session_id || c.category || c.cost_usd != null || c.response_chars != null)
                      return (
                        <Fragment key={c.id}>
                          <TableRow
                            className={`cursor-pointer transition-colors ${isExpanded ? "bg-muted/50" : "hover:bg-muted/30"}`}
                            onClick={() => setExpandedCallId(isExpanded ? null : c.id)}
                          >
                            <TableCell className="pl-3 pr-1 text-muted-foreground">
                              {hasDetail
                                ? (isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)
                                : <span className="w-3.5 inline-block" />}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {formatDateTime(c.created_at)}
                            </TableCell>
                            <TableCell><Badge variant="secondary" className="text-xs">{c.provider}</Badge></TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{c.purpose}</Badge></TableCell>
                            <TableCell className="text-xs text-muted-foreground">{c.call_mode}</TableCell>
                            <TableCell>
                              <Badge variant={c.status === "ok" ? "default" : "destructive"} className="text-xs">
                                {c.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs">{c.tokens_input ?? "—"}</TableCell>
                            <TableCell className="text-right text-xs">{c.tokens_output ?? "—"}</TableCell>
                            <TableCell className="text-right text-xs">
                              {c.latency_ms != null ? `${Math.round(c.latency_ms)} ms` : "—"}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              {c.ttft_ms != null && c.ttft_ms > 0 ? `${Math.round(c.ttft_ms)} ms` : "—"}
                            </TableCell>
                            <TableCell className="text-center text-xs">
                              {c.json_valid == null ? "—" : c.json_valid
                                ? <span className="text-green-600 font-medium">✓</span>
                                : <span className="text-destructive font-medium">✗</span>}
                            </TableCell>
                          </TableRow>

                          {isExpanded && (
                            <TableRow className="bg-muted/20 hover:bg-muted/20">
                              <TableCell colSpan={11} className="px-6 py-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3 text-xs">
                                  <DetailField label="Modelo" value={c.model} />
                                  <DetailField label="Categoría" value={c.category} />
                                  <DetailField
                                    label="Chars prompt / respuesta"
                                    value={c.prompt_chars != null || c.response_chars != null
                                      ? `${c.prompt_chars ?? "—"} → ${c.response_chars ?? "—"}`
                                      : null}
                                  />
                                  <DetailField
                                    label="Costo USD"
                                    value={c.cost_usd != null ? `$${c.cost_usd.toFixed(8)}` : null}
                                  />
                                  {c.session_id && (
                                    <div className="col-span-2 md:col-span-4">
                                      <p className="text-muted-foreground font-medium mb-0.5">Session ID</p>
                                      <p className="break-all">{c.session_id}</p>
                                    </div>
                                  )}
                                  {c.error_detail && (
                                    <div className="col-span-2 md:col-span-4">
                                      <p className="text-muted-foreground font-medium mb-0.5">Error</p>
                                      <p className="text-destructive whitespace-pre-wrap break-words leading-relaxed">
                                        {formatErrorDetail(c.error_detail)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {callsTotal > CALLS_PAGE_SIZE && (
                <div className="flex flex-col items-center gap-2 text-sm sm:flex-row sm:justify-between">
                  <span className="text-muted-foreground">
                    {(callsPage - 1) * CALLS_PAGE_SIZE + 1}–{Math.min(callsPage * CALLS_PAGE_SIZE, callsTotal)} de {callsTotal}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={callsPage === 1 || callsLoading} onClick={() => handleCallsPageChange(callsPage - 1)}>
                      ← Anterior
                    </Button>
                    <span className="tabular-nums text-muted-foreground px-1 whitespace-nowrap">
                      {callsPage} / {Math.ceil(callsTotal / CALLS_PAGE_SIZE)}
                    </span>
                    <Button variant="outline" size="sm" disabled={callsPage >= Math.ceil(callsTotal / CALLS_PAGE_SIZE) || callsLoading} onClick={() => handleCallsPageChange(callsPage + 1)}>
                      Siguiente →
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: "destructive" }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold ${highlight === "destructive" ? "text-destructive" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

function pct(num: number, den: number) {
  if (!den) return "—"
  return ((num / den) * 100).toFixed(1)
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—"

  return new Date(value).toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

function formatErrorDetail(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        const prefix = raw.slice(0, raw.indexOf(match[0]))
        return prefix + JSON.stringify(JSON.parse(match[0]), null, 2)
      } catch {}
    }
    return raw
  }
}

function DetailField({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  if (!value) return null
  return (
    <div>
      <p className="text-muted-foreground font-medium mb-0.5">{label}</p>
      <p className={mono ? "font-mono" : ""}>{value}</p>
    </div>
  )
}
