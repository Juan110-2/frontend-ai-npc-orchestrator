import { request } from './http'

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
