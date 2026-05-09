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

export type BackendSession = {
  id: string
  profile_id: string
  scenario_id: string
  user_id: string | null
  current_severity: number
  started_at: string
  ended_at: string | null
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
}) {
  return request<BackendProfile>('/profiles/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateProfile(
  profileId: string,
  payload: { name?: string; description?: string; traits?: Record<string, unknown> },
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

export async function listSessions() {
  return request<BackendSession[]>('/sessions/')
}

export async function getSession(sessionId: string) {
  return request<BackendSession>(`/sessions/${sessionId}`)
}

export async function startSession(payload: {
  profile_id: string
  scenario_id: string
}) {
  return request<BackendSession>('/sessions/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function endSession(sessionId: string) {
  return request<{ message: string; session_id: string; ended_at: string }>(
    `/sessions/${sessionId}/end`,
    { method: 'PATCH' },
  )
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
export async function connectConversationStream(
  sessionId: string,
  content: string,
): Promise<{ close: () => void; onChunk: (cb: (text: string) => void) => void; onDone: (cb: (severity: number, shouldClose: boolean) => void) => void }> {
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
  let doneCallback: ((severity: number, shouldClose: boolean) => void) | null = null
  let closed = false

  // Procesar el stream en background
  ;(async () => {
    let buffer = ''
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
            doneCallback(payload.severity, payload.should_close)
          }
        } catch {
          // chunk malformado — ignorar
        }
      }
    }
  })()

  return {
    close: () => { closed = true; reader.cancel() },
    onChunk: (cb) => { chunkCallback = cb },
    onDone: (cb) => { doneCallback = cb },
  }
}
