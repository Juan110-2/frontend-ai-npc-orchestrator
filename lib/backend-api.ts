/**
 * Cliente HTTP para el backend FastAPI (orquestador).
 *
 * Flujo de autenticación:
 *   1. El usuario hace login con Supabase → recibe un access_token JWT.
 *   2. Cada request al backend incluye ese token en Authorization: Bearer <token>.
 *   3. El backend (app/core/auth.py) valida el token contra SUPABASE_JWT_SECRET.
 *   4. Si SUPABASE_JWT_SECRET no está definido en el backend, la validación se omite
 *      (modo desarrollo sin auth).
 *
 * Para obtener el token: usar getAccessToken() del AuthContext,
 * o pasar el token directamente a las funciones que lo requieran.
 */
import { createClient } from '@/lib/supabase/client'

// ── Tipos del backend ─────────────────────────────────────────────────────────

export type BackendProfile = {
  id: string
  name: string
  description: string
  traits: Record<string, unknown>
  behavior?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type BackendScenario = {
  id: string
  name: string
  context: string
  severity: number
  risk_flags: string[]
  constraints: Record<string, unknown>
  created_at: string
}

export type TimeSource = 'explicit' | 'estimated' | 'unavailable' | 'none'

export type BackendSession = {
  id: string
  profile_id: string
  scenario_id: string
  user_id: string | null
  assigned_by: string | null
  assigned_at: string | null
  status: 'active' | 'completed' | 'terminated'
  accumulated_seconds: number
  time_source: TimeSource
  last_interaction_at: string | null
  current_severity: number
  started_at: string
  ended_at: string | null
  last_ai_model?: string | null
}

export type BackendConversationMessage = {
  id: string
  session_id: string
  role: 'trainee' | 'patient'
  content: string
  severity: number
  risk_flags: string[]
  ai_provider?: string | null
  ai_model?: string | null
  tokens_input?: number | null
  tokens_output?: number | null
  tokens_used?: number | null
  latency_ms?: number | null
  created_at: string
}

// ── HTTP client ───────────────────────────────────────────────────────────────

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

/**
 * Obtiene el JWT de la sesión activa de Supabase.
 * Retorna null si no hay sesión (el backend aceptará la request sin auth si no tiene JWT_SECRET configurado).
 */
async function getToken(): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  } catch {
    return null
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken()

  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    const text = await response.text()
    let message = `Error ${response.status}`
    try {
      const json = JSON.parse(text)
      message = json.detail ?? json.message ?? message
    } catch {
      message = text || message
    }
    throw new Error(message)
  }

  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export async function listProfiles() {
  return request<BackendProfile[]>('/profiles/')
}

export async function getProfile(profileId: string) {
  return request<BackendProfile>(`/profiles/${profileId}`)
}

