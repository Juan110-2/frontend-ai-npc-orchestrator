/**
 * Permisos sobre perfiles y escenarios (casos).
 *
 * Editar (y eliminar) un caso solo lo puede hacer su autor o un administrador.
 * Los casos sin autor (created_by nulo) solo los gestiona un administrador.
 * Clonar o duplicar sigue abierto a todo docente o administrador.
 * El backend aplica la misma regla y responde 403 si no se cumple.
 */

type CaseUser = { id: string } | null | undefined

export const CASE_EDIT_RESTRICTED_MESSAGE =
  'Solo su autor o un administrador pueden editarlo. Puedes duplicarlo para crear tu propia versión.'

export function canManageCase(
  createdBy: string | null | undefined,
  user: CaseUser,
  role: string | null | undefined,
): boolean {
  if (!user) return false
  if (role === 'admin') return true
  return !!createdBy && createdBy === user.id
}
