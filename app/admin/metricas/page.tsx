"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, RefreshCw, BarChart3, ListTree, ScrollText } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import {
  getMetricsSummary,
  getProviderMetrics,
  getMetricsCalls,
  type MetricsSummary,
  type ProviderMetricRow,
  type AICallLogRow,
} from "@/lib/backend-api"

export default function AdminMetricsPage() {
  const router = useRouter()
  const { userRole, isLoading: authLoading } = useAuth()

  const [summary, setSummary] = useState<MetricsSummary | null>(null)
  const [providers, setProviders] = useState<ProviderMetricRow[]>([])
  const [calls, setCalls] = useState<AICallLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [purposeFilter, setPurposeFilter] = useState<string>("all")

  // Guardar solo si es admin
  useEffect(() => {
    if (!authLoading && userRole !== 'admin') {
      router.replace('/')
    }
  }, [authLoading, userRole, router])

  const loadAll = async (purpose?: string) => {
    setLoading(true)
    try {
      const [s, p, c] = await Promise.all([
        getMetricsSummary(),
        getProviderMetrics(purpose === "all" ? undefined : purpose),
        getMetricsCalls({ limit: 50 }),
      ])
      setSummary(s)
      setProviders(p)
      setCalls(c)
    } catch (err) {
      toast.error("Error cargando métricas: " + String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && userRole === 'admin') void loadAll(purposeFilter)
  }, [purposeFilter, authLoading, userRole])

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
        <TabsList>
          <TabsTrigger value="providers">
            <BarChart3 className="mr-2 h-4 w-4" /> Por proveedor
          </TabsTrigger>
          <TabsTrigger value="purposes">
            <ListTree className="mr-2 h-4 w-4" /> Por propósito
          </TabsTrigger>
          <TabsTrigger value="calls">
            <ScrollText className="mr-2 h-4 w-4" /> Logs crudos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Matriz comparativa por proveedor / modelo / propósito</CardTitle>
              <CardDescription>
                Filtrable por propósito. Fuente: <code>public.v_provider_metrics</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Propósito:</span>
                <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="orchestrator">Orchestrator</SelectItem>
                    <SelectItem value="classifier">Classifier</SelectItem>
                    <SelectItem value="evaluator">Evaluator</SelectItem>
                    <SelectItem value="bench">Bench</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Propósito</TableHead>
                      <TableHead className="text-right">N</TableHead>
                      <TableHead className="text-right">% éxito</TableHead>
                      <TableHead className="text-right">p50 ms</TableHead>
                      <TableHead className="text-right">p95 ms</TableHead>
                      <TableHead className="text-right">Tokens in (μ)</TableHead>
                      <TableHead className="text-right">Tokens out (μ)</TableHead>
                      <TableHead className="text-right">% JSON válido</TableHead>
                      <TableHead className="text-right">Costo USD</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell><Badge variant="secondary">{r.provider}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{r.model}</TableCell>
                        <TableCell><Badge variant="outline">{r.purpose}</Badge></TableCell>
                        <TableCell className="text-right">{r.n_calls}</TableCell>
                        <TableCell className="text-right">{r.success_rate_pct ?? "—"}</TableCell>
                        <TableCell className="text-right">{r.p50_latency_ms != null ? Math.round(r.p50_latency_ms) : "—"}</TableCell>
                        <TableCell className="text-right">{r.p95_latency_ms != null ? Math.round(r.p95_latency_ms) : "—"}</TableCell>
                        <TableCell className="text-right">{r.mean_tokens_input != null ? Math.round(r.mean_tokens_input) : "—"}</TableCell>
                        <TableCell className="text-right">{r.mean_tokens_output != null ? Math.round(r.mean_tokens_output) : "—"}</TableCell>
                        <TableCell className="text-right">{r.json_valid_rate_pct ?? "—"}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{r.total_cost_usd != null ? `$${r.total_cost_usd.toFixed(6)}` : "—"}</TableCell>
                      </TableRow>
                    ))}
                    {providers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                          No hay datos. Ejecuta <code>scripts/bench_providers.py</code> o genera tráfico real.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purposes">
          <Card>
            <CardHeader>
              <CardTitle>Resumen por propósito</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Propósito</TableHead>
                    <TableHead className="text-right">N llamadas</TableHead>
                    <TableHead className="text-right">Latencia media (ms)</TableHead>
                    <TableHead className="text-right">% JSON válido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary?.by_purpose.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell><Badge variant="outline">{p.purpose}</Badge></TableCell>
                      <TableCell className="text-right">{p.n_calls}</TableCell>
                      <TableCell className="text-right">{p.mean_latency_ms ?? "—"}</TableCell>
                      <TableCell className="text-right">{p.json_valid_rate_pct ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {(!summary || summary.by_purpose.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sin datos</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calls">
          <Card>
            <CardHeader>
              <CardTitle>Últimas 50 llamadas</CardTitle>
              <CardDescription>Para auditoría y debugging</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Propósito</TableHead>
                    <TableHead>Modo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Latencia</TableHead>
                    <TableHead className="text-right">TTFT</TableHead>
                    <TableHead>JSON?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs font-mono">
                        {c.created_at ? new Date(c.created_at).toLocaleTimeString() : "—"}
                      </TableCell>
                      <TableCell><Badge variant="secondary">{c.provider}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{c.model}</TableCell>
                      <TableCell><Badge variant="outline">{c.purpose}</Badge></TableCell>
                      <TableCell>{c.call_mode}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "ok" ? "default" : "destructive"}>
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {c.tokens_input != null && c.tokens_output != null
                          ? `${c.tokens_input}+${c.tokens_output}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">{c.latency_ms != null ? `${Math.round(c.latency_ms)} ms` : "—"}</TableCell>
                      <TableCell className="text-right">{c.ttft_ms != null && c.ttft_ms > 0 ? `${Math.round(c.ttft_ms)} ms` : "—"}</TableCell>
                      <TableCell>{c.json_valid == null ? "—" : c.json_valid ? "✓" : "✗"}</TableCell>
                    </TableRow>
                  ))}
                  {calls.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                        No hay llamadas registradas todavía.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string | number
  highlight?: "destructive"
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={`text-2xl font-bold ${
            highlight === "destructive" ? "text-destructive" : ""
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

function pct(num: number, den: number) {
  if (!den) return "—"
  return ((num / den) * 100).toFixed(1)
}
