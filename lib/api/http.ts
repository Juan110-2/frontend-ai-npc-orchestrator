/**
 * Cliente HTTP interno para el backend FastAPI (orquestador).
 *
 * Flujo de autenticación:
 *   1. El usuario hace login con Supabase → recibe un access_token JWT.
 *   2. Cada request al backend incluye ese token en Authorization: Bearer <token>.
 *   3. El backend (app/core/auth.py) valida el token contra SUPABASE_JWT_SECRET.
 *   4. Las rutas /sessions/* y /conversation/* exigen el token; sin él responden 401.
 *
 * Módulo interno de lib/api/ — no se re-exporta desde el índice público.
 */
import { createClient } from '@/lib/supabase/client'

export const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

/**
 * Obtiene el JWT de la sesión activa de Supabase.
 * Retorna null si no hay sesión (el backend responderá 401 en las rutas protegidas).
 */
export async function getToken(): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  } catch {
    return null
  }
}

/** Error de una respuesta HTTP no exitosa del backend, con el código de estado. */
export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
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
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}
