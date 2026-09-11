import { getConversationHistory } from './chat'
import { getProfile } from './profiles'
import { getScenario } from './scenarios'
import { getSession } from './sessions'

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

/** Devuelve { provider, model } del último mensaje del NPC, útil para listados. */
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
