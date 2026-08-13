import { request } from './http'

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