export async function createProfile(payload: {
  name: string
  description: string
  traits: Record<string, unknown>
  behavior?: Record<string, unknown>
}) {
  return request<BackendProfile>('/profiles/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateProfile(
  profileId: string,
  payload: {
    name?: string
    description?: string
    traits?: Record<string, unknown>
    behavior?: Record<string, unknown>
  },
) {
  return request<BackendProfile>(`/profiles/${profileId}/update`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteProfile(profileId: string) {
  return request<void>(`/profiles/${profileId}/delete`, { method: 'DELETE' })
}

// ── Scenarios ─────────────────────────────────────────────────────────────────

export async function listScenarios() {
  return request<BackendScenario[]>('/scenarios/')
}

export async function getScenario(scenarioId: string) {
  return request<BackendScenario>(`/scenarios/${scenarioId}`)
}

export async function createScenario(payload: {
  name: string
  context: string
  severity: number
  risk_flags?: string[]
  constraints?: Record<string, unknown>
}) {
  return request<BackendScenario>('/scenarios/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateScenario(
  scenarioId: string,
  payload: {
    name?: string
    context?: string
    severity?: number
    risk_flags?: string[]
    constraints?: Record<string, unknown>
  },
) {
  return request<BackendScenario>(`/scenarios/${scenarioId}/update`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteScenario(scenarioId: string) {
  return request<void>(`/scenarios/${scenarioId}/delete`, { method: 'DELETE' })
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export type PaginatedSessions = {
  items: BackendSession[]
  total: number
  page: number
  pages: number
  limit: number
}

export async function listSessions(params?: {
  page?: number
  limit?: number
  view?: 'mine' | 'assigned'
  status?: 'active' | 'completed' | 'terminated'
}) {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.view) qs.set('view', params.view)
  if (params?.status) qs.set('status', params.status)
  const query = qs.toString() ? `?${qs.toString()}` : ''
  return request<PaginatedSessions>(`/sessions/${query}`)
}

export async function getSession(sessionId: string) {
  return request<BackendSession>(`/sessions/${sessionId}`)
}

export async function startSession(payload: {
  profile_id: string
  scenario_id: string
  user_id?: string
  assigned_by?: string
}) {
  return request<BackendSession>('/sessions/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function endSession(
  sessionId: string,
  closingKind?: 'success' | 'crisis' | 'inappropriate',
) {
  return request<{ message: string; session_id: string; ended_at: string; status: string }>(
    `/sessions/${sessionId}/end`,
    {
      method: 'PATCH',
      body: JSON.stringify({ closing_kind: closingKind ?? null }),
    },
  )
}

export async function patchSessionTime(
  sessionId: string,
  deltaSeconds: number,
): Promise<void> {
  if (deltaSeconds <= 0) return
  // Fire-and-forget — not critical; display relies on local state
  await request<BackendSession>(`/sessions/${sessionId}/time`, {
    method: 'PATCH',
    body: JSON.stringify({ delta_seconds: Math.round(deltaSeconds) }),
  })
}

// ── Conversation ──────────────────────────────────────────────────────────────

export async function getConversationHistory(sessionId: string) {
  return request<BackendConversationMessage[]>(`/conversation/${sessionId}/history`)
}

export async function sendConversationMessage(sessionId: string, content: string) {
  return request<BackendConversationMessage>(`/conversation/${sessionId}`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

/**
 * Conecta al endpoint SSE de streaming.
 * Retorna un EventSource que emite chunks del NPC en tiempo real.
 *
 * Uso en el componente:
 *   const es = await connectConversationStream(sessionId, content)
 *   es.onmessage = (e) => {
 *     const data = JSON.parse(e.data)
 *     if (data.chunk) setResponse(prev => prev + data.chunk)
 *     if (data.done) { setSeverity(data.severity); es.close() }
 *   }
 */
export type StreamDonePayload = {
  severity: number
  should_close: boolean
  closing_kind: 'success' | 'crisis' | 'inappropriate' | null
  metrics?: {
    provider: string
    model: string
    tokens_input: number
    tokens_output: number
    latency_ms: number
    ttft_ms: number
  }
}

export type StreamHandle = {
  close: () => void
  onChunk: (cb: (text: string) => void) => void
  onDone: (cb: (data: StreamDonePayload) => void) => void
  onError: (cb: (err: Error) => void) => void
  /** Llama esto DESPUES de configurar los callbacks para empezar a leer */
  start: () => void
}

/**
 * Conecta al endpoint SSE de streaming. Resuelve el race condition con
 * onChunk/onDone: el reader NO arranca hasta que el caller llame start().
 */
export async function connectConversationStream(
  sessionId: string,
  content: string,
): Promise<StreamHandle> {
  const token = await getToken()

  const response = await fetch(`${BACKEND_BASE_URL}/conversation/${sessionId}/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Error ${response.status}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  let chunkCallback: ((text: string) => void) | null = null
  let doneCallback: ((data: StreamDonePayload) => void) | null = null
  let errorCallback: ((err: Error) => void) | null = null
  let closed = false
  let started = false

  const readLoop = async () => {
    let buffer = ''
    try {
      while (!closed) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const payload = JSON.parse(line.slice(6))
            if (payload.chunk && chunkCallback) chunkCallback(payload.chunk)
            if (payload.done && doneCallback) {
              doneCallback({
                severity: payload.severity,
                should_close: payload.should_close,
                closing_kind: payload.closing_kind ?? null,
                metrics: payload.metrics,
              })
            }
          } catch {
            // chunk malformado — ignorar
          }
        }
      }
    } catch (err) {
      if (errorCallback) errorCallback(err as Error)
    }
  }

  return {
    close: () => { closed = true; reader.cancel().catch(() => {}) },
    onChunk: (cb) => { chunkCallback = cb },
    onDone: (cb) => { doneCallback = cb },
    onError: (cb) => { errorCallback = cb },
    start: () => {
      if (started) return
      started = true
      void readLoop()
    },
  }
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export type BackendUserProfile = {
  id: string
  email: string
  full_name: string | null
  role: 'student' | 'teacher' | 'admin'
  created_at: string
  updated_at: string
}

export async function getMyProfile() {
  return request<BackendUserProfile>('/admin/me')
}

export async function adminListUsers() {
  return request<BackendUserProfile[]>('/admin/users')
}

export async function listStudents() {
  return request<BackendUserProfile[]>('/admin/students')
}

export async function adminUpdateUser(
  userId: string,
  payload: { role?: 'student' | 'teacher' | 'admin'; full_name?: string },
) {
  return request<BackendUserProfile>(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

// =============================================================================
// EVALUATION (Capítulo 5: evaluación pedagógica con trazabilidad)
// =============================================================================

export type RubricCriterion = {
  key: string
  label: string
  max_score: number
  weight: number
  description?: string
}

export type ActiveRubric = {
  id: string
  version: number
  name: string
  description: string | null
  criteria: RubricCriterion[]
  is_active: boolean
}

export type AutomaticMetrics = {
  turns_total?: number
  turns_trainee?: number
  turns_patient?: number
  duration_minutes?: number | null
  severity_peak?: number | null
  severity_final?: number | null
  risk_alerts_detected?: number
  mean_patient_latency_ms?: number | null
  classifier_calls_by_status?: Record<string, number>
}

export type EvaluationResponse = {
  id: string
  session_id: string
  student_id: string | null
  evaluator_id: string | null
  rubric_id: string | null
  status: 'draft' | 'submitted' | 'reviewed'
  automatic_metrics: AutomaticMetrics
  scores: Record<string, number>
  teacher_feedback: string | null
  overall_score: number | null
  created_at: string | null
  updated_at: string | null
  submitted_at: string | null
}

export type StudentEvaluationItem = {
  id: string
  session_id: string
  status: 'draft' | 'submitted' | 'reviewed'
  automatic_metrics: AutomaticMetrics
  scores: Record<string, number>
  teacher_feedback: string | null
  submitted_at: string | null
  created_at: string | null
}

export async function getActiveRubric() {
  return request<ActiveRubric>('/evaluation/rubric/active')
}

export async function runAutoEvaluation(sessionId: string) {
  return request<EvaluationResponse>(`/evaluation/${sessionId}/auto`, {
    method: 'POST',
  })
}

export async function getEvaluation(sessionId: string) {
  return request<EvaluationResponse>(`/evaluation/${sessionId}`)
}

export async function submitEvaluation(
  sessionId: string,
  payload: {
    scores: Record<string, number>
    teacher_feedback?: string | null
    status?: 'draft' | 'submitted' | 'reviewed'
  },
) {
  return request<EvaluationResponse>(`/evaluation/${sessionId}`, {
    method: 'PUT',
    body: JSON.stringify({
      scores: payload.scores,
      teacher_feedback: payload.teacher_feedback ?? null,
      status: payload.status ?? 'submitted',
    }),
  })
}

export async function listStudentEvaluations(studentId: string) {
  return request<StudentEvaluationItem[]>(`/evaluation/student/${studentId}`)
}

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


export type EvaluationListItem = {
  id: string
  session_id: string
  student_id: string | null
  student_name: string | null
  assigned_by_id: string | null
  assigned_by_name: string | null
  status: 'draft' | 'submitted' | 'reviewed'
  patient_name: string | null
  started_at: string | null
  ended_at: string | null
  automatic_metrics: {
    turns_trainee?: number
    turns_patient?: number
    turns_total?: number
    risk_alerts_detected?: number
    severity_peak?: number
    severity_final?: number
    duration_minutes?: number
    last_ai_model?: string | null
    [key: string]: unknown
  }
  scores: Record<string, number>
  submitted_at: string | null
  created_at: string | null
}

export async function listEvaluations(params?: { session_ids?: string[] }) {
  const qs = new URLSearchParams()
  params?.session_ids?.forEach(id => qs.append('session_ids', id))
  const query = qs.toString() ? `?${qs.toString()}` : ''
  return request<EvaluationListItem[]>(`/evaluation/${query}`)
}


/**
 * Exporta la transcripción de una sesión como JSON estructurado (.txt).
 * Formato pensado para evaluación por IA: incluye contexto clínico, mensajes y métricas.
 */
export async function exportConversationJSON(
  sessionId: string,
): Promise<{ filename: string; content: string }> {
  const [session, history] = await Promise.all([
    getSession(sessionId),
    getConversationHistory(sessionId),
  ])

  const [profileData, scenarioData] = await Promise.all([
    getProfile(session.profile_id).catch(() => null),
    getScenario(session.scenario_id).catch(() => null),
  ])

  const lastPatient = [...history].reverse().find((m) => m.role === 'patient')

  let turnIndex = 0
  const messages = history.map((m) => {
    if (m.role === 'trainee') turnIndex++
    const base: Record<string, unknown> = {
      turn: turnIndex,
      role: m.role === 'trainee' ? 'student' : 'patient',
      content: m.content,
      timestamp: m.created_at,
      severity: m.severity,
    }
    if (m.role === 'patient') {
      if (m.tokens_input != null) base.tokens_in = m.tokens_input
      if (m.tokens_output != null) base.tokens_out = m.tokens_output
      if (m.latency_ms != null) base.latency_ms = Math.round(m.latency_ms)
    }
    return base
  })

  const startedAt = new Date(session.started_at)
  const endedAt = session.ended_at ? new Date(session.ended_at) : null
  const durationMinutes = endedAt
    ? Math.round((endedAt.getTime() - startedAt.getTime()) / 60000)
    : null

  const payload = {
    exported_at: new Date().toISOString(),
    session_id: session.id,
    profile: profileData
      ? { name: profileData.name, behavior: profileData.behavior ?? null }
      : null,
    scenario: scenarioData
      ? {
          title: scenarioData.name,
          situation: scenarioData.context ?? null,
          initial_severity: scenarioData.severity,
        }
      : null,
    session: {
      started_at: session.started_at,
      ended_at: session.ended_at ?? null,
      status: session.status,
      initial_severity: scenarioData?.severity ?? null,
      final_severity: session.current_severity,
      duration_minutes: durationMinutes,
      n_turns: turnIndex,
    },
    ai: {
      provider: lastPatient?.ai_provider ?? null,
      model: lastPatient?.ai_model ?? null,
    },
    messages,
  }

  const filename = `sesion-${session.id.slice(0, 8)}.txt`
  return { filename, content: JSON.stringify(payload, null, 2) }
}

/** Devuelve { provider, model } del último mensaje del paciente, útil para listados. */
export async function getSessionModelInfo(
  sessionId: string,
): Promise<{ provider: string | null; model: string | null }> {
  try {
    const history = await getConversationHistory(sessionId)
    const last = [...history].reverse().find((m) => m.role === 'patient' && m.ai_model)
    return { provider: last?.ai_provider ?? null, model: last?.ai_model ?? null }
  } catch {
    return { provider: null, model: null }
  }
}
