import { request } from './http'

// =============================================================================
// ADMIN METRICS (Capítulo 3: matriz comparativa de APIs de IA)
// =============================================================================

export type MetricsSummaryTotals = {
  total_calls: number
  total_ok: number
  total_errors: number
  total_tokens_in: number
  total_tokens_out: number
  total_cost_usd: number
  n_providers: number
  n_sessions: number
}

export type MetricsByProvider = {
  provider: string
  model: string
  n_calls: number
  n_ok: number
  success_rate_pct: number | null
  mean_latency_ms: number | null
  cost_usd: number | null
}

export type MetricsByPurpose = {
  purpose: string
  n_calls: number
  mean_latency_ms: number | null
  json_valid_rate_pct: number | null
}

export type MetricsSummary = {
  totals: MetricsSummaryTotals
  by_provider: MetricsByProvider[]
  by_purpose: MetricsByPurpose[]
}

export type ProviderMetricRow = {
  provider: string
  model: string
  purpose: string
  n_calls: number
  n_ok: number
  n_errors: number
  success_rate_pct: number | null
  p50_latency_ms: number | null
  p95_latency_ms: number | null
  p99_latency_ms: number | null
  mean_latency_ms: number | null
  mean_ttft_ms: number | null
  p95_ttft_ms: number | null
  mean_tokens_input: number | null
  mean_tokens_output: number | null
  total_tokens_input: number | null
  total_tokens_output: number | null
  json_valid_rate_pct: number | null
  total_cost_usd: number | null
  mean_cost_usd_per_call: number | null
}

export type AICallLogRow = {
  id: string
  session_id: string | null
  provider: string
  model: string
  purpose: string
  call_mode: string
  status: string
  category: string | null
  tokens_input: number | null
  tokens_output: number | null
  latency_ms: number | null
  ttft_ms: number | null
  json_valid: boolean | null
  response_chars: number | null
  prompt_chars: number | null
  cost_usd: number | null
  error_detail: string | null
  created_at: string | null
}

export type PaginatedCalls = {
  items: AICallLogRow[]
  total: number
  limit: number
  offset: number
}

export async function getMetricsSummary() {
  return request<MetricsSummary>('/admin/metrics/summary')
}

export async function getProviderMetrics(purpose?: string) {
  const qs = purpose ? `?purpose=${encodeURIComponent(purpose)}` : ''
  return request<ProviderMetricRow[]>(`/admin/metrics/providers${qs}`)
}

export async function getMetricsCalls(opts?: {
  provider?: string
  purpose?: string
  session_id?: string
  limit?: number
  offset?: number
}) {
  const params = new URLSearchParams()
  if (opts?.provider) params.set('provider', opts.provider)
  if (opts?.purpose) params.set('purpose', opts.purpose)
  if (opts?.session_id) params.set('session_id', opts.session_id)
  if (opts?.limit != null) params.set('limit', String(opts.limit))
  if (opts?.offset != null) params.set('offset', String(opts.offset))
  const qs = params.toString() ? `?${params.toString()}` : ''
  return request<PaginatedCalls>(`/admin/metrics/calls${qs}`)
}
