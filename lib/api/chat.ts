import { BACKEND_BASE_URL, getToken, request } from './http'

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

/** Error al abrir el stream (respuesta HTTP no exitosa) con mensaje ya legible. */
export class ChatStreamError extends Error {
  status?: number
  /** El servidor confirmó que deshizo el turno (evento `error` con `discarded: true`) */
  discarded: boolean
  constructor(message: string, status?: number, discarded = false) {
    super(message)
    this.name = 'ChatStreamError'
    this.status = status
    this.discarded = discarded
  }

  /**
   * Solo es seguro reenviar el mensaje si el servidor descartó el turno o rechazó
   * la petición por límite (429, no se guardó nada). En cualquier otro fallo no se
   * sabe si el mensaje quedó guardado: hay que consultar al servidor.
   */
  get safeToRetry(): boolean {
    return this.discarded || this.status === 429
  }
}

function httpErrorMessage(status: number, text: string): string {
  if (status === 429) {
    return 'Alcanzaste el límite de mensajes permitidos. Intenta de nuevo más tarde.'
  }
  try {
    const json = JSON.parse(text)
    const detail = json.detail ?? json.message
    if (typeof detail === 'string' && detail.trim()) return detail
  } catch {
    // no es JSON
  }
  return `Error ${status}`
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
    throw new ChatStreamError(httpErrorMessage(response.status, text), response.status)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  let chunkCallback: ((text: string) => void) | null = null
  let doneCallback: ((data: StreamDonePayload) => void) | null = null
  let errorCallback: ((err: Error) => void) | null = null
  let closed = false
  let started = false
  // El stream termina una sola vez: con `done` o con un error (nunca ambos ni dos veces)
  let settled = false

  const fail = (err: Error) => {
    if (settled || closed) return
    settled = true
    closed = true
    reader.cancel().catch(() => {})
    if (errorCallback) errorCallback(err)
  }

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
          if (closed) break
          if (!line.startsWith('data: ')) continue
          let payload: any
          try {
            payload = JSON.parse(line.slice(6))
          } catch {
            continue // chunk malformado — ignorar
          }
          if (payload.error) {
            fail(
              new ChatStreamError(
                typeof payload.error === 'string' ? payload.error : 'Error al generar la respuesta',
                undefined,
                payload.discarded === true,
              ),
            )
            return
          }
          if (payload.chunk && chunkCallback) chunkCallback(payload.chunk)
          if (payload.done) {
            settled = true
            if (doneCallback) {
              doneCallback({
                severity: payload.severity,
                should_close: payload.should_close,
                closing_kind: payload.closing_kind ?? null,
                metrics: payload.metrics,
              })
            }
          }
        }
      }
      // El stream terminó sin `done` ni error (corte de conexión)
      if (!settled) fail(new ChatStreamError('La conexión se cerró antes de completar la respuesta'))
    } catch (err) {
      fail(err as Error)
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
