/** Uso de un perfil o escenario por sesiones (GET /profiles|scenarios/{id}/usage). */
export type CaseUsage = {
  total_sessions: number
  sessions_with_activity: number
  unused_sessions: number
  can_delete: boolean
  allowed: boolean
}
