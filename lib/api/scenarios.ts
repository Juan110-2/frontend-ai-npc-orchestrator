import { request } from './http'

export type BackendScenario = {
  id: string
  name: string
  context: string
  severity: number
  risk_flags: string[]
  constraints: Record<string, unknown>
  created_at: string
}

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
